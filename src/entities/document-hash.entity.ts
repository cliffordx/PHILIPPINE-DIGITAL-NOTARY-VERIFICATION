import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { NotarizedDocument } from './notarized-document.entity';

@Entity({ name: 'document_hashes' })
@Unique(['sha256Hash'])
export class DocumentHash {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'document_id', type: 'uuid' })
  documentId!: string;

  @Column({ name: 'sha256_hash', length: 64 })
  sha256Hash!: string;

  @Column({ name: 'source_filename', length: 255, nullable: true })
  sourceFilename?: string;

  @ManyToOne(() => NotarizedDocument, (document) => document.hashes, {
    nullable: false,
  })
  @JoinColumn({ name: 'document_id' })
  document!: NotarizedDocument;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}