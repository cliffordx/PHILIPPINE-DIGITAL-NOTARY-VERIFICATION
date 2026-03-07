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

@Entity('document_hashes')
export class DocumentHash {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'document_id' })
  documentId: string;

  @Index()
  @Column({ name: 'sha256_hash', length: 64 })
  sha256Hash: string;

  @Column({ name: 'hash_algorithm', length: 20, default: 'SHA-256' })
  hashAlgorithm: string;

  @Column({ name: 'file_name', length: 500, nullable: true })
  fileName: string;

  @Column({ name: 'file_size_bytes', type: 'bigint', nullable: true })
  fileSizeBytes: number;

  @Column({ name: 'mime_type', length: 100, nullable: true })
  mimeType: string;

  @Column({ name: 'is_primary', default: true })
  isPrimary: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => NotarizedDocument, (doc) => doc.documentHashes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'document_id' })
  notarizedDocument: NotarizedDocument;
}
