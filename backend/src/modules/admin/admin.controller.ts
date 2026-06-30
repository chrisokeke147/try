import { Controller, Get, Param, Patch, Body, Query, UseGuards } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { DriverKycStatus } from '../users/entities/user.entity';
import { TripsService } from '../trips/trips.service';
import { TripStatus } from '../trips/entities/trip.entity';
import { WalletService } from '../wallet/wallet.service';
import { AdminJwtGuard } from '../admin-auth/admin-jwt.guard';

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
  ) {}

  @Get('drivers')
  async listDrivers(@Query('status') status?: DriverKycStatus) {
    return this.usersService.listDrivers(status);
  }

  @Patch('drivers/:id/approve')
  approveDriver(@Param('id') id: string) {
    return this.usersService.setKycStatus(id, DriverKycStatus.APPROVED);
  }

  @Patch('drivers/:id/reject')
  rejectDriver(@Param('id') id: string) {
    return this.usersService.setKycStatus(id, DriverKycStatus.REJECTED);
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
