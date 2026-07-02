import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Trip, PaymentMethod, TripStatus } from './entities/trip.entity';
import { DispatchService } from '../dispatch/dispatch.service';
import { DispatchGateway } from '../dispatch/dispatch.gateway';
import { WalletService, CASH_TRIP_MIN_WALLET_BALANCE } from '../wallet/wallet.service';
import { UsersService } from '../users/users.service';
import { LedgerEntryType } from '../wallet/entities/ledger-entry.entity';
import { PlacesService } from '../places/places.service';
import { FraudService } from '../fraud/fraud.service';

const COMMISSION_RATE = 0.1; // TRY's 10% take per completed ride.

// Tricycle fare formula for the Onitsha pilot — flat base fare plus a per-km rate.
// Deliberately simple; revisit once real trip data suggests a better curve.
const BASE_FARE = 250;
const PER_KM_RATE = 110;
const MINIMUM_FARE = 350;

// How far a driver-reported finalFare may drift from the system's own
// estimatedFare before completeTrip rejects it outright. Bounds the damage a
// malicious/buggy driver client can do (e.g. finalFare: 1 to dodge
// commission, or an inflated figure to drain a wallet-paying rider).
const FARE_DRIFT_TOLERANCE = 0.3;

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip) private readonly trips: Repository<Trip>,
    private readonly dispatchService: DispatchService,
    private readonly dispatchGateway: DispatchGateway,
    private readonly walletService: WalletService,
    private readonly usersService: UsersService,
    private readonly placesService: PlacesService,
    private readonly dataSource: DataSource,
    private readonly fraudService: FraudService,
  ) {}

  async estimateFare(pickup: { lat: number; lng: number }, dropoff: { lat: number; lng: number }) {
    const { distanceKm, durationMin } = await this.placesService.distanceAndDuration(pickup, dropoff);
    const fare = Math.max(MINIMUM_FARE, Math.round(BASE_FARE + distanceKm * PER_KM_RATE));
    return { distanceKm, durationMin, fare };
  }

  async requestTrip(input: {
    riderId: string;
    paymentMethod: PaymentMethod;
    pickupLat: number;
    pickupLng: number;
    dropoffLat: number;
    dropoffLng: number;
    estimatedFare: number;
  }) {
    const trip = await this.trips.save(this.trips.create({ ...input, status: TripStatus.REQUESTED }));
    const candidates = await this.dispatchService.broadcastWithExpansion(input.pickupLat, input.pickupLng);
    const candidateDriverIds = candidates.map((c) => c.driverId);

    const delivered = this.dispatchGateway.sendTripOffer(candidateDriverIds, {
      tripId: trip.id,
      pickupLat: trip.pickupLat,
      pickupLng: trip.pickupLng,
      dropoffLat: trip.dropoffLat,
      dropoffLng: trip.dropoffLng,
      estimatedFare: trip.estimatedFare ?? input.estimatedFare,
      paymentMethod: trip.paymentMethod,
    });

    return { trip, candidateDriverIds, deliveredCount: delivered };
  }

  /**
   * Driver accepts a trip offer. For cash trips this is where the ₦1,000 wallet
   * floor is enforced — it's the driver's collateral for the commission they'll
   * owe once the trip completes (since cash never touches TRY's rails).
   */
  async acceptTrip(tripId: string, driverId: string) {
    const trip = await this.findOrThrow(tripId);
    if (trip.status !== TripStatus.REQUESTED) {
      throw new BadRequestException('Trip is no longer available');
    }

    if (trip.paymentMethod === PaymentMethod.CASH) {
      const balance = await this.walletService.getBalance(driverId);
      if (!this.walletService.canAcceptCashTrip(balance)) {
        throw new BadRequestException(
          `Driver wallet balance must be at least ₦${CASH_TRIP_MIN_WALLET_BALANCE} to accept a cash trip`,
        );
      }
    }

    trip.driverId = driverId;
    trip.status = TripStatus.MATCHED;
    await this.trips.save(trip);

    const driver = await this.usersService.findById(driverId).catch(() => null);
    const driverProfile = driver ? this.usersService.toPublicDriverProfile(driver) : null;

    // Pushed straight to the rider app the instant a driver accepts: photo,
    // name, phone, plate — so the rider doesn't have to poll for a match.
    this.dispatchGateway.notifyUser(trip.riderId, 'trip:matched', { tripId: trip.id, driverProfile });

    return { trip, driverProfile };
  }

  async startTrip(tripId: string, callerId: string) {
    const trip = await this.findOrThrow(tripId);
    if (trip.driverId !== callerId) throw new ForbiddenException('Only the assigned driver can start this trip');

    trip.status = TripStatus.IN_PROGRESS;
    await this.trips.save(trip);
    this.dispatchGateway.notifyUser(trip.riderId, 'trip:started', { tripId: trip.id });
    return trip;
  }

  /**
   * Trip completion settlement. Wallet trips: fare moves rider -> driver minus
   * commission, in one atomic ledger post. Cash trips: rider pays the driver
   * directly, and only the commission is debited from the driver's wallet.
   *
   * Runs as one DB transaction covering both wallet posts and the trip status
   * update — a crash mid-settlement can't leave a half-paid trip. Ledger
   * entries carry a deterministic externalReference keyed on tripId, so a
   * retried completeTrip call (flaky network, duplicate client request) hits
   * the unique constraint and is treated as "already settled" instead of
   * double-posting.
   */
  async completeTrip(tripId: string, callerId: string, finalFare: number) {
    const trip = await this.findOrThrow(tripId);
    if (!trip.driverId) throw new BadRequestException('Trip has no assigned driver');
    if (trip.driverId !== callerId) throw new ForbiddenException('Only the assigned driver can complete this trip');
    if (trip.status === TripStatus.COMPLETED) return trip; // already settled — idempotent no-op

    if (trip.estimatedFare) {
      const min = trip.estimatedFare * (1 - FARE_DRIFT_TOLERANCE);
      const max = trip.estimatedFare * (1 + FARE_DRIFT_TOLERANCE);
      if (finalFare < min || finalFare > max) {
        throw new BadRequestException(`finalFare must be within ${Math.round(FARE_DRIFT_TOLERANCE * 100)}% of the estimated fare`);
      }
    }

    const commission = Math.round(finalFare * COMMISSION_RATE * 100) / 100;
    const driverEarning = finalFare - commission;

    try {
      await this.dataSource.transaction(async (manager) => {
        const driverWallet = await this.walletService.getOrCreateWallet(trip.driverId!);

        if (trip.paymentMethod === PaymentMethod.WALLET) {
          const riderWallet = await this.walletService.getOrCreateWallet(trip.riderId);
          await this.walletService.post(
            riderWallet.id,
            [{ type: LedgerEntryType.TRIP_FARE_DEBIT, amount: -finalFare, tripId: trip.id, externalReference: `trip_${trip.id}_fare` }],
            manager,
          );
          await this.walletService.post(
            driverWallet.id,
            [{ type: LedgerEntryType.DRIVER_EARNING_CREDIT, amount: driverEarning, tripId: trip.id, externalReference: `trip_${trip.id}_earning` }],
            manager,
          );
        } else {
          // Cash trip: rider already paid the driver in person; TRY only collects its cut.
          await this.walletService.post(
            driverWallet.id,
            [{ type: LedgerEntryType.COMMISSION_DEBIT, amount: -commission, tripId: trip.id, externalReference: `trip_${trip.id}_commission` }],
            manager,
          );
        }

        trip.status = TripStatus.COMPLETED;
        trip.finalFare = finalFare;
        trip.commissionAmount = commission;
        await manager.save(Trip, trip);
      });
    } catch (err: any) {
      // Unique violation on externalReference means this trip was already
      // settled by a concurrent/retried call — treat as success, not an error.
      if (err?.code === '23505') return this.findOrThrow(tripId);
      throw err;
    }

    this.dispatchGateway.notifyUser(trip.riderId, 'trip:completed', { tripId: trip.id, finalFare });

    // Fraud checks run after settlement is already durable — a check
    // failing (e.g. a Places API hiccup computing distance) must never
    // block or roll back a trip that already paid out correctly.
    this.runPostCompletionFraudChecks(trip).catch(() => {});

    return trip;
  }

  private async runPostCompletionFraudChecks(trip: Trip) {
    const { distanceKm } = await this.placesService.distanceAndDuration(
      { lat: trip.pickupLat, lng: trip.pickupLng },
      { lat: trip.dropoffLat, lng: trip.dropoffLng },
    );
    await Promise.all([
      this.fraudService.checkTripVelocity(trip, distanceKm),
      this.fraudService.checkShortTripPattern(trip),
    ]);
  }

  async cancelTrip(tripId: string, callerId: string) {
    const trip = await this.findOrThrow(tripId);
    if (trip.riderId !== callerId && trip.driverId !== callerId) {
      throw new ForbiddenException('Only the rider or assigned driver can cancel this trip');
    }

    trip.status = TripStatus.CANCELLED;
    trip.cancelledBy = trip.riderId === callerId ? 'rider' : 'driver';
    await this.trips.save(trip);

    // Notify whichever side didn't initiate the cancellation — both are
    // notified harmlessly if a party cancels their own no-longer-open screen.
    this.dispatchGateway.notifyUser(trip.riderId, 'trip:cancelled', { tripId: trip.id });
    if (trip.driverId) this.dispatchGateway.notifyUser(trip.driverId, 'trip:cancelled', { tripId: trip.id });

    this.fraudService.checkRapidCancellations(callerId).catch(() => {});

    return trip;
  }

  /**
   * Rider rates the driver after a completed trip — rider→driver only (a
   * driver rating a rider is out of scope for now, see plan). Upsert: rating
   * again just overwrites, no "already rated" friction.
   */
  async rateTrip(tripId: string, riderId: string, rating: number, comment?: string) {
    const trip = await this.findOrThrow(tripId);
    if (trip.riderId !== riderId) throw new ForbiddenException('Only the rider on this trip can rate it');
    if (trip.status !== TripStatus.COMPLETED) throw new BadRequestException('Trip must be completed before it can be rated');
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new BadRequestException('rating must be an integer from 1 to 5');
    }

    trip.riderRating = rating;
    trip.riderComment = comment;
    await this.trips.save(trip);
    return trip;
  }

  /** Null if the driver has no rated trips yet — the admin dashboard shows "—" for that. */
  async averageRatingForDriver(driverId: string): Promise<number | null> {
    const result = await this.trips
      .createQueryBuilder('trip')
      .select('AVG(trip.riderRating)', 'avg')
      .where('trip.driverId = :driverId', { driverId })
      .andWhere('trip.riderRating IS NOT NULL')
      .getRawOne<{ avg: string | null }>();
    return result?.avg ? Math.round(Number(result.avg) * 10) / 10 : null;
  }

  /** Admin trip list, most recent first, optionally filtered by status. */
  listTrips(status?: TripStatus, limit = 100) {
    return this.trips.find({
      where: status ? { status } : {},
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * True all-time commission, aggregated in the DB over every completed trip
   * — not summed over listTrips/listRecentEntries, which are capped at the
   * most recent rows and would silently undercount once volume grows past
   * that cap. trip.commissionAmount is set for every completed trip
   * regardless of payment method (wallet or cash), unlike the ledger, which
   * only ever posts an explicit commission entry for cash trips.
   */
  async commissionAllTime() {
    const result = await this.trips
      .createQueryBuilder('trip')
      .select('COALESCE(SUM(trip.commissionAmount), 0)', 'total')
      .where('trip.status = :status', { status: TripStatus.COMPLETED })
      .getRawOne<{ total: string }>();
    return Number(result?.total ?? 0);
  }

  /** A single user's own trip history, as either rider or driver, most recent first. */
  async listTripsForUser(userId: string, limit = 50) {
    const [asRider, asDriver] = await Promise.all([
      this.trips.find({ where: { riderId: userId }, order: { createdAt: 'DESC' }, take: limit }),
      this.trips.find({ where: { driverId: userId }, order: { createdAt: 'DESC' }, take: limit }),
    ]);
    return [...asRider, ...asDriver]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  private async findOrThrow(tripId: string) {
    const trip = await this.trips.findOne({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');
    return trip;
  }
}
