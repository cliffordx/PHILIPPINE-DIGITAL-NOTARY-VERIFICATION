import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { DocumentHash } from '../entities/document-hash.entity';
import { FraudAlert } from '../entities/fraud-alert.entity';
import { Lawyer } from '../entities/lawyer.entity';
import { NotarialRegister } from '../entities/notarial-register.entity';
import { NotarizedDocument } from '../entities/notarized-document.entity';
import { VerificationRequest } from '../entities/verification-request.entity';

export const typeOrmConfigFactory = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('DB_HOST'),
  port: configService.get<number>('DB_PORT'),
  username: configService.get<string>('DB_USER'),
  password: configService.get<string>('DB_PASSWORD'),
  database: configService.get<string>('DB_NAME'),
  entities: [
    Lawyer,
    NotarialRegister,
    NotarizedDocument,
    DocumentHash,
    AuditLog,
    VerificationRequest,
    FraudAlert,
  ],
  synchronize: false,
  autoLoadEntities: true,
});