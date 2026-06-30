import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

export enum WaitlistRole {
  RIDER = 'rider',
  DRIVER = 'driver',
}

// Pre-launch lead capture from tryride.ng — deliberately minimal (just phone
// + role) since every extra field on a waitlist form loses signups. Not a
// User: no auth, no KYC, just "notify me when TRY launches here."
@Entity('waitlist_entries')
@Unique('UQ_waitlist_phone_role', ['phoneNumber', 'role'])
export class WaitlistEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  phoneNumber: string;

  @Column({ type: 'simple-enum', enum: WaitlistRole })
  role: WaitlistRole;

  @Column({ default: 'Onitsha' })
  city: string;

  @CreateDateColumn()
  createdAt: Date;
}
