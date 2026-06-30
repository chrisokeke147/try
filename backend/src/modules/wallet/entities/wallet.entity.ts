import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  // Always derived from ledger entries — never written directly outside
  // LedgerService.post(), which is the single place balances change.
  @Column('double precision', { default: 0 })
  balance: number;

  @UpdateDateColumn()
  updatedAt: Date;
}
