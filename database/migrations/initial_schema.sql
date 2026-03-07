-- Philippine Digital Notary Verification API
-- Initial Schema Migration
-- Version: 1.0.0
-- Description: Creates all core tables for the digital notary verification system

BEGIN;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE lawyer_role AS ENUM ('notary', 'ibp_admin', 'auditor');
CREATE TYPE lawyer_status AS ENUM ('active', 'suspended', 'revoked', 'expired');
CREATE TYPE register_status AS ENUM ('active', 'closed', 'suspended');
CREATE TYPE document_type AS ENUM (
  'deed_of_sale', 'affidavit', 'power_of_attorney', 'deed_of_donation',
  'contract', 'acknowledgment', 'jurat', 'oath', 'certification', 'other'
);
CREATE TYPE document_status AS ENUM ('valid', 'flagged', 'revoked', 'under_review');
CREATE TYPE audit_action AS ENUM (
  'login', 'logout', 'login_failed', 'register_created', 'document_notarized',
  'document_verified', 'document_revoked', 'fraud_flagged', 'fraud_cleared',
  'lawyer_created', 'lawyer_updated', 'lawyer_suspended', 'admin_action',
  'data_export', 'verification_request'
);
CREATE TYPE audit_severity AS ENUM ('info', 'warning', 'critical');
CREATE TYPE verification_status AS ENUM ('verified', 'not_found', 'invalid', 'flagged', 'revoked');
CREATE TYPE verification_method AS ENUM ('serial_number', 'document_hash', 'qr_code');

-- ============================================================
-- LAWYERS TABLE
-- Core table for all registered lawyers / notaries
-- ============================================================

CREATE TABLE lawyers (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  roll_number                 VARCHAR(20) NOT NULL,
  ibp_number                  VARCHAR(20) NOT NULL,
  first_name                  VARCHAR(100) NOT NULL,
  last_name                   VARCHAR(100) NOT NULL,
  middle_name                 VARCHAR(100),
  email                       VARCHAR(255) NOT NULL,
  password_hash               VARCHAR(255) NOT NULL,
  role                        lawyer_role NOT NULL DEFAULT 'notary',
  status                      lawyer_status NOT NULL DEFAULT 'active',
  notarial_commission_number  VARCHAR(50),
  commission_start_date       DATE,
  commission_end_date         DATE,
  jurisdiction                VARCHAR(255),
  law_firm                    VARCHAR(255),
  office_address              TEXT,
  contact_number              VARCHAR(20),
  is_email_verified           BOOLEAN NOT NULL DEFAULT FALSE,
  last_login_at               TIMESTAMPTZ,
  failed_login_attempts       INTEGER NOT NULL DEFAULT 0,
  locked_until                TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_lawyer_roll_number UNIQUE (roll_number),
  CONSTRAINT uq_lawyer_ibp_number UNIQUE (ibp_number),
  CONSTRAINT uq_lawyer_email UNIQUE (email)
);

CREATE INDEX idx_lawyers_email ON lawyers (email);
CREATE INDEX idx_lawyers_roll_number ON lawyers (roll_number);
CREATE INDEX idx_lawyers_status ON lawyers (status);
CREATE INDEX idx_lawyers_role ON lawyers (role);

-- ============================================================
-- NOTARIAL REGISTERS TABLE
-- Each lawyer can have multiple register books per year
-- ============================================================

CREATE TABLE notarial_registers (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lawyer_id        UUID NOT NULL REFERENCES lawyers(id) ON DELETE RESTRICT,
  year             SMALLINT NOT NULL,
  book_number      SMALLINT NOT NULL,
  sequence_counter INTEGER NOT NULL DEFAULT 0,
  status           register_status NOT NULL DEFAULT 'active',
  opened_at        TIMESTAMPTZ NOT NULL,
  closed_at        TIMESTAMPTZ,
  max_entries      INTEGER NOT NULL DEFAULT 500,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_register_lawyer_year_book UNIQUE (lawyer_id, year, book_number),
  CONSTRAINT chk_year_positive CHECK (year >= 2000),
  CONSTRAINT chk_book_number_positive CHECK (book_number > 0),
  CONSTRAINT chk_max_entries_positive CHECK (max_entries > 0)
);

CREATE INDEX idx_registers_lawyer_id ON notarial_registers (lawyer_id);
CREATE INDEX idx_registers_year ON notarial_registers (year);
CREATE INDEX idx_registers_status ON notarial_registers (status);

-- ============================================================
-- NOTARIZED DOCUMENTS TABLE
-- Core notarization records. Documents are NEVER stored - only metadata and hashes.
-- ============================================================

