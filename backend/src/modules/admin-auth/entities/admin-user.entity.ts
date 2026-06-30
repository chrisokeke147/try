import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

// Deliberately separate from the rider/driver User entity — admin accounts
// are a handful of internal staff, not app users, and use password auth
// (not phone OTP) since they're operated from a desk, not a phone.
@Entity('admin_users')
export class AdminUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @CreateDateColumn()
  createdAt: Date;
}
