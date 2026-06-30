import { IsEnum } from 'class-validator';
import { DriverKycStatus } from '../entities/user.entity';

export class SetKycStatusDto {
  @IsEnum(DriverKycStatus)
  status: DriverKycStatus;
}