CREATE TABLE notarized_documents (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  serial_number      VARCHAR(100) NOT NULL,
  register_id        UUID NOT NULL REFERENCES notarial_registers(id) ON DELETE RESTRICT,
  document_type      document_type NOT NULL DEFAULT 'other',
  document_title     VARCHAR(500) NOT NULL,
  principal_name     VARCHAR(255) NOT NULL,
  principal_address  TEXT,
  notarization_date  DATE NOT NULL,
  notarization_time  TIME,
  page_number        INTEGER,
  book_number        INTEGER NOT NULL,
  series_number      INTEGER NOT NULL,
  status             document_status NOT NULL DEFAULT 'valid',
  remarks            TEXT,
  is_fraud_flagged   BOOLEAN NOT NULL DEFAULT FALSE,
  fraud_reason       TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_serial_number UNIQUE (serial_number),
  CONSTRAINT chk_series_number_positive CHECK (series_number > 0)
);

CREATE INDEX idx_documents_register_id ON notarized_documents (register_id);
CREATE INDEX idx_documents_serial_number ON notarized_documents (serial_number);
CREATE INDEX idx_documents_status ON notarized_documents (status);
CREATE INDEX idx_documents_fraud_flagged ON notarized_documents (is_fraud_flagged) WHERE is_fraud_flagged = TRUE;
CREATE INDEX idx_documents_notarization_date ON notarized_documents (notarization_date);
CREATE INDEX idx_documents_principal_name ON notarized_documents (principal_name);

-- ============================================================
-- DOCUMENT HASHES TABLE
-- SHA-256 hashes of documents. Documents themselves are never stored.
-- ============================================================

CREATE TABLE document_hashes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id     UUID NOT NULL REFERENCES notarized_documents(id) ON DELETE CASCADE,
  sha256_hash     CHAR(64) NOT NULL,
  hash_algorithm  VARCHAR(20) NOT NULL DEFAULT 'SHA-256',
  file_name       VARCHAR(500),
  file_size_bytes BIGINT,
  mime_type       VARCHAR(100),
  is_primary      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_hash_format CHECK (sha256_hash ~ '^[a-f0-9]{64}$')
);

CREATE UNIQUE INDEX idx_document_hashes_sha256 ON document_hashes (sha256_hash);
CREATE INDEX idx_document_hashes_document_id ON document_hashes (document_id);

-- ============================================================
-- AUDIT LOGS TABLE
-- Tamper-resistant blockchain-style audit trail
-- Each log entry contains integrity_hash of current entry
-- and previous_hash linking to the prior entry (chain)
-- ============================================================

CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lawyer_id       UUID REFERENCES lawyers(id) ON DELETE SET NULL,
  action          audit_action NOT NULL,
  severity        audit_severity NOT NULL DEFAULT 'info',
  entity_type     VARCHAR(100),
  entity_id       VARCHAR(36),
  ip_address      VARCHAR(45),
  user_agent      TEXT,
  request_id      VARCHAR(36),
  metadata        JSONB,
  integrity_hash  CHAR(64) NOT NULL,
  previous_hash   CHAR(64),
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_integrity_hash_format CHECK (integrity_hash ~ '^[a-f0-9]{64}$')
);

CREATE INDEX idx_audit_logs_lawyer_id ON audit_logs (lawyer_id);
CREATE INDEX idx_audit_logs_action ON audit_logs (action);
CREATE INDEX idx_audit_logs_severity ON audit_logs (severity);
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id);

-- ============================================================
-- VERIFICATION REQUESTS TABLE
-- Tracks every document verification attempt
-- ============================================================

CREATE TABLE verification_requests (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id              UUID REFERENCES notarized_documents(id) ON DELETE SET NULL,
  query_value              VARCHAR(500) NOT NULL,
  verification_method      verification_method NOT NULL DEFAULT 'serial_number',
  status                   verification_status NOT NULL,
  requester_name           VARCHAR(255),
  requester_organization   VARCHAR(255),
  ip_address               VARCHAR(45),
  user_agent               TEXT,
  metadata                 JSONB,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_verification_requests_document_id ON verification_requests (document_id);
CREATE INDEX idx_verification_requests_status ON verification_requests (status);
CREATE INDEX idx_verification_requests_created_at ON verification_requests (created_at DESC);
CREATE INDEX idx_verification_requests_ip ON verification_requests (ip_address);

-- ============================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lawyers_updated_at
  BEFORE UPDATE ON lawyers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_registers_updated_at
  BEFORE UPDATE ON notarial_registers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON notarized_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
