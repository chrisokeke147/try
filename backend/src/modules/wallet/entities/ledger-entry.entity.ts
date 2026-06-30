import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum LedgerEntryType {
  RIDER_TOPUP = 'rider_topup',
  TRIP_FARE_DEBIT = 'trip_fare_debit',
  DRIVER_EARNING_CREDIT = 'driver_earning_credit',
  COMMISSION_DEBIT = 'commission_debit',
  COMMISSION_CREDIT_TRY = 'commission_credit_try',
  DRIVER_WITHDRAWAL = 'driver_withdrawal',
}

// Double-entry style ledger: every wallet balance change is an append-only row here.
// Wallet.balance is a cached sum, recomputable from this table — this is the audit trail.
@Entity('ledger_entries')
export class LedgerEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  walletId: string;

  @Column({ type: 'simple-enum', enum: LedgerEntryType })
  type: LedgerEntryType;

  // Positive = credit, negative = debit.
  @Column('double precision')
  amount: number;

  @Column({ nullable: true })
  tripId?: string;

  // Idempotency key for anything originating from Monnify (webhook event id /
  // disbursement reference) so retried webhooks never double-post.
  @Column({ nullable: true, unique: true })
  externalReference?: string;

  @CreateDateColumn()
  createdAt: Date;
}
