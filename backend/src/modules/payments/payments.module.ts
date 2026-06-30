import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { MonnifyClient } from './monnify.client';
import { WalletModule } from '../wallet/wallet.module';
import { UserJwtModule } from '../auth/user-jwt.module';
import { DispatchModule } from '../dispatch/dispatch.module';

@Module({
  imports: [WalletModule, UserJwtModule, DispatchModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, MonnifyClient],
  exports: [PaymentsService],
})
export class PaymentsModule {}
