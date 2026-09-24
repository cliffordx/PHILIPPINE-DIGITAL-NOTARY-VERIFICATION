# DIGITAL NOTARY VERIFICATION API (POC)

Production-grade backend API for the Integrated Bar of the Philippines (IBP) to serialize, verify, monitor, and audit notarization activity nationwide.

Author's Note & Disclaimer: This is Proof-of-Concept Digital Notary I created for educational purposes only. This is not an OFFICIAL API for the eNotary or any authorized e-Notarization platform. **[Thursday, September 24, 2026; 14:16:55]**

## Features

- NestJS REST API with `/api/v1/` versioning
- JWT authentication and RBAC authorization
- Swagger-decorated request DTOs
- SHA-256 document verification and duplicate hash detection
- Append-only tamper-evident audit logging
- BullMQ-backed fraud analysis queue
- Pino structured logging via `nestjs-pino`
- Prometheus metrics at `/metrics`
- Optional OpenTelemetry bootstrap
- PostgreSQL-backed persistence with repository abstractions
- Fraud and audit reviewer endpoints
- Docker/OrbStack local development, NGINX config, and Kubernetes manifests

## Technology Stack

- Node.js 20+
- NestJS 10
- PostgreSQL 15+
- Redis 7+
- TypeORM
- BullMQ
- Pino
- Prometheus / OpenTelemetry ready instrumentation
- Jest / Supertest

## Local Setup

### 1. Copy environment file

```bash
cp .env.example .env
```

### 2. Start PostgreSQL and Redis

```bash
docker compose up -d postgres redis
```

### 3. Install dependencies

```bash
npm install
```

### 4. Seed demo data

```bash
docker compose exec -T postgres psql -U postgres -d digital_notary < database/seed/local-dev.sql
```

Optional demo notarization seed:

```bash
npm run seed:sql
```

### 5. Start the API

```bash
npm run start:dev
```

## Useful Endpoints

- API docs: `http://localhost:3000/api/docs`
- Health: `http://localhost:3000/api/v1/health`
- Metrics: `http://localhost:3000/metrics`

## Core Endpoints

### Auth

- `POST /api/v1/auth/login`

### Notary

- `POST /api/v1/notary/entries`
- `GET /api/v1/notary/history`

### Verification

- `POST /api/v1/verification`

### Audit

- `GET /api/v1/audit/logs`
- `GET /api/v1/audit/logs/:id`

### Fraud

- `GET /api/v1/fraud/alerts`
- `PATCH /api/v1/fraud/alerts/:id/resolve`

## Default Local Credentials

- `admin@ibp.gov.ph` / `ChangeMe123!`
- `auditor@ibp.gov.ph` / `ChangeMe123!`
- `notary1@ibp.gov.ph` / `ChangeMe123!`

## Infrastructure Assets

- NGINX production config: [nginx/nginx.conf](nginx/nginx.conf)
- Kubernetes manifests: [k8s/namespace.yaml](k8s/namespace.yaml)
- Database schema: [database/migrations/initial_schema.sql](database/migrations/initial_schema.sql)
- Demo SQL seed: [database/seed/demo_seed.sql](database/seed/demo_seed.sql)

## Validation

```bash
npm run build
npm run test
npm run lint
```
