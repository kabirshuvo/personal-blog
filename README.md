# Personal Blog Platform

A full-stack personal publishing platform with a public Next.js blog, NestJS CMS API, PostgreSQL, Redis, S3-compatible media storage, and live analytics.

## Workspace layout

```text
apps/web          Next.js public site and CMS interface
apps/api          NestJS REST API
packages/database Prisma schema and database client (Phase 2)
packages/shared   Shared types and constants
packages/config   Shared tooling configuration
docker/            Local PostgreSQL, Redis, and MinIO services
docs/              Product, architecture, workflow, and ADR documents
```

## Prerequisites

- Node.js 20 or later
- pnpm 11
- Docker Engine with Docker Compose v2 (or the legacy `docker-compose` command)

## Local setup

```bash
cp .env.example .env
pnpm install
docker compose -f docker/docker-compose.yml --env-file .env up -d
pnpm dev
```

The web application runs at `http://localhost:3000`. The API health endpoint is `http://localhost:4000/api/v1/health`.

MinIO's local console is available at `http://localhost:9001`.

## Common commands

```bash
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm format
pnpm db:migrate
pnpm db:seed
```

## Environment variables

All required local environment variables are documented in `.env.example`. Never commit `.env` or production secrets.

## Project workflow

Follow [`docs/TODO.md`](docs/TODO.md) in order. Architecture decisions and MVP scope are in [`docs/ADR.md`](docs/ADR.md).
