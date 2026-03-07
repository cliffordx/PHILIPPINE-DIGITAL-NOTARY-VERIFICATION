import * as bcrypt from 'bcrypt';

async function run() {
  const passwordHash = await bcrypt.hash('ChangeMe123!', 10);

  console.log({
    seedUsers: [
      {
        email: 'admin@ibp.gov.ph',
        password: 'ChangeMe123!',
        passwordHash,
        role: 'IBP_ADMIN',
      },
      {
        email: 'auditor@ibp.gov.ph',
        password: 'ChangeMe123!',
        passwordHash,
        role: 'AUDITOR',
      },
      {
        email: 'notary1@ibp.gov.ph',
        password: 'ChangeMe123!',
        passwordHash,
        role: 'NOTARY',
      },
    ],
  });
}

void run();