import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';
import type { OtpPurpose } from '../../otp/otp.service';

const OTP_PURPOSES: OtpPurpose[] = ['rider_signup', 'rider_signin', 'driver_signup', 'driver_signin'];

// Nigerian local format (0XXXXXXXXXX) or E.164 (+234XXXXXXXXXX) — loose enough
// to accept both since both show up across the codebase's mock/test data.
const PHONE_REGEX = /^(\+?234|0)[789][01]\d{8}$/;

export class RequestOtpDto {
  @IsString()
  @Matches(PHONE_REGEX, { message: 'phoneNumber must be a valid Nigerian phone number' })
  phoneNumber: string;

  @IsEnum(OTP_PURPOSES)
  purpose: OtpPurpose;
}

export class VerifyOtpDto {
  @IsString()
  @Matches(PHONE_REGEX, { message: 'phoneNumber must be a valid Nigerian phone number' })
  phoneNumber: string;

  @IsString()
  @Length(6, 6)
  code: string;

  @IsEnum(OTP_PURPOSES)
  purpose: OtpPurpose;
}

export class SignUpRiderDto {
  @IsString()
  @Matches(PHONE_REGEX)
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  fullName: string;

  @IsString()
  @IsUUID()
  verificationToken: string;
}

export class SignInDto {
  @IsString()
  @Matches(PHONE_REGEX)
  phoneNumber: string;

  @IsString()
  @IsUUID()
  verificationToken: string;
}

export class SignUpDriverDto {
  @IsString()
  @Matches(PHONE_REGEX)
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  fullName: string;

  @IsString()
  @IsNotEmpty()
  tricyclePlateNumber: string;

  @IsString()
  @IsNotEmpty()
  tricyclePlatePhotoUrl: string;

  @IsString()
  @IsNotEmpty()
  driverLicenseNumber: string;

  @IsString()
  @Length(11, 11, { message: 'nin must be exactly 11 digits' })
  nin: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  profilePhotoUrl: string;

  @IsString()
  @IsUUID()
  verificationToken: string;

  @IsOptional()
  @IsString()
  levyReceiptUrl?: string;
}
