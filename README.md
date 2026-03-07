# DIGITAL NOTARY VERIFICATION API

Production-grade backend API for the **Integrated Bar of the Philippines (IBP)** to serialize, verify, monitor, and audit notarization activity nationwide.

## Features

- NestJS REST API with `/api/v1/` versioning
- JWT authentication
- Role-based access control
- SHA-256 document verification
- Append-only tamper-evident audit logging
- Fraud detection alerts
- PostgreSQL-backed persistence
- Dockerized local development
- GitHub Actions CI

## Technology Stack

- Node.js 20+
- NestJS
- PostgreSQL 15+
- TypeORM
- Jest
- Docker
- Swagger / OpenAPI

## Local Setup

### 1. Copy environment file

```bash
cp .env.example .env
```

### 2. Start services

```bash
docker-compose up --build
```

### 3. Open API docs

```bash
http://localhost:3000/api/docs
```

## API Base URL

```text
/api/v1/
```

## Core Endpoints

### Auth

- `POST /api/v1/auth/login`

### Notary

- `POST /api/v1/notary/entries`
- `GET /api/v1/notary/history`

### Verification

- `POST /api/v1/verification`

### Health

- `GET /api/v1/health`

## Example Login Request

```json
{
  "email": "notary1@ibp.gov.ph",
  "password": "ChangeMe123!"
}
```

## Example Login Response

```json
{
  "accessToken": "jwt-token-here",
  "user": {
    "id": "uuid",
    "email": "notary1@ibp.gov.ph",
    "role": "NOTARY",
    "fullName": "Atty. Example User",
    "ibpNumber": "IBP-2026-0001"
  }
}
```

## Serial Number Format

```text
LAWYER_ID + REGISTER_BOOK + TIMESTAMP + SEQUENCE
```

Example:

```text
0f7e65b1-RB2026-20260307083000-000001
```

## Security Controls

- TLS-ready deployment behind reverse proxy
- JWT bearer auth
- RBAC guards
- ValidationPipe input validation
- Rate limiting
- SHA-256 hashing only
- No raw document storage
- Tamper-evident audit chaining

## Fraud Detection Rules

- Excessive notarizations per hour
- Excessive notarizations per day
- Duplicate document hash reuse
- Burst anomaly hooks for future queue worker expansion

## Production Hardening Recommendations

- Run behind NGINX or cloud load balancer with TLS 1.2+
- Store JWT secret in secret manager
- Enable OpenTelemetry tracing
- Export Prometheus metrics
- Use BullMQ or RabbitMQ for fraud jobs
- Add Redis-backed distributed rate limiting
- Enable database PITR backups
- Add WORM archival for audit exports

## Migration Strategy

Initial schema is stored in:

```text
database/migrations/initial_schema.sql
```

Future migrations should:
- be additive when possible
- include rollback scripts
- preserve audit immutability guarantees

## Notes

- The API stores only hashes and metadata
- Document originals must remain outside the platform
- Audit logs should never be edited or deleted