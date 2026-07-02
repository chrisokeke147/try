import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip } from './entities/trip.entity';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { DispatchModule } from '../dispatch/dispatch.module';
import { WalletModule } from '../wallet/wallet.module';
import { UsersModule } from '../users/users.module';
import { PlacesModule } from '../places/places.module';
import { UserJwtModule } from '../auth/user-jwt.module';
import { FraudModule } from '../fraud/fraud.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trip]),
    DispatchModule,
    WalletModule,
    UsersModule,
    PlacesModule,
    UserJwtModule,
    FraudModule,
  ],
  controllers: [TripsController],
  providers: [TripsService],
  exports: [TripsService],
})
export class TripsModule {}
