import { IsEnum, IsLatitude, IsLongitude, IsNumber, IsPositive } from 'class-validator';
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

// riderId is no longer accepted from the client — TripsController derives it
// from the authenticated JWT (see UserJwtGuard) and merges it in.
export class RequestTripDto {
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

export class CompleteTripDto {
  @IsNumber()
  @IsPositive()
  finalFare: number;
}
