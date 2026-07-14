# Personal Blog Platform

A full-stack personal publishing platform with a public Next.js blog, NestJS CMS API, PostgreSQL, Redis, S3-compatible media storage, and live analytics.

## Architecture

```text
apps/web          Next.js 15 — public blog + CMS admin UI
apps/api          NestJS REST API (/api/v1) + Swagger at /api/docs
packages/database Prisma schema, migrations, and client
packages/shared   Shared DTOs, types, and constants
packages/config   Shared TypeScript base config
docker/           Local infra (Compose) and production Dockerfiles
docs/             Product, architecture, deployment, and workflow docs
```

Deep-dive design: [`docs/architecture.md`](docs/architecture.md) · Decisions: [`docs/ADR.md`](docs/ADR.md) · Task workflow: [`docs/TODO.md`](docs/TODO.md)

## Prerequisites

- Node.js 20 or later
- pnpm 11
- Docker Engine with Docker Compose v2 (optional; for local Postgres, Redis, MinIO)

## Local setup

```bash
cp .env.example .env
pnpm install
pnpm db:generate
```

Start local infrastructure:

```bash
docker compose -f docker/docker-compose.yml --env-file .env up -d
```

Apply schema and seed data, then run apps:

```bash
pnpm db:migrate
pnpm db:seed
pnpm dev
```

| Service            | URL                                 |
| ------------------ | ----------------------------------- |
| Web                | http://localhost:3000               |
| API health         | http://localhost:4000/api/v1/health |
| API docs (Swagger) | http://localhost:4000/api/docs      |
| MinIO console      | http://localhost:9001               |

## Scripts

| Command            | Description                             |
| ------------------ | --------------------------------------- |
| `pnpm dev`         | Start web + API in parallel (Turborepo) |
| `pnpm build`       | Build all packages                      |
| `pnpm lint`        | ESLint across the monorepo              |
| `pnpm typecheck`   | TypeScript check all packages           |
| `pnpm test`        | Run tests (API unit/e2e via Turbo)      |
| `pnpm format`      | Prettier write                          |
| `pnpm db:generate` | Generate Prisma client                  |
| `pnpm db:migrate`  | Run dev migrations                      |
| `pnpm db:seed`     | Seed roles, permissions, admin user     |

Filter to a single app: `pnpm --filter api test`, `pnpm --filter web build`, etc.

## Environment variables

All required variables are listed in [`.env.example`](.env.example). Never commit `.env` or production secrets.

Production reference: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)

## Docker (production images)

Build from the repository root:

```bash
# NestJS API (multi-stage, pnpm monorepo)
docker build -f docker/Dockerfile.api -t blog-api .

# Next.js web (standalone output)
docker build -f docker/Dockerfile.web \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1 \
  -t blog-web .
```

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for env vars, migrations, domain/SSL, and deploy steps.

## CI

GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs on PRs and pushes to `main`: install, Prisma generate, migrate, lint, typecheck, API tests, and full build (Node 20, pnpm).

## Documentation

| Doc                                            | Purpose                             |
| ---------------------------------------------- | ----------------------------------- |
| [`docs/TODO.md`](docs/TODO.md)                 | Phased implementation checklist     |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)     | Production deploy runbook           |
| [`docs/USER-GUIDE.md`](docs/USER-GUIDE.md)     | Admin how-to (create/publish posts) |
| [`docs/architecture.md`](docs/architecture.md) | System architecture                 |
| [`docs/ADR.md`](docs/ADR.md)                   | Architecture decision records       |

## Project workflow

Follow [`docs/TODO.md`](docs/TODO.md) top to bottom within each phase. Keep `main` deployable; use feature branches for larger changes.
