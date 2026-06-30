import { Controller, Get, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { UserJwtGuard } from '../auth/user-jwt.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/user-jwt.guard';

@UseGuards(UserJwtGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('me/balance')
  async getBalance(@CurrentUser() user: AuthenticatedUser) {
    const balance = await this.walletService.getBalance(user.id);
    return { userId: user.id, balance };
  }

  @Get('me/history')
  async getHistory(@CurrentUser() user: AuthenticatedUser) {
    const wallet = await this.walletService.getOrCreateWallet(user.id);
    return this.walletService.history(wallet.id);
  }
}
