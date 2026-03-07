import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'audit_logs' })
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId?: string;

  @Column({ name: 'actor_role', length: 50, nullable: true })
  actorRole?: string;

  @Column({ name: 'action', length: 120 })
  @Index()
  action!: string;

  @Column({ name: 'resource_type', length: 120 })
  resourceType!: string;

  @Column({ name: 'resource_id', length: 120, nullable: true })
  resourceId?: string;

  @Column({ name: 'metadata', type: 'jsonb', default: {} })
  metadata!: Record<string, unknown>;

  @Column({ name: 'request_ip', length: 64, nullable: true })
  requestIp?: string;

  @Column({ name: 'previous_hash', length: 64, nullable: true })
  previousHash?: string;

  @Column({ name: 'entry_hash', length: 64 })
  entryHash!: string;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt!: Date;
}