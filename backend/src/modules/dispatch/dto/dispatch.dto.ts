import { IsLatitude, IsLongitude, IsString, IsUUID } from 'class-validator';

export class DriverOnlineDto {
  @IsUUID()
  driverId: string;

  @IsLatitude()
  lat: number;

  @IsLongitude()
  lng: number;
}

export class DriverOfflineDto {
  @IsUUID()
  driverId: string;
}

export class DriverLocationDto {
  @IsUUID()
  driverId: string;

  @IsLatitude()
  lat: number;

  @IsLongitude()
  lng: number;
}
