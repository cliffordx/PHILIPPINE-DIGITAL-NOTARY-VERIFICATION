import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../common/enums/role.enum';
import { NotarialRegister } from './notarial-register.entity';
import { NotarizedDocument } from './notarized-document.entity';

@Entity({ name: 'lawyers' })
@Unique(['email'])
@Unique(['ibpNumber'])
export class Lawyer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'ibp_number', length: 50 })
  ibpNumber!: string;

  @Column({ name: 'full_name', length: 255 })
  fullName!: string;

  @Column({ length: 255 })
  email!: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash!: string;

  @Column({ length: 50 })
  status!: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.NOTARY,
  })
  role!: Role;

  @OneToMany(() => NotarialRegister, (register) => register.lawyer)
  registers!: NotarialRegister[];

  @OneToMany(() => NotarizedDocument, (doc) => doc.lawyer)
  notarizedDocuments!: NotarizedDocument[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}