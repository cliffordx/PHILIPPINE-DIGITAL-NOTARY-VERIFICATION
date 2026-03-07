# 🇵🇭 Philippine Digital Notary Verification API

A **production-ready, government-grade backend API** for the **Integrated Bar of the Philippines (IBP)** to digitally track, serialize, and audit notarial registers. This system prevents illegal mass notarization, fraudulent documents, and abuse of notarial privileges — supporting nationwide scale across thousands of lawyers and millions of notarized records.

---

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CLIENT APPLICATIONS                             │
│        (IBP Portal / Legal Apps / Public Verification)              │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ HTTPS / TLS
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   NestJS API Server (Node 20)                       │
│  ┌────────────┐  ┌────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  Auth      │  │  Notary    │  │ Verification│  │  Fraud      │  │
│  │  Module    │  │  Module    │  │  Module     │  │  Detection  │  │
│  │ (JWT+RBAC) │  │(Serialize) │  │ (SHA-256)   │  │  Service    │  │
│  └────────────┘  └────────────┘  └─────────────┘  └─────────────┘  │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────────────────┐   │
│  │  Audit     │  │Rate Limit  │  │  Global Exception Filter     │   │
│  │  Module    │  │Throttler   │  │  Logging Interceptor (Pino)  │   │
│  │ (Tamper-   │  │(100/min)   │  └─────────────────────────────┘   │
│  │  resistant)│  └────────────┘                                     │
│  └────────────┘                                                      │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ TypeORM
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   PostgreSQL 15+ Database                           │
│  lawyers │ notarial_registers │ notarized_documents │ document_hashes│
│  audit_logs (blockchain-linked) │ verification_requests             │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

| Concern | Implementation |
|---------|---------------|
| **Authentication** | JWT Bearer tokens (8h expiry, bcrypt password hashing) |
| **Authorization** | RBAC with 3 roles: `notary`, `ibp_admin`, `auditor` |
| **Document Storage** | **SHA-256 hashes ONLY** — original documents never stored |
| **Serial Numbers** | `PH{ROLL}-{YEAR}-{BOOK}-{SEQ}` — collision-free via DB transactions |
| **Audit Trail** | Blockchain-style hash chain — each entry hashes previous entry |
| **Fraud Detection** | Background cron jobs (30-min intervals) + real-time burst detection |
| **Rate Limiting** | Throttler guard: 100 requests/minute per IP |
| **API Versioning** | All routes prefixed with `/api/v1/` |

---

## 🔐 Security Features

- **SHA-256 document hashing** — Documents are never stored, only their cryptographic hashes
- **RBAC guards** — Role-based access for Notary, IBP Admin, and Auditor
- **Rate limiting** — Prevents brute force and abuse (100 req/min default)
- **Request validation** — All DTOs validated using `class-validator`
- **Account lockout** — 5 failed login attempts locks account for 15 minutes
- **Tamper-resistant audit logs** — Each entry contains a SHA-256 hash of itself + previous entry (blockchain-style chain)
- **TLS-ready** — SSL/TLS configuration for production deployments
- **Non-root Docker** — Container runs as unprivileged `notary` user

---

## 🏗️ Repository Structure

