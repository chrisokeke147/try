import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { OtpService } from '../otp/otp.service';
import { UsersService } from '../users/users.service';
import { RequestOtpDto, VerifyOtpDto, SignUpRiderDto, SignInDto, SignUpDriverDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly otpService: OtpService,
    private readonly usersService: UsersService,
  ) {}

  // Stricter than the global default: SMS sends cost money and this is the
  // prime target for spam/credential-stuffing-style abuse.
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  @Post('otp/request')
  requestOtp(@Body() body: RequestOtpDto) {
    return this.otpService.requestOtp(body.phoneNumber, body.purpose);
  }

  /**
   * Verifies the SMS code and returns a short-lived token. This does NOT yet
   * create or look up an account — that happens via the purpose-specific
   * endpoints below, which require this token, so phone ownership is always
   * proven before any account is touched.
   */
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('otp/verify')
  verifyOtp(@Body() body: VerifyOtpDto) {
    return this.otpService.verifyOtp(body.phoneNumber, body.code, body.purpose);
  }

  @Post('riders/signup')
  async signUpRider(@Body() body: SignUpRiderDto) {
    await this.otpService.consumeVerification(body.phoneNumber, 'rider_signup', body.verificationToken);
    return this.usersService.signUpRider(body.phoneNumber, body.fullName);
  }

  @Post('riders/signin')
  async signInRider(@Body() body: SignInDto) {
    await this.otpService.consumeVerification(body.phoneNumber, 'rider_signin', body.verificationToken);
    return this.usersService.signInRider(body.phoneNumber);
  }

  @Post('drivers/signup')
  async signUpDriver(@Body() body: SignUpDriverDto) {
    const { verificationToken, ...input } = body;
    await this.otpService.consumeVerification(body.phoneNumber, 'driver_signup', verificationToken);
    return this.usersService.registerDriver(input);
  }

  @Post('drivers/signin')
  async signInDriver(@Body() body: SignInDto) {
    await this.otpService.consumeVerification(body.phoneNumber, 'driver_signin', body.verificationToken);
    return this.usersService.signInDriver(body.phoneNumber);
  }
}
