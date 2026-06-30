import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { WaitlistRole } from '../entities/waitlist-entry.entity';

// Same pattern accepted across the app's phone fields — see auth.dto.ts.
const PHONE_REGEX = /^(\+?234|0)[789][01]\d{8}$/;

export class JoinWaitlistDto {
  @IsString()
  @Matches(PHONE_REGEX, { message: 'phoneNumber must be a valid Nigerian phone number' })
  phoneNumber: string;

  @IsEnum(WaitlistRole)
  role: WaitlistRole;

  @IsOptional()
  @IsString()
  city?: string;
}
