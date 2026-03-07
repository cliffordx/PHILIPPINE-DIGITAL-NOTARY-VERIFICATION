import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Lawyer, LawyerRole, LawyerStatus } from '../../src/entities/lawyer.entity';
import { NotarialRegister, RegisterStatus } from '../../src/entities/notarial-register.entity';
import {
  NotarizedDocument,
  DocumentType,
  DocumentStatus,
} from '../../src/entities/notarized-document.entity';
import { DocumentHash } from '../../src/entities/document-hash.entity';
import { generateSerialNumber, hashDocument } from '../../src/utils/crypto.util';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'notary_db',
  entities: [Lawyer, NotarialRegister, NotarizedDocument, DocumentHash],
  synchronize: true,
});

async function seed() {
  await AppDataSource.initialize();
  console.log('🌱 Starting database seed...');

  const lawyerRepo = AppDataSource.getRepository(Lawyer);
  const registerRepo = AppDataSource.getRepository(NotarialRegister);
  const documentRepo = AppDataSource.getRepository(NotarizedDocument);
  const hashRepo = AppDataSource.getRepository(DocumentHash);

  // Create lawyers
  const passwordHash = await bcrypt.hash('Admin@2024!', 12);

  const adminLawyer = lawyerRepo.create({
    rollNumber: '00001',
    ibpNumber: 'IBP-NCR-00001',
    firstName: 'Maria',
    lastName: 'Santos',
    middleName: 'Cruz',
    email: 'admin@ibp.org.ph',
    passwordHash,
    role: LawyerRole.IBP_ADMIN,
    status: LawyerStatus.ACTIVE,
    jurisdiction: 'National Capital Region',
  });

  const notary1 = lawyerRepo.create({
    rollNumber: '12345',
    ibpNumber: 'IBP-NCR-12345',
    firstName: 'Juan',
    lastName: 'Dela Cruz',
    middleName: 'Santos',
    email: 'juan.delacruz@example.com',
    passwordHash,
    role: LawyerRole.NOTARY,
    status: LawyerStatus.ACTIVE,
    notarialCommissionNumber: 'NCN-NCR-2024-001',
    commissionStartDate: new Date('2024-01-01'),
    commissionEndDate: new Date('2025-12-31'),
    jurisdiction: 'City of Manila',
    lawFirm: 'Dela Cruz & Associates',
    officeAddress: '123 Rizal Ave., Ermita, Manila',
    contactNumber: '+63-2-1234-5678',
  });

  const notary2 = lawyerRepo.create({
    rollNumber: '67890',
    ibpNumber: 'IBP-CEB-67890',
    firstName: 'Ana',
    lastName: 'Reyes',
    middleName: 'Lim',
    email: 'ana.reyes@example.com',
    passwordHash,
    role: LawyerRole.NOTARY,
    status: LawyerStatus.ACTIVE,
    notarialCommissionNumber: 'NCN-CEB-2024-002',
    commissionStartDate: new Date('2024-01-01'),
    commissionEndDate: new Date('2025-12-31'),
    jurisdiction: 'City of Cebu',
    lawFirm: 'Reyes Law Offices',
    officeAddress: '456 Colon St., Cebu City',
    contactNumber: '+63-32-234-5678',
  });

  const auditor = lawyerRepo.create({
    rollNumber: '99999',
    ibpNumber: 'IBP-AUD-99999',
    firstName: 'Carlos',
    lastName: 'Auditor',
    email: 'auditor@ibp.org.ph',
    passwordHash,
    role: LawyerRole.AUDITOR,
    status: LawyerStatus.ACTIVE,
    jurisdiction: 'National',
  });

  const [savedAdmin, savedNotary1, savedNotary2, savedAuditor] =
    await lawyerRepo.save([adminLawyer, notary1, notary2, auditor]);

  console.log(`✅ Created ${4} lawyers`);

  // Create notarial registers
  const currentYear = new Date().getFullYear();
  const register1 = registerRepo.create({
    lawyerId: savedNotary1.id,
    year: currentYear,
    bookNumber: 1,
    status: RegisterStatus.ACTIVE,
    openedAt: new Date(),
    maxEntries: 500,
  });

  const register2 = registerRepo.create({
    lawyerId: savedNotary2.id,
    year: currentYear,
    bookNumber: 1,
    status: RegisterStatus.ACTIVE,
    openedAt: new Date(),
    maxEntries: 500,
  });

  const [savedReg1, savedReg2] = await registerRepo.save([register1, register2]);
  console.log(`✅ Created 2 notarial registers`);

  // Create sample notarized documents
  const sampleDocuments = [
    {
      title: 'Affidavit of Loss of Passport',
      type: DocumentType.AFFIDAVIT,
      principal: 'Pedro Penduko',
      register: savedReg1,
      rollNumber: savedNotary1.rollNumber,
    },
    {
      title: 'Deed of Absolute Sale - Lot 123 Makati',
      type: DocumentType.DEED_OF_SALE,
      principal: 'Jose Protacio Rizal',
      register: savedReg1,
      rollNumber: savedNotary1.rollNumber,
    },
    {
      title: 'Special Power of Attorney',
      type: DocumentType.POWER_OF_ATTORNEY,
      principal: 'Emilio Jacinto Dizon',
      register: savedReg2,
      rollNumber: savedNotary2.rollNumber,
    },
  ];

  for (let i = 0; i < sampleDocuments.length; i++) {
    const sample = sampleDocuments[i];
    sample.register.sequenceCounter += 1;
    await registerRepo.save(sample.register);

    const serialNumber = generateSerialNumber(
      sample.rollNumber,
      currentYear,
      sample.register.bookNumber,
      sample.register.sequenceCounter,
    );

    const doc = documentRepo.create({
      serialNumber,
      registerId: sample.register.id,
      documentType: sample.type,
      documentTitle: sample.title,
      principalName: sample.principal,
      notarizationDate: new Date(),
      bookNumber: sample.register.bookNumber,
      seriesNumber: sample.register.sequenceCounter,
      status: DocumentStatus.VALID,
    });
    const savedDoc = await documentRepo.save(doc);

    // Create document hash (simulated - in reality, client computes SHA-256 of actual document)
    const simulatedContent = `${sample.title}-${sample.principal}-${Date.now()}-${i}`;
    const hash = hashDocument(simulatedContent);

    await hashRepo.save(
      hashRepo.create({
        documentId: savedDoc.id,
        sha256Hash: hash,
        fileName: `document-${i + 1}.pdf`,
        mimeType: 'application/pdf',
        fileSizeBytes: 204800,
        isPrimary: true,
      }),
    );
    console.log(`✅ Created document: ${serialNumber}`);
  }

  console.log('\n🎉 Database seed completed successfully!\n');
  console.log('Test credentials:');
  console.log('  Admin:   admin@ibp.org.ph / Admin@2024!');
  console.log('  Notary:  juan.delacruz@example.com / Admin@2024!');
  console.log('  Auditor: auditor@ibp.org.ph / Admin@2024!\n');

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
