import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { FraudFlag, FraudFlagType } from './entities/fraud-flag.entity';
import { Trip, TripStatus } from '../trips/entities/trip.entity';

// Assumed generous top speed for a tricycle in mixed traffic — used only to
// sanity-check that a driver couldn't physically have finished the distance
// between two trips in the time reported. Deliberately conservative (real
// average speeds are much lower) so this only fires on genuinely implausible
// back-to-back trips, not normal fast turnarounds.
const ASSUMED_MAX_SPEED_KMH = 60;
const MIN_VELOCITY_CHECK_DISTANCE_KM = 1;

// Same threshold trips.service.ts uses as its price floor — a repeated string
// of trips priced right at the floor between the same two people is the
// wash-trade/collusion pattern this check is watching for.
const MINIMUM_FARE = 350;

@Injectable()
export class FraudService {
  constructor(
    @InjectRepository(FraudFlag) private readonly flags: Repository<FraudFlag>,
    @InjectRepository(Trip) private readonly trips: Repository<Trip>,
  ) {}

  private flag(type: FraudFlagType, reason: string, userId?: string, tripId?: string) {
    return this.flags.save(this.flags.create({ type, reason, userId, tripId }));
  }

  list() {
    return this.flags.find({ order: { createdAt: 'DESC' }, take: 200 });
  }

  /**
   * Called right after a cancellation is recorded. Counts this specific
   * user's own cancellations (as whichever role they played — rider or
   * driver — in each trip) over the last hour; 3+ gets flagged for review.
   * Not an auto-suspend — see FraudFlag's own doc comment.
   */
  async checkRapidCancellations(userId: string) {
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const [asRider, asDriver] = await Promise.all([
      this.trips.count({ where: { riderId: userId, cancelledBy: 'rider', updatedAt: MoreThan(since) } }),
      this.trips.count({ where: { driverId: userId, cancelledBy: 'driver', updatedAt: MoreThan(since) } }),
    ]);
    const count = asRider + asDriver;
    if (count >= 3) {
      await this.flag(
        FraudFlagType.RAPID_CANCELLATIONS,
        `${count} cancellations by this account in the last hour`,
        userId,
      );
    }
  }

  /**
   * Called right after a trip settles. Flags a driver whose gap since their
   * last completed trip is too short for the distance just covered, even at
   * a generous assumed top speed — a sign of fabricated/duplicate trips
   * rather than real driving.
   */
  async checkTripVelocity(trip: Trip, distanceKm: number) {
    if (!trip.driverId || distanceKm < MIN_VELOCITY_CHECK_DISTANCE_KM) return;

    const previous = await this.trips.findOne({
      where: { driverId: trip.driverId, status: TripStatus.COMPLETED },
      order: { updatedAt: 'DESC' },
    });
    if (!previous || previous.id === trip.id) return;

    const gapMinutes = (trip.updatedAt.getTime() - previous.updatedAt.getTime()) / 60_000;
    const minimumPlausibleMinutes = (distanceKm / ASSUMED_MAX_SPEED_KMH) * 60;

    if (gapMinutes < minimumPlausibleMinutes * 0.5) {
      await this.flag(
        FraudFlagType.TRIP_VELOCITY,
        `Completed a ${distanceKm.toFixed(1)}km trip only ${gapMinutes.toFixed(1)} min after their last one`,
        trip.driverId,
        trip.id,
      );
    }
  }

  /**
   * Called right after a trip settles. Flags the 3rd+ minimum-fare trip
   * between the same rider-driver pair within 24h — cheap trips repeated
   * suspiciously often between the same two accounts is a wash-trade/
   * collusion proxy (e.g. inflating a driver's completed-trip count, or
   * cycling money through the platform for some other reason).
   */
  async checkShortTripPattern(trip: Trip) {
    if (!trip.driverId || !trip.finalFare || trip.finalFare > MINIMUM_FARE + 10) return;

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const count = await this.trips.count({
      where: {
        riderId: trip.riderId,
        driverId: trip.driverId,
        status: TripStatus.COMPLETED,
        createdAt: MoreThan(since),
      },
    });

    if (count >= 3) {
      await this.flag(
        FraudFlagType.SHORT_TRIP_PATTERN,
        `${count} minimum-fare trips between this rider and driver in the last 24h`,
        trip.riderId,
        trip.id,
      );
    }
  }
}
