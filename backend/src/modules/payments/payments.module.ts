import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { MonnifyClient } from './monnify.client';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [WalletModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, MonnifyClient],
  exports: [PaymentsService],
})
export class PaymentsModule {}
