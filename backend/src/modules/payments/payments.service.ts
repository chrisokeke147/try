import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { MonnifyClient } from './monnify.client';
import { WalletService } from '../wallet/wallet.service';
import { LedgerEntryType } from '../wallet/entities/ledger-entry.entity';
import { DispatchGateway } from '../dispatch/dispatch.gateway';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly monnify: MonnifyClient,
    private readonly walletService: WalletService,
    private readonly dispatchGateway: DispatchGateway,
  ) {}

  async initiateTopUp(userId: string, amount: number, customerName: string, customerEmail: string) {
    const reference = `topup_${userId}_${randomUUID()}`;
    const result = await this.monnify.initiateCollection({ amount, customerName, customerEmail, reference });
    return { reference, checkoutUrl: result.checkoutUrl };
  }

  /**
   * Called from the Monnify webhook controller once a collection is confirmed.
   * externalReference makes this idempotent against retried/duplicate webhooks.
   */
  async confirmTopUp(userId: string, amount: number, externalReference: string) {
    const wallet = await this.walletService.getOrCreateWallet(userId);
    return this.walletService.post(wallet.id, [
      { type: LedgerEntryType.RIDER_TOPUP, amount, externalReference },
    ]);
  }

  async initiateWithdrawal(driverId: string, amount: number, bankCode: string, accountNumber: string) {
    const balance = await this.walletService.getBalance(driverId);
    if (balance < amount) throw new BadRequestException('Insufficient wallet balance');

    const reference = `withdraw_${driverId}_${randomUUID()}`;
    const wallet = await this.walletService.getOrCreateWallet(driverId);

    // Debit immediately so the balance can't be double-spent while the payout is in flight;
    // the reconciliation job (Phase 1 §3) reverses this if Monnify ultimately fails the payout.
    await this.walletService.post(wallet.id, [
      { type: LedgerEntryType.DRIVER_WITHDRAWAL, amount: -amount, externalReference: reference },
    ]);

    await this.monnify.initiateDisbursement({
      amount,
      reference,
      narration: 'TRY driver withdrawal',
      bankCode,
      accountNumber,
    });

    return { reference };
  }

  /**
   * Called from the Monnify webhook when a disbursement ultimately fails
   * after we'd already debited the driver's wallet at request time (see
   * initiateWithdrawal above). Reverses that debit. Idempotent against
   * retried webhooks via a deterministic externalReference; looks the
   * original amount up from our own ledger rather than trusting whatever
   * amount the webhook payload claims.
   */
  async reverseFailedWithdrawal(originalReference: string) {
    const original = await this.walletService.findLedgerEntryByReference(originalReference);
    if (!original) {
      this.logger.warn(`Disbursement-failure webhook for unknown reference ${originalReference} — ignoring`);
      return { reversed: false };
    }

    const reversalReference = `${originalReference}_reversed`;
    const alreadyReversed = await this.walletService.findLedgerEntryByReference(reversalReference);
    if (alreadyReversed) return { reversed: true }; // already handled — idempotent no-op

    await this.walletService.post(original.walletId, [
      { type: LedgerEntryType.WITHDRAWAL_REVERSED, amount: -original.amount, externalReference: reversalReference },
    ]);

    const wallet = await this.walletService.findWalletById(original.walletId);
    if (wallet) this.dispatchGateway.notifyUser(wallet.userId, 'withdrawal:failed', { reference: originalReference });

    return { reversed: true };
  }
}
