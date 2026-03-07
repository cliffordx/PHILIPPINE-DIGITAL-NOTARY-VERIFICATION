import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Lawyer } from './lawyer.entity';

export enum AuditAction {
  LOGIN = 'login',
  LOGOUT = 'logout',
  LOGIN_FAILED = 'login_failed',
  REGISTER_CREATED = 'register_created',
  DOCUMENT_NOTARIZED = 'document_notarized',
  DOCUMENT_VERIFIED = 'document_verified',
  DOCUMENT_REVOKED = 'document_revoked',
  FRAUD_FLAGGED = 'fraud_flagged',
  FRAUD_CLEARED = 'fraud_cleared',
  LAWYER_CREATED = 'lawyer_created',
  LAWYER_UPDATED = 'lawyer_updated',
  LAWYER_SUSPENDED = 'lawyer_suspended',
  ADMIN_ACTION = 'admin_action',
  DATA_EXPORT = 'data_export',
  VERIFICATION_REQUEST = 'verification_request',
}

export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'lawyer_id', nullable: true })
  lawyerId: string;

  @Index()
  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action: AuditAction;

  @Column({
    type: 'enum',
    enum: AuditSeverity,
    default: AuditSeverity.INFO,
  })
  severity: AuditSeverity;

  @Column({ name: 'entity_type', length: 100, nullable: true })
  entityType: string;

  @Column({ name: 'entity_id', length: 36, nullable: true })
  entityId: string;

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @Column({ name: 'request_id', length: 36, nullable: true })
  requestId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @Column({ name: 'integrity_hash', length: 64 })
  integrityHash: string;

  @Column({ name: 'previous_hash', length: 64, nullable: true })
  previousHash: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => Lawyer, (lawyer) => lawyer.auditLogs, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'lawyer_id' })
  lawyer: Lawyer;
}
