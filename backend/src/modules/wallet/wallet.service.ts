import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import { LedgerEntry, LedgerEntryType } from './entities/ledger-entry.entity';

export const CASH_TRIP_MIN_WALLET_BALANCE = 1000; // NGN — covers commission owed on a cash trip.

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet) private readonly wallets: Repository<Wallet>,
    @InjectRepository(LedgerEntry) private readonly ledger: Repository<LedgerEntry>,
    private readonly dataSource: DataSource,
  ) {}

  async getOrCreateWallet(userId: string) {
    let wallet = await this.wallets.findOne({ where: { userId } });
    if (!wallet) wallet = await this.wallets.save(this.wallets.create({ userId }));
    return wallet;
  }

  async getBalance(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);
    return wallet.balance;
  }

  canAcceptCashTrip(balance: number) {
    return balance >= CASH_TRIP_MIN_WALLET_BALANCE;
  }

  /**
   * Posts one or more ledger entries for the same wallet atomically and updates the
   * cached balance. This is the only method allowed to mutate Wallet.balance.
   *
   * Pass an existing `manager` to compose this into a caller's own transaction
   * (e.g. trip settlement, which posts to two wallets and updates the trip
   * row in one all-or-nothing unit — see TripsService.completeTrip) instead
   * of opening a separate transaction per wallet post.
   */
  async post(
    walletId: string,
    entries: Array<{ type: LedgerEntryType; amount: number; tripId?: string; externalReference?: string }>,
    manager?: EntityManager,
  ) {
    const run = async (txManager: EntityManager) => {
      const wallet = await txManager.findOne(Wallet, { where: { id: walletId } });
      if (!wallet) throw new BadRequestException('Wallet not found');

      let runningBalance = wallet.balance;
      for (const entry of entries) {
        // Defense in depth against a repeat of a real bug: a webhook payload
        // fed an un-coerced string amount straight into `+=` here, silently
        // turning addition into string concatenation (-1370 + "1000.00"
        // became -13701000, not -370). Any non-finite amount reaching this
        // point is a caller bug, not something to silently misprocess.
        if (typeof entry.amount !== 'number' || !Number.isFinite(entry.amount)) {
          throw new BadRequestException(`Ledger entry amount must be a finite number, got: ${JSON.stringify(entry.amount)}`);
        }
        runningBalance += entry.amount;
        await txManager.save(LedgerEntry, txManager.create(LedgerEntry, { walletId, ...entry }));
      }

      wallet.balance = runningBalance;
      return txManager.save(Wallet, wallet);
    };

    return manager ? run(manager) : this.dataSource.transaction(run);
  }

  history(walletId: string) {
    return this.ledger.find({ where: { walletId }, order: { createdAt: 'DESC' } });
  }

  /** Admin-wide ledger view across all wallets, most recent first. */
  listRecentEntries(limit = 100) {
    return this.ledger.find({ order: { createdAt: 'DESC' }, take: limit });
  }

  findWalletById(id: string) {
    return this.wallets.findOne({ where: { id } });
  }

  findLedgerEntryByReference(externalReference: string) {
    return this.ledger.findOne({ where: { externalReference } });
  }
}
