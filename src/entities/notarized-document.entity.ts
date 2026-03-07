import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { NotarialRegister } from './notarial-register.entity';
import { DocumentHash } from './document-hash.entity';
import { VerificationRequest } from './verification-request.entity';

export enum DocumentType {
  DEED_OF_SALE = 'deed_of_sale',
  AFFIDAVIT = 'affidavit',
  POWER_OF_ATTORNEY = 'power_of_attorney',
  DEED_OF_DONATION = 'deed_of_donation',
  CONTRACT = 'contract',
  ACKNOWLEDGMENT = 'acknowledgment',
  JURAT = 'jurat',
  OATH = 'oath',
  CERTIFICATION = 'certification',
  OTHER = 'other',
}

export enum DocumentStatus {
  VALID = 'valid',
  FLAGGED = 'flagged',
  REVOKED = 'revoked',
  UNDER_REVIEW = 'under_review',
}

@Entity('notarized_documents')
export class NotarizedDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ name: 'serial_number', length: 100 })
  serialNumber: string;

  @Index()
  @Column({ name: 'register_id' })
  registerId: string;

  @Column({
    name: 'document_type',
    type: 'enum',
    enum: DocumentType,
    default: DocumentType.OTHER,
  })
  documentType: DocumentType;

  @Column({ name: 'document_title', length: 500 })
  documentTitle: string;

  @Column({ name: 'principal_name', length: 255 })
  principalName: string;

  @Column({ name: 'principal_address', type: 'text', nullable: true })
  principalAddress: string;

  @Column({ name: 'notarization_date', type: 'date' })
  notarizationDate: Date;

  @Column({ name: 'notarization_time', type: 'time', nullable: true })
  notarizationTime: string;

  @Column({ name: 'page_number', nullable: true })
  pageNumber: number;

  @Column({ name: 'book_number' })
  bookNumber: number;

  @Column({ name: 'series_number' })
  seriesNumber: number;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.VALID,
  })
  status: DocumentStatus;

  @Column({ name: 'remarks', type: 'text', nullable: true })
  remarks: string;

  @Column({ name: 'is_fraud_flagged', default: false })
  isFraudFlagged: boolean;

  @Column({ name: 'fraud_reason', type: 'text', nullable: true })
  fraudReason: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => NotarialRegister, (register) => register.notarizedDocuments, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'register_id' })
  notarialRegister: NotarialRegister;

  @OneToMany(() => DocumentHash, (hash) => hash.notarizedDocument, {
    cascade: true,
  })
  documentHashes: DocumentHash[];

  @OneToMany(() => VerificationRequest, (req) => req.notarizedDocument)
  verificationRequests: VerificationRequest[];
}
