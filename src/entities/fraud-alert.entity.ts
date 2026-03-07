import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FraudAlertType } from '../common/enums/fraud-alert-type.enum';

@Entity({ name: 'fraud_alerts' })
export class FraudAlert {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'lawyer_id', type: 'uuid' })
  @Index()
  lawyerId!: string;

  @Column({
    name: 'alert_type',
    type: 'enum',
    enum: FraudAlertType,
  })
  alertType!: FraudAlertType;

  @Column({ name: 'severity', length: 20 })
  severity!: string;

  @Column({ name: 'details', type: 'jsonb', default: {} })
  details!: Record<string, unknown>;

  @Column({ name: 'resolved', default: false })
  resolved!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}