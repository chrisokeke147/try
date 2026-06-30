import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
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
   */
  async post(walletId: string, entries: Array<{ type: LedgerEntryType; amount: number; tripId?: string; externalReference?: string }>) {
    return this.dataSource.transaction(async (manager) => {
      const wallet = await manager.findOne(Wallet, { where: { id: walletId } });
      if (!wallet) throw new BadRequestException('Wallet not found');

      let runningBalance = wallet.balance;
      for (const entry of entries) {
        runningBalance += entry.amount;
        await manager.save(LedgerEntry, manager.create(LedgerEntry, { walletId, ...entry }));
      }

      wallet.balance = runningBalance;
      return manager.save(Wallet, wallet);
    });
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
}
