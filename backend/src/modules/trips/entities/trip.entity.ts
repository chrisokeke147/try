import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum TripStatus {
  REQUESTED = 'requested',
  MATCHED = 'matched',
  DRIVER_ENROUTE = 'driver_enroute',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  WALLET = 'wallet',
  CASH = 'cash',
}

@Entity('trips')
export class Trip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  riderId: string;

  @Column({ nullable: true })
  driverId?: string;

  @Column({ type: 'simple-enum', enum: TripStatus, default: TripStatus.REQUESTED })
  status: TripStatus;

  @Column({ type: 'simple-enum', enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Column('double precision')
  pickupLat: number;

  @Column('double precision')
  pickupLng: number;

  @Column('double precision')
  dropoffLat: number;

  @Column('double precision')
  dropoffLng: number;

  @Column('double precision', { nullable: true })
  estimatedFare?: number;

  @Column('double precision', { nullable: true })
  finalFare?: number;

  @Column('double precision', { nullable: true })
  commissionAmount?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
