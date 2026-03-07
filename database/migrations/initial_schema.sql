CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE role_enum AS ENUM ('NOTARY', 'IBP_ADMIN', 'AUDITOR');
CREATE TYPE fraud_alert_type_enum AS ENUM (
  'EXCESSIVE_HOURLY_ACTIVITY',
  'EXCESSIVE_DAILY_ACTIVITY',
  'DUPLICATE_DOCUMENT_HASH',
  'ABNORMAL_BURST'
);

CREATE TABLE lawyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ibp_number VARCHAR(50) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  role role_enum NOT NULL DEFAULT 'NOTARY',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notarial_registers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_id UUID NOT NULL REFERENCES lawyers(id) ON DELETE RESTRICT,
  register_book_code VARCHAR(50) NOT NULL,
  year_opened INT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (lawyer_id, register_book_code)
);

CREATE TABLE notarized_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_id UUID NOT NULL REFERENCES lawyers(id) ON DELETE RESTRICT,
  register_id UUID NOT NULL REFERENCES notarial_registers(id) ON DELETE RESTRICT,
  serial_number VARCHAR(120) NOT NULL UNIQUE,
  document_type VARCHAR(120) NOT NULL,
  principal_name VARCHAR(255) NOT NULL,
  notarized_at TIMESTAMPTZ NOT NULL,
  sequence_number INT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_register_sequence UNIQUE (register_id, sequence_number)
);

CREATE TABLE document_hashes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES notarized_documents(id) ON DELETE CASCADE,
  sha256_hash CHAR(64) NOT NULL UNIQUE,
  source_filename VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number VARCHAR(120),
  sha256_hash CHAR(64),
  request_ip VARCHAR(64),
  result_status VARCHAR(50) NOT NULL,
  matched_document_id UUID REFERENCES notarized_documents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  actor_role VARCHAR(50),
  action VARCHAR(120) NOT NULL,
  resource_type VARCHAR(120) NOT NULL,
  resource_id VARCHAR(120),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  request_ip VARCHAR(64),
  previous_hash CHAR(64),
  entry_hash CHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE fraud_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_id UUID NOT NULL REFERENCES lawyers(id) ON DELETE RESTRICT,
  alert_type fraud_alert_type_enum NOT NULL,
  severity VARCHAR(20) NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notarized_documents_lawyer_id ON notarized_documents(lawyer_id);
CREATE INDEX idx_notarized_documents_notarized_at ON notarized_documents(notarized_at DESC);
CREATE INDEX idx_document_hashes_sha256_hash ON document_hashes(sha256_hash);
CREATE INDEX idx_verification_requests_serial_number ON verification_requests(serial_number);
CREATE INDEX idx_verification_requests_sha256_hash ON verification_requests(sha256_hash);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_fraud_alerts_lawyer_id ON fraud_alerts(lawyer_id);
CREATE INDEX idx_fraud_alerts_created_at ON fraud_alerts(created_at DESC);