import { Controller, Get, Param, Patch, Body, Query, UseGuards } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { DriverKycStatus } from '../users/entities/user.entity';
import { TripsService } from '../trips/trips.service';
import { TripStatus } from '../trips/entities/trip.entity';
import { WalletService } from '../wallet/wallet.service';
import { AdminJwtGuard } from '../admin-auth/admin-jwt.guard';
import { WaitlistService } from '../waitlist/waitlist.service';
import { FraudService } from '../fraud/fraud.service';

// Backs the admin dashboard: driver approval, live trip monitoring, ledger review.
// Kept as a thin facade over existing module services rather than duplicating logic.
// Guarded — this surfaces driver NIN, live trips, and the financial ledger.
@UseGuards(AdminJwtGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly usersService: UsersService,
    private readonly tripsService: TripsService,
    private readonly walletService: WalletService,
    private readonly waitlistService: WaitlistService,
    private readonly fraudService: FraudService,
  ) {}

  @Get('drivers')
  async listDrivers(@Query('status') status?: DriverKycStatus) {
    const drivers = await this.usersService.listDrivers(status);
    const ratings = await Promise.all(drivers.map((d) => this.tripsService.averageRatingForDriver(d.id)));
    return drivers.map((driver, i) => ({ ...driver, averageRating: ratings[i] }));
  }

  // Review queue only — see FraudFlag's doc comment. Nothing here auto-acts
  // on an account; an admin decides whether a flag warrants a suspend.
  @Get('fraud-flags')
  async listFraudFlags() {
    const flags = await this.fraudService.list();

    // Enrich with phone number — an admin acting on a flag needs to actually
    // identify and reach the account, not just see a raw userId.
    const userIds = Array.from(new Set(flags.map((f) => f.userId).filter(Boolean))) as string[];
    const users = await Promise.all(userIds.map((id) => this.usersService.findById(id)));
    const phoneById = new Map(users.filter(Boolean).map((u) => [u!.id, u!.phoneNumber]));

    return flags.map((flag) => ({
      ...flag,
      userPhone: flag.userId ? phoneById.get(flag.userId) ?? null : null,
    }));
  }

  // Backs the dashboard's "find this account" search for support/dispute
  // resolution — by phone number since that's what a complaining user gives.
  @Get('users')
  async searchUsers(@Query('phone') phone?: string) {
    return phone ? this.usersService.findAllByPhone(phone) : [];
  }

  @Patch('drivers/:id/approve')
  approveDriver(@Param('id') id: string) {
    return this.usersService.setKycStatus(id, DriverKycStatus.APPROVED);
  }

  @Patch('drivers/:id/reject')
  rejectDriver(@Param('id') id: string) {
    return this.usersService.setKycStatus(id, DriverKycStatus.REJECTED);
  }

  // Applies to either role (rider or driver) — admin kill-switch for abusive
  // or disputed accounts. Enforced at sign-in and on every trip action (see
  // UserJwtGuard), not just sign-in, since sessions are long-lived (90d).
  @Patch('users/:id/suspend')
  suspendUser(@Param('id') id: string) {
    return this.usersService.setSuspended(id, true);
  }

  @Patch('users/:id/unsuspend')
  unsuspendUser(@Param('id') id: string) {
    return this.usersService.setSuspended(id, false);
  }

  @Get('trips')
  async listTrips(@Query('status') status?: TripStatus) {
    const trips = await this.tripsService.listTrips(status);

    // Enrich with rider/driver display names — riderId/driverId are plain
    // string columns (no DB relation set up), so resolve names here.
    const userIds = Array.from(new Set(trips.flatMap((t) => [t.riderId, t.driverId]).filter(Boolean))) as string[];
    const users = await Promise.all(userIds.map((id) => this.usersService.findById(id)));
    const nameById = new Map(users.filter(Boolean).map((u) => [u!.id, u!.fullName]));

    return trips.map((trip) => ({
      ...trip,
      riderName: nameById.get(trip.riderId) ?? trip.riderId,
      driverName: trip.driverId ? nameById.get(trip.driverId) ?? trip.driverId : null,
    }));
  }

  @Get('ledger/summary')
  async ledgerSummary() {
    const commissionAllTime = await this.tripsService.commissionAllTime();
    return { commissionAllTime };
  }

  // Pre-launch lead capture from the tryride.ng marketing site — see
  // WaitlistModule. Counts first since that's the number that matters for a
  // "how much demand do we have" glance.
  @Get('waitlist')
  async listWaitlist() {
    const [counts, entries] = await Promise.all([this.waitlistService.counts(), this.waitlistService.list()]);
    return { counts, entries };
  }

  @Get('ledger')
  async listLedger() {
    const entries = await this.walletService.listRecentEntries();

    const walletIds = Array.from(new Set(entries.map((e) => e.walletId)));
    const wallets = await Promise.all(walletIds.map((id) => this.walletService.findWalletById(id)));
    const userIdByWalletId = new Map(wallets.filter(Boolean).map((w) => [w!.id, w!.userId]));

    const userIds = Array.from(new Set(Array.from(userIdByWalletId.values())));
    const users = await Promise.all(userIds.map((id) => this.usersService.findById(id)));
    const nameByUserId = new Map(users.filter(Boolean).map((u) => [u!.id, u!.fullName]));

    return entries.map((entry) => {
      const userId = userIdByWalletId.get(entry.walletId);
      return {
        ...entry,
        userName: (userId && nameByUserId.get(userId)) ?? entry.walletId,
      };
    });
  }
}
