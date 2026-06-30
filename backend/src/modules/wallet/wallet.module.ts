import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from './entities/wallet.entity';
import { LedgerEntry } from './entities/ledger-entry.entity';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { UserJwtModule } from '../auth/user-jwt.module';

@Module({
  imports: [TypeOrmModule.forFeature([Wallet, LedgerEntry]), UserJwtModule],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
