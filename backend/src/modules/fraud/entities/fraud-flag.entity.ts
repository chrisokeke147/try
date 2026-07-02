import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum FraudFlagType {
  RAPID_CANCELLATIONS = 'rapid_cancellations',
  TRIP_VELOCITY = 'trip_velocity',
  SHORT_TRIP_PATTERN = 'short_trip_pattern',
}

// A review-queue entry, never an auto-block — every flag here just means
// "an admin should look at this," nothing more. See FraudService for the
// three rule checks that create these.
@Entity('fraud_flags')
export class FraudFlag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'simple-enum', enum: FraudFlagType })
  type: FraudFlagType;

  @Column({ nullable: true })
  userId?: string;

  @Column({ nullable: true })
  tripId?: string;

  @Column()
  reason: string;

  @CreateDateColumn()
  createdAt: Date;
}
