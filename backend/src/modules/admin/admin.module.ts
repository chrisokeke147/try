import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { UsersModule } from '../users/users.module';
import { TripsModule } from '../trips/trips.module';
import { WalletModule } from '../wallet/wallet.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';

@Module({
  imports: [UsersModule, TripsModule, WalletModule, AdminAuthModule],
  controllers: [AdminController],
})
export class AdminModule {}
