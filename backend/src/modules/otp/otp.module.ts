import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { RedisProvider } from '../../common/database/redis.provider';

@Module({
  providers: [OtpService, RedisProvider],
  exports: [OtpService],
})
export class OtpModule {}
