import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FraudFlag } from './entities/fraud-flag.entity';
import { Trip } from '../trips/entities/trip.entity';
import { FraudService } from './fraud.service';

@Module({
  imports: [TypeOrmModule.forFeature([FraudFlag, Trip])],
  providers: [FraudService],
  exports: [FraudService],
})
export class FraudModule {}