```
├── src/
│   ├── main.ts                          # Application entry point + Swagger setup
│   ├── app.module.ts                    # Root application module
│   ├── modules/
│   │   ├── auth/                        # Authentication (JWT, RBAC)
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   └── dto/
│   │   │       ├── login.dto.ts
│   │   │       └── register-lawyer.dto.ts
│   │   ├── notary/                      # Notarization management
│   │   │   ├── notary.controller.ts
│   │   │   ├── notary.service.ts
│   │   │   ├── notary.module.ts
│   │   │   └── dto/
│   │   │       ├── create-notarization.dto.ts
│   │   │       └── create-register.dto.ts
│   │   ├── verification/                # Document verification
│   │   │   ├── verification.controller.ts
│   │   │   ├── verification.service.ts
│   │   │   ├── verification.module.ts
│   │   │   └── dto/
│   │   │       └── verify-document.dto.ts
│   │   ├── audit/                       # Tamper-proof audit logging
│   │   │   ├── audit.controller.ts
│   │   │   ├── audit.service.ts
│   │   │   └── audit.module.ts
│   │   └── fraud/                       # Fraud detection (background jobs)
│   │       ├── fraud.controller.ts
│   │       ├── fraud-detection.service.ts
│   │       └── fraud.module.ts
│   ├── entities/
│   │   ├── lawyer.entity.ts
│   │   ├── notarial-register.entity.ts
│   │   ├── notarized-document.entity.ts
│   │   ├── document-hash.entity.ts
│   │   ├── audit-log.entity.ts
│   │   └── verification-request.entity.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   ├── roles.guard.ts
│   │   └── roles.decorator.ts
│   ├── middleware/
│   │   ├── http-exception.filter.ts
│   │   └── logging.interceptor.ts
│   ├── config/
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   └── jwt.config.ts
│   └── utils/
│       ├── crypto.util.ts               # SHA-256 hashing + serial generation
│       └── response.util.ts
├── database/
│   ├── migrations/
│   │   └── initial_schema.sql           # Production-ready PostgreSQL schema
│   └── seed/
│       └── seed.ts                      # Sample data for development
├── test/
│   └── app.e2e-spec.ts
├── .github/
│   └── workflows/
│       └── ci.yml                       # GitHub Actions CI/CD pipeline
├── Dockerfile                           # Multi-stage production Docker build
├── docker-compose.yml                   # Full stack local development
├── .env.example                         # Environment variable template
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm 9+
- Docker & Docker Compose (for containerized setup)
- PostgreSQL 15+ (for local setup)

### Option A: Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/cliffordx/PHILIPPINE-DIGITAL-NOTARY-VERIFICATION.git
cd PHILIPPINE-DIGITAL-NOTARY-VERIFICATION

# Copy environment file
cp .env.example .env
# Edit .env with your values (especially JWT_SECRET)

# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f api
```

The API will be available at: `http://localhost:3000/api/v1`  
Swagger docs: `http://localhost:3000/api/v1/docs`

### Option B: Local Development

```bash
# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env — set DB_HOST, DB_PASSWORD, JWT_SECRET, etc.

# Set up PostgreSQL (run migration)
psql -U postgres -c "CREATE DATABASE notary_db;"
psql -U postgres -d notary_db -f database/migrations/initial_schema.sql

# Seed sample data
npm run seed

# Start in development mode (with hot reload)
npm run start:dev
```

---

## ⚙️ Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | `development` |
| `PORT` | Server port | `3000` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USERNAME` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | — |
| `DB_NAME` | Database name | `notary_db` |
| `DB_SSL` | Enable SSL for DB | `false` |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | — **REQUIRED** |
| `JWT_EXPIRES_IN` | JWT token expiry | `8h` |
| `THROTTLE_TTL` | Rate limit window (seconds) | `60` |
| `THROTTLE_LIMIT` | Max requests per window | `100` |
| `FRAUD_HOURLY_THRESHOLD` | Max notarizations/hour before alert | `20` |
| `FRAUD_DAILY_THRESHOLD` | Max notarizations/day before alert | `100` |

---

## 📡 API Reference

All endpoints are prefixed with `/api/v1/`. Full interactive docs available at `/api/v1/docs`.

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Register a new lawyer/notary |
| `POST` | `/auth/login` | Login and receive JWT token |

**Example: Login**
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "juan.delacruz@example.com",
  "password": "Str0ng!Pass#2024"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "lawyer": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "rollNumber": "12345",
    "firstName": "Juan",
    "lastName": "Dela Cruz",
    "email": "juan.delacruz@example.com",
    "role": "notary",
    "status": "active"
  }
}
```

