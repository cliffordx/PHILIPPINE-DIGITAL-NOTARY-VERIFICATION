import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Lawyer } from './lawyer.entity';
import { NotarialRegister } from './notarial-register.entity';
import { DocumentHash } from './document-hash.entity';

@Entity({ name: 'notarized_documents' })
@Unique(['serialNumber'])
export class NotarizedDocument {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'lawyer_id', type: 'uuid' })
  lawyerId!: string;

  @Column({ name: 'register_id', type: 'uuid' })
  registerId!: string;

  @Column({ name: 'serial_number', length: 120 })
  serialNumber!: string;

  @Column({ name: 'document_type', length: 120 })
  documentType!: string;

  @Column({ name: 'principal_name', length: 255 })
  principalName!: string;

  @Column({ name: 'notarized_at', type: 'timestamptz' })
  notarizedAt!: Date;

  @Column({ name: 'sequence_number', type: 'int' })
  sequenceNumber!: number;

  @Column({ name: 'status', length: 50, default: 'ACTIVE' })
  status!: string;

  @ManyToOne(() => Lawyer, (lawyer) => lawyer.notarizedDocuments, {
    nullable: false,
  })
  @JoinColumn({ name: 'lawyer_id' })
  lawyer!: Lawyer;

  @ManyToOne(() => NotarialRegister, (register) => register.documents, {
    nullable: false,
  })
  @JoinColumn({ name: 'register_id' })
  register!: NotarialRegister;

  @OneToMany(() => DocumentHash, (hash) => hash.document)
  hashes!: DocumentHash[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}