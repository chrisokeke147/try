import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { OtpModule } from '../otp/otp.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [OtpModule, UsersModule],
  controllers: [AuthController],
})
export class AuthModule {}
