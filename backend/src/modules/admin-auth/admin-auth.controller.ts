import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from './dto/admin-auth.dto';

@Controller('admin-auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  // Strict limit — this is a password-guessing target.
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('login')
  login(@Body() body: AdminLoginDto) {
    return this.adminAuthService.login(body.email, body.password);
  }
}
