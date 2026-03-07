INSERT INTO lawyers (id, ibp_number, full_name, email, password_hash, status, role)
VALUES
  (
    '42e02c57-0b76-441f-9181-64c239d52f29',
    'IBP-2026-10001',
    'Atty. Maria Santos',
    'notary1@ibp.example.ph',
    '$2b$10$B1vXoP6cXgqth5jL2ZG.OelsfccX55xLTmc/oHxrsQKHE3x8I3xN.',
    'ACTIVE',
    'NOTARY'
  )
ON CONFLICT (email) DO NOTHING;

INSERT INTO notarial_registers (id, lawyer_id, register_book_code, year_opened, active)
VALUES (
  'ecf4429c-d2f0-4dbc-bf2d-e768c92e8476',
  '42e02c57-0b76-441f-9181-64c239d52f29',
  'RB2026',
  2026,
  TRUE
)
ON CONFLICT (lawyer_id, register_book_code) DO NOTHING;

INSERT INTO notarized_documents (
  id,
  lawyer_id,
  register_id,
  serial_number,
  document_type,
  principal_name,
  notarized_at,
  sequence_number,
  status
)
VALUES (
  'f56234a7-d93b-4ead-9319-ffc99f764b35',
  '42e02c57-0b76-441f-9181-64c239d52f29',
  'ecf4429c-d2f0-4dbc-bf2d-e768c92e8476',
  '42e02c57-0b76-441f-9181-64c239d52f29-RB2026-20260307083000-000001',
  'AFFIDAVIT OF LOSS',
  'Juan Dela Cruz',
  '2026-03-07T08:30:00.000Z',
  1,
  'ACTIVE'
)
ON CONFLICT (serial_number) DO NOTHING;

INSERT INTO document_hashes (document_id, sha256_hash, source_filename)
VALUES (
  'f56234a7-d93b-4ead-9319-ffc99f764b35',
  '7d0f5d5f6d11f8d8e1ab4d6c9c0f6c1476abfdf4bca2d2e7f1f41de9e0db1122',
  'affidavit-of-loss.pdf'
)
ON CONFLICT (sha256_hash) DO NOTHING;
