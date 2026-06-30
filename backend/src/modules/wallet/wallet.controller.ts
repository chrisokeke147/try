import { Controller, Get, Param } from '@nestjs/common';
import { WalletService } from './wallet.service';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get(':userId/balance')
  async getBalance(@Param('userId') userId: string) {
    const balance = await this.walletService.getBalance(userId);
    return { userId, balance };
  }

  @Get(':userId/history')
  async getHistory(@Param('userId') userId: string) {
    const wallet = await this.walletService.getOrCreateWallet(userId);
    return this.walletService.history(wallet.id);
  }
}
