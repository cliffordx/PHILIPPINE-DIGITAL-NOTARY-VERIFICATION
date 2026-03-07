import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'verification_requests' })
export class VerificationRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'serial_number', length: 120, nullable: true })
  @Index()
  serialNumber?: string;

  @Column({ name: 'sha256_hash', length: 64, nullable: true })
  @Index()
  sha256Hash?: string;

  @Column({ name: 'request_ip', length: 64, nullable: true })
  requestIp?: string;

  @Column({ name: 'result_status', length: 50 })
  resultStatus!: string;

  @Column({ name: 'matched_document_id', type: 'uuid', nullable: true })
  matchedDocumentId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}