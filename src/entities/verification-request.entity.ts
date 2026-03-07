import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { NotarizedDocument } from './notarized-document.entity';

export enum VerificationStatus {
  VERIFIED = 'verified',
  NOT_FOUND = 'not_found',
  INVALID = 'invalid',
  FLAGGED = 'flagged',
  REVOKED = 'revoked',
}

export enum VerificationMethod {
  SERIAL_NUMBER = 'serial_number',
  DOCUMENT_HASH = 'document_hash',
  QR_CODE = 'qr_code',
}

@Entity('verification_requests')
export class VerificationRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'document_id', nullable: true })
  documentId: string;

  @Column({ name: 'query_value', length: 500 })
  queryValue: string;

  @Column({
    name: 'verification_method',
    type: 'enum',
    enum: VerificationMethod,
    default: VerificationMethod.SERIAL_NUMBER,
  })
  verificationMethod: VerificationMethod;

  @Column({
    type: 'enum',
    enum: VerificationStatus,
  })
  status: VerificationStatus;

  @Column({ name: 'requester_name', length: 255, nullable: true })
  requesterName: string;

  @Column({ name: 'requester_organization', length: 255, nullable: true })
  requesterOrganization: string;

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => NotarizedDocument, (doc) => doc.verificationRequests, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'document_id' })
  notarizedDocument: NotarizedDocument;
}
