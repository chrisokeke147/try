import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { OtpModule } from '../otp/otp.module';
import { UsersModule } from '../users/users.module';
import { UserJwtModule } from './user-jwt.module';

// AuthController issues tokens (JwtService, via UserJwtModule) and creates
// accounts (UsersService, via UsersModule) — but doesn't itself need
// UserJwtGuard, so importing UserJwtModule here doesn't reintroduce the
// cycle that UserJwtModule was built to avoid (see user-jwt.module.ts).
@Module({
  imports: [OtpModule, UsersModule, UserJwtModule],
  controllers: [AuthController],
})
export class AuthModule {}
