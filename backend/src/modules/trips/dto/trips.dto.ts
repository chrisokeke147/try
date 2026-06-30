import { IsEnum, IsLatitude, IsLongitude, IsNumber, IsPositive, IsUUID } from 'class-validator';
import { PaymentMethod } from '../entities/trip.entity';

export class FareEstimateDto {
  @IsLatitude()
  pickupLat: number;

  @IsLongitude()
  pickupLng: number;

  @IsLatitude()
  dropoffLat: number;

  @IsLongitude()
  dropoffLng: number;
}

export class RequestTripDto {
  @IsUUID()
  riderId: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsLatitude()
  pickupLat: number;

  @IsLongitude()
  pickupLng: number;

  @IsLatitude()
  dropoffLat: number;

  @IsLongitude()
  dropoffLng: number;

  @IsNumber()
  @IsPositive()
  estimatedFare: number;
}

export class AcceptTripDto {
  @IsUUID()
  driverId: string;
}

export class CompleteTripDto {
  @IsNumber()
  @IsPositive()
  finalFare: number;
}
