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
import { Lawyer } from './lawyer.entity';
import { NotarizedDocument } from './notarized-document.entity';

export enum RegisterStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  SUSPENDED = 'suspended',
}

@Entity('notarial_registers')
@Index(['lawyerId', 'year', 'bookNumber'], { unique: true })
export class NotarialRegister {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'lawyer_id' })
  lawyerId: string;

  @Column({ type: 'smallint' })
  year: number;

  @Column({ name: 'book_number', type: 'smallint' })
  bookNumber: number;

  @Column({ name: 'sequence_counter', default: 0 })
  sequenceCounter: number;

  @Column({
    type: 'enum',
    enum: RegisterStatus,
    default: RegisterStatus.ACTIVE,
  })
  status: RegisterStatus;

  @Column({ name: 'opened_at', type: 'timestamptz' })
  openedAt: Date;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt: Date;

  @Column({ name: 'max_entries', default: 500 })
  maxEntries: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => Lawyer, (lawyer) => lawyer.notarialRegisters, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'lawyer_id' })
  lawyer: Lawyer;

  @OneToMany(() => NotarizedDocument, (doc) => doc.notarialRegister)
  notarizedDocuments: NotarizedDocument[];
}
