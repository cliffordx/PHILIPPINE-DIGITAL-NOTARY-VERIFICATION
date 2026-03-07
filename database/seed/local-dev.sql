INSERT INTO lawyers (ibp_number, full_name, email, password_hash, status, role)
VALUES
  (
    'IBP-2026-90001',
    'Atty. Admin User',
    'admin@ibp.gov.ph',
    '$2b$10$B1vXoP6cXgqth5jL2ZG.OelsfccX55xLTmc/oHxrsQKHE3x8I3xN.',
    'ACTIVE',
    'IBP_ADMIN'
  ),
  (
    'IBP-2026-90002',
    'Atty. Auditor User',
    'auditor@ibp.gov.ph',
    '$2b$10$B1vXoP6cXgqth5jL2ZG.OelsfccX55xLTmc/oHxrsQKHE3x8I3xN.',
    'ACTIVE',
    'AUDITOR'
  ),
  (
    'IBP-2026-10001',
    'Atty. Maria Santos',
    'notary1@ibp.gov.ph',
    '$2b$10$B1vXoP6cXgqth5jL2ZG.OelsfccX55xLTmc/oHxrsQKHE3x8I3xN.',
    'ACTIVE',
    'NOTARY'
  )
ON CONFLICT (email) DO NOTHING;

INSERT INTO notarial_registers (lawyer_id, register_book_code, year_opened, active)
SELECT l.id, 'RB2026', 2026, TRUE
FROM lawyers l
WHERE l.email = 'notary1@ibp.gov.ph'
  AND NOT EXISTS (
    SELECT 1
    FROM notarial_registers nr
    WHERE nr.lawyer_id = l.id
      AND nr.register_book_code = 'RB2026'
  );
