import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';

export enum UserRole {
  RIDER = 'rider',
  DRIVER = 'driver',
  ADMIN = 'admin',
}

export enum DriverKycStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('users')
@Unique('UQ_users_phone_role', ['phoneNumber', 'role'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  phoneNumber: string;

  @Column()
  fullName: string;

  @Column({ type: 'simple-enum', enum: UserRole })
  role: UserRole;

  // Driver-only fields. Photo + plate are mandatory before approval because the
  // rider app shows them the moment a trip is matched (see Dispatch module).
  // NIN + plate photo exist to harden identity verification during KYC review.
  @Column({ type: 'text', nullable: true })
  profilePhotoUrl?: string;

  @Column({ nullable: true })
  tricyclePlateNumber?: string;

  @Column({ type: 'text', nullable: true })
  tricyclePlatePhotoUrl?: string;

  @Column({ nullable: true })
  driverLicenseNumber?: string;

  @Column({ nullable: true })
  nin?: string;

  // City the driver operates in — Onitsha at launch, expanding across Anambra
  // then nationwide (see rollout plan). Lets the admin dashboard filter drivers
  // and trips by city as new markets open.
  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  levyReceiptUrl?: string;

  @Column({ type: 'simple-enum', enum: DriverKycStatus, default: DriverKycStatus.PENDING, nullable: true })
  kycStatus?: DriverKycStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