### Notary Endpoints (Requires `notary` role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/notary/registers` | Create a new notarial register book |
| `GET` | `/notary/registers` | Get my register books |
| `POST` | `/notary/documents` | Register a new notarization entry |
| `GET` | `/notary/documents` | Get my notarization history |
| `GET` | `/notary/documents/:id` | Get a specific notarized document |
| `DELETE` | `/notary/documents/:id` | Revoke a notarized document |

**Example: Notarize a Document**
```http
POST /api/v1/notary/documents
Authorization: Bearer <token>
Content-Type: application/json

{
  "documentType": "affidavit",
  "documentTitle": "Affidavit of Loss of Passport",
  "principalName": "Pedro Penduko",
  "principalAddress": "123 Mabini St., Manila",
  "notarizationDate": "2024-03-15",
  "documentHash": "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
  "fileName": "affidavit-loss-passport.pdf",
  "mimeType": "application/pdf",
  "fileSizeBytes": 204800
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "serialNumber": "PH012345-2024-001-0001",
  "documentType": "affidavit",
  "documentTitle": "Affidavit of Loss of Passport",
  "principalName": "Pedro Penduko",
  "notarizationDate": "2024-03-15",
  "status": "valid",
  "bookNumber": 1,
  "seriesNumber": 1,
  "createdAt": "2024-03-15T10:30:00.000Z"
}
```

### Verification Endpoint (Public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/verification/verify` | Verify a notarized document |

**Example: Verify a Document**
```http
POST /api/v1/verification/verify
Content-Type: application/json

{
  "queryValue": "PH012345-2024-001-0001",
  "method": "serial_number",
  "requesterName": "Registry of Deeds Manila",
  "requesterOrganization": "Land Registration Authority"
}
```

**Response (Valid document):**
```json
{
  "status": "verified",
  "document": {
    "serialNumber": "PH012345-2024-001-0001",
    "documentType": "affidavit",
    "documentTitle": "Affidavit of Loss of Passport",
    "principalName": "Pedro Penduko",
    "notarizationDate": "2024-03-15",
    "status": "valid",
    "notarialRegister": {
      "year": 2024,
      "bookNumber": 1,
      "lawyer": {
        "firstName": "Juan",
        "lastName": "Dela Cruz",
        "rollNumber": "12345",
        "jurisdiction": "City of Manila"
      }
    }
  },
  "verificationId": "550e8400-e29b-41d4-a716-446655440002",
  "verifiedAt": "2024-03-15T14:00:00.000Z"
}
```

**Error Response Format:**
```json
{
  "status": "error",
  "code": "NOT_FOUND",
  "message": "Document not found",
  "path": "/api/v1/verification/verify",
  "timestamp": "2024-03-15T14:00:00.000Z"
}
```

### Audit Endpoints (Requires `ibp_admin` or `auditor` role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/audit/logs` | Retrieve audit logs with filtering |
| `GET` | `/audit/integrity` | Verify audit log chain integrity |

### Fraud Detection (Requires `ibp_admin` or `auditor` role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/fraud/alerts` | Get fraud-flagged documents |
| `GET` | `/fraud/run-checks` | Manually trigger fraud checks |

---

## 🔢 Serial Number Format

Each notarized document receives a unique, human-readable serial number:

```
PH{ROLL_NUMBER}-{YEAR}-{BOOK_NUMBER}-{SEQUENCE}

Example: PH012345-2024-001-0001
         │         │    │   └── Sequence within book (0001-9999)
         │         │    └────── Book number (001-999)
         │         └─────────── Year (2024)
         └───────────────────── Lawyer roll number (padded to 6 digits)
```

Serial numbers are generated atomically within PostgreSQL transactions to prevent collisions.

---

## 🚨 Fraud Detection

The system runs **automated fraud detection every 30 minutes** and detects:

1. **Excessive Hourly Notarizations** — More than 20 documents/hour by a single lawyer
2. **Excessive Daily Notarizations** — More than 100 documents/day by a single lawyer  
3. **Duplicate Document Hashes** — Same SHA-256 hash appearing in multiple records
4. **Abnormal Burst Activity** — More than 10 documents in any 5-minute window

