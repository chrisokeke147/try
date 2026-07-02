import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { UsersModule } from '../users/users.module';
import { TripsModule } from '../trips/trips.module';
import { WalletModule } from '../wallet/wallet.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { WaitlistModule } from '../waitlist/waitlist.module';
import { FraudModule } from '../fraud/fraud.module';

@Module({
  imports: [UsersModule, TripsModule, WalletModule, AdminAuthModule, WaitlistModule, FraudModule],
  controllers: [AdminController],
})
export class AdminModule {}
