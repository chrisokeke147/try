import { IsLatitude, IsLongitude } from 'class-validator';

// driverId no longer accepted from the client — derived from the
// authenticated JWT (see UserJwtGuard) in DispatchController.
export class DriverOnlineDto {
  @IsLatitude()
  lat: number;

  @IsLongitude()
  lng: number;
}

export class DriverLocationDto {
  @IsLatitude()
  lat: number;

  @IsLongitude()
  lng: number;
}