When fraud is detected:
- Documents are flagged with `is_fraud_flagged = true`
- A `CRITICAL` severity audit log entry is created
- Flagged documents return `status: "flagged"` in verification responses

---

## 🗄️ Database Schema

```
lawyers
├── id (UUID, PK)
├── roll_number (UNIQUE)
├── ibp_number (UNIQUE)
├── email (UNIQUE)
├── password_hash
├── role: notary | ibp_admin | auditor
└── status: active | suspended | revoked | expired

notarial_registers
├── id (UUID, PK)
├── lawyer_id (FK → lawyers)
├── year + book_number (UNIQUE per lawyer)
└── sequence_counter (auto-incremented)

notarized_documents
├── id (UUID, PK)
├── serial_number (UNIQUE)
├── register_id (FK → notarial_registers)
├── document_type, title, principal
└── status: valid | flagged | revoked | under_review

document_hashes  ← Documents never stored, only SHA-256 hashes
├── id (UUID, PK)
├── document_id (FK → notarized_documents)
└── sha256_hash (UNIQUE, CHAR(64))

audit_logs  ← Tamper-resistant blockchain-style chain
├── id (UUID, PK)
├── action, severity, entity
├── integrity_hash ← SHA-256(current entry + previous hash)
└── previous_hash ← Links to previous audit entry

verification_requests
├── id (UUID, PK)
├── document_id (FK)
├── query_value, method
└── status: verified | not_found | invalid | flagged | revoked
```

---

## 🧪 Testing

```bash
# Run all unit tests
npm test

# Run tests with coverage
npm run test:cov

# Run e2e tests (requires running database)
npm run test:e2e

# Run tests in watch mode
npm run test:watch
```

**Test Coverage:**
- `crypto.util.spec.ts` — SHA-256 hashing, serial number generation
- `auth.service.spec.ts` — Login, registration, account lockout
- `notary.service.spec.ts` — Register creation, document notarization
- `verification.service.spec.ts` — Document verification by serial & hash
- `audit.service.spec.ts` — Tamper-resistant audit log creation

---

## 🏃 RBAC Roles

| Role | Capabilities |
|------|-------------|
| `notary` | Create registers, notarize documents, view own history |
| `ibp_admin` | All notary actions + manage lawyers + view all audit logs + fraud alerts |
| `auditor` | Read-only access to audit logs, fraud alerts, verification stats |

---

## 🐳 Docker

```bash
# Build production image
docker build -t notary-api:latest .

# Run with environment variables
docker run -p 3000:3000 \
  -e DB_HOST=your-db-host \
  -e JWT_SECRET=your-secret \
  notary-api:latest

# Start full stack (API + PostgreSQL + PgAdmin)
docker-compose --profile dev up -d
```

---

## 📊 Monitoring

The application is designed to be monitoring-ready:

- **Structured logging** via NestJS Logger (compatible with Pino/Winston)
- **Request/response logging** via `LoggingInterceptor`
- **Health check** endpoint for load balancer probes
- **OpenAPI/Swagger** documentation at `/api/v1/docs`
- Prometheus/OpenTelemetry can be integrated via `@nestjs/terminus` and `@nestjs/otel`

---

## 👥 Test Accounts (After Seeding)

| Role | Email | Password |
|------|-------|----------|
| IBP Admin | admin@ibp.org.ph | Admin@2024! |
| Notary (Manila) | juan.delacruz@example.com | Admin@2024! |
| Auditor | auditor@ibp.org.ph | Admin@2024! |

---

## 📄 License

UNLICENSED — Proprietary software for the Integrated Bar of the Philippines.

---

*Developed for the Integrated Bar of the Philippines (IBP) — ensuring transparency, traceability, and prevention of abuse of notarial privileges across the Philippines.*