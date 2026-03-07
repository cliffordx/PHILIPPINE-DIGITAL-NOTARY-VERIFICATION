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
import { NotarizedDocument } from './notarized-document.entity';

@Entity({ name: 'notarial_registers' })
@Unique(['lawyerId', 'registerBookCode'])
export class NotarialRegister {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'lawyer_id', type: 'uuid' })
  lawyerId!: string;

  @Column({ name: 'register_book_code', length: 50 })
  registerBookCode!: string;

  @Column({ name: 'year_opened', type: 'int' })
  yearOpened!: number;

  @Column({ default: true })
  active!: boolean;

  @ManyToOne(() => Lawyer, (lawyer) => lawyer.registers, { nullable: false })
  @JoinColumn({ name: 'lawyer_id' })
  lawyer!: Lawyer;

  @OneToMany(() => NotarizedDocument, (doc) => doc.register)
  documents!: NotarizedDocument[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}