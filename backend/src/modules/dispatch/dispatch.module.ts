import { Module } from '@nestjs/common';
import { RedisProvider } from '../../common/database/redis.provider';
import { DispatchService } from './dispatch.service';
import { DispatchController } from './dispatch.controller';
import { DispatchGateway } from './dispatch.gateway';

@Module({
  controllers: [DispatchController],
  providers: [DispatchService, RedisProvider, DispatchGateway],
  exports: [DispatchService, DispatchGateway],
})
export class DispatchModule {}
