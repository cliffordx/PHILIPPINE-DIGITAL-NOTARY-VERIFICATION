import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { NotarialRegister } from './notarial-register.entity';
import { AuditLog } from './audit-log.entity';

export enum LawyerStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
}

export enum LawyerRole {
  NOTARY = 'notary',
  IBP_ADMIN = 'ibp_admin',
  AUDITOR = 'auditor',
}

@Entity('lawyers')
export class Lawyer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ name: 'roll_number', length: 20 })
  rollNumber: string;

  @Index({ unique: true })
  @Column({ name: 'ibp_number', length: 20 })
  ibpNumber: string;

  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @Column({ name: 'middle_name', length: 100, nullable: true })
  middleName: string;

  @Index({ unique: true })
  @Column({ length: 255 })
  email: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: LawyerRole,
    default: LawyerRole.NOTARY,
  })
  role: LawyerRole;

  @Column({
    type: 'enum',
    enum: LawyerStatus,
    default: LawyerStatus.ACTIVE,
  })
  status: LawyerStatus;

  @Column({ name: 'notarial_commission_number', length: 50, nullable: true })
  notarialCommissionNumber: string;

  @Column({ name: 'commission_start_date', type: 'date', nullable: true })
  commissionStartDate: Date;

  @Column({ name: 'commission_end_date', type: 'date', nullable: true })
  commissionEndDate: Date;

  @Column({ name: 'jurisdiction', length: 255, nullable: true })
  jurisdiction: string;

  @Column({ name: 'law_firm', length: 255, nullable: true })
  lawFirm: string;

  @Column({ name: 'office_address', type: 'text', nullable: true })
  officeAddress: string;

  @Column({ name: 'contact_number', length: 20, nullable: true })
  contactNumber: string;

  @Column({ name: 'is_email_verified', default: false })
  isEmailVerified: boolean;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt: Date;

  @Column({ name: 'failed_login_attempts', default: 0 })
  failedLoginAttempts: number;

  @Column({ name: 'locked_until', type: 'timestamptz', nullable: true })
  lockedUntil: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => NotarialRegister, (register) => register.lawyer)
  notarialRegisters: NotarialRegister[];

  @OneToMany(() => AuditLog, (log) => log.lawyer)
  auditLogs: AuditLog[];

  get fullName(): string {
    return [this.firstName, this.middleName, this.lastName]
      .filter(Boolean)
      .join(' ');
  }
}
