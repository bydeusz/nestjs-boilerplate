# NestJS Boilerplate

A production-ready NestJS starter for building scalable backend applications with authentication, database tooling, queues, file storage, and Docker-based local and production workflows.

## Tech Stack

- NestJS 11 + TypeScript
- Prisma 7 + PostgreSQL
- Redis + BullMQ
- JWT authentication + refresh tokens
- Pino logging (`nestjs-pino`)
- Nodemailer (SMTP) + Mailpit for local development
- S3-compatible file storage (MinIO)
- Swagger / OpenAPI
- Docker + Docker Compose

## Features

- JWT-based auth with refresh tokens
- Role-based access control (RBAC)
- Prisma ORM with migrations and seed workflow
- Background processing with BullMQ worker
- File handling with S3/MinIO support
- Email sending with template-ready mail module
- Health checks for app, database, and Redis
- Security defaults: Helmet, CORS, rate limiting
- Structured request/application logging
- Swagger docs in non-production mode
- Graceful shutdown support
- Separate API and worker runtime entry points

## Project Structure

```text
.
├── _docker/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── docker-compose.prod.yml
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   ├── seed.ts
│   └── seeders/
├── src/
│   ├── main.ts
│   ├── main-worker.ts
│   ├── app.module.ts
│   ├── worker.module.ts
│   ├── config/
│   ├── common/
│   ├── modules/
│   ├── prisma/
│   └── generated/
├── test/
├── .env.example
├── nest-cli.json
└── package.json
```

## Prerequisites

- Node.js `>= 22`
- npm
- Docker + Docker Compose

## Getting Started

1. Clone the repository.
2. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Start infrastructure services (Postgres, Redis, MinIO, Mailpit):

   ```bash
   npm run docker:up
   ```

5. Run database migrations:

   ```bash
   npm run prisma:dev
   ```

6. Seed the database:

   ```bash
   npm run prisma:seed
   ```

7. Start development processes (API + worker + Prisma Studio):

   ```bash
   npm run dev
   ```

## Available Scripts

### App

- `npm run dev` - run API, worker, and Prisma Studio concurrently
- `npm run build` - build NestJS app
- `npm run start` - start API app
- `npm run dev:api` - start API in watch mode
- `npm run start:worker` - start worker process
- `npm run dev:worker` - start worker in watch mode
- `npm run prod` - run production API build
- `npm run prod:worker` - run production worker build

### Docker

- `npm run docker:build`
- `npm run docker:up`
- `npm run docker:down`
- `npm run docker:reset`
- `npm run docker:remove`
- `npm run docker:prod:build`
- `npm run docker:prod:up`
- `npm run docker:prod:down`
- `npm run docker:prod:logs`

### Prisma

- `npm run prisma:generate`
- `npm run prisma:studio`
- `npm run prisma:dev`
- `npm run prisma:deploy`
- `npm run prisma:reset`
- `npm run prisma:status`
- `npm run prisma:seed`

### Quality & Tests

- `npm run lint`
- `npm run format`
- `npm run test`
- `npm run test:watch`
- `npm run test:cov`
- `npm run test:debug`
- `npm run test:e2e`

## Environment Variables

Use `.env.example` as the template.

### App

- `NODE_ENV`
- `PORT`
- `API_PREFIX`
- `CORS_ORIGIN`
- `CACHE_TTL`
- `SHUTDOWN_FORCE_EXIT_TIMEOUT_MS`
- `ALLOWED_EMAIL_DOMAINS`
- `REGISTRATION_ENABLED`

### Logging

- `LOG_LEVEL`
- `LOG_FILE_ENABLED`

### Database

- `DATABASE_URL`

### Redis

- `REDIS_HOST`
- `REDIS_PORT`

### Mail (SMTP)

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `MAIL_FROM`

### Storage (S3/MinIO)

- `S3_ENDPOINT`
- `S3_ACCESS_KEY`
- `S3_SECRET_KEY`
- `S3_BUCKET`

### Docker Compose

- `COMPOSE_PROJECT_NAME`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `POSTGRES_PORT`
- `MINIO_ROOT_USER`
- `MINIO_ROOT_PASSWORD`
- `MINIO_PORT`
- `MINIO_CONSOLE_PORT`

## API Documentation

- Swagger UI: `/docs` (enabled only when `NODE_ENV` is not `production`)
- OpenAPI JSON: `/docs-json`
- Global API prefix: `/api`
- Versioning strategy: URI versioning (`/v1`)

Example health endpoint in development:

`GET /api/v1/health`

## Docker

### Development

Uses `_docker/docker-compose.yml` and starts:

- PostgreSQL
- Redis
- MinIO
- Mailpit

```bash
npm run docker:up
```

### Production

Uses `_docker/docker-compose.prod.yml` and starts:

- PostgreSQL
- Redis
- MinIO
- Mailpit
- migration job
- API container
- worker container

```bash
npm run docker:prod:build
npm run docker:prod:up
```

The app image is built from `_docker/Dockerfile` (multi-stage build).

## Database

- Prisma schema: `prisma/schema.prisma`
- Main models:
  - `Organisation`
  - `User`
  - `File`
  - `RefreshToken`

Common commands:

```bash
npm run prisma:dev
npm run prisma:deploy
npm run prisma:seed
npm run prisma:studio
npm run prisma:reset
```

## Authentication

- Access + refresh token flow using JWT
- Public registration can be toggled with `REGISTRATION_ENABLED`
- Registration domain restrictions via `ALLOWED_EMAIL_DOMAINS`
- Role-based authorization for protected admin routes

## License

UNLICENSED
