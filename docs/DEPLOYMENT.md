# Deployment Runbook

Production deployment guide for the Personal Blog Platform monorepo (`apps/web`, `apps/api`, `packages/database`).

## Architecture overview

| Component                 | Default port | Responsibility                                     |
| ------------------------- | ------------ | -------------------------------------------------- |
| **Web** (`apps/web`)      | 3000         | Next.js public site and CMS UI                     |
| **API** (`apps/api`)      | 4000         | NestJS REST API (`/api/v1`)                        |
| **PostgreSQL**            | 5432         | Primary relational database                        |
| **Redis**                 | 6379         | Refresh tokens, cache, BullMQ jobs                 |
| **S3-compatible storage** | —            | Media uploads (MinIO locally; S3/R2 in production) |

Swagger API docs are served at `/api/docs` when the API is running.

---

## Prerequisites

- Node.js 20+ and pnpm 11 (for build/deploy scripts)
- Docker (optional, for container builds)
- Managed PostgreSQL, Redis, and object storage in production
- A reverse proxy or platform that terminates TLS (Nginx, Cloudflare, Fly.io, Railway, Vercel, etc.)

---

## Environment variables

Copy `.env.example` and set production values. **Never commit `.env` or secrets.**

### Application

| Variable              | Required | Description                                                 |
| --------------------- | -------- | ----------------------------------------------------------- |
| `NODE_ENV`            | Yes      | Set to `production`                                         |
| `WEB_PORT`            | Web      | Port for Next.js (default `3000`)                           |
| `API_PORT`            | API      | Port for NestJS (default `4000`)                            |
| `WEB_ORIGIN`          | API      | Public web URL for CORS (e.g. `https://blog.example.com`)   |
| `NEXT_PUBLIC_API_URL` | Web      | Public API base URL (e.g. `https://api.example.com/api/v1`) |

### Database

| Variable       | Required | Description                                                   |
| -------------- | -------- | ------------------------------------------------------------- |
| `DATABASE_URL` | Yes      | PostgreSQL connection string with pooling params if supported |

Example (Neon / RDS / managed Postgres):

```bash
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/blog?schema=public&sslmode=require
```

### Redis

| Variable    | Required | Description                                                    |
| ----------- | -------- | -------------------------------------------------------------- |
| `REDIS_URL` | Yes      | Redis connection URL (e.g. `rediss://default:TOKEN@HOST:6379`) |

Used for refresh-token storage, caching, and BullMQ scheduled jobs.

### Object storage (S3-compatible)

| Variable        | Required | Description                      |
| --------------- | -------- | -------------------------------- |
| `S3_ENDPOINT`   | Yes*     | Endpoint URL (* omit for AWS S3) |
| `S3_REGION`     | Yes      | Bucket region                    |
| `S3_BUCKET`     | Yes      | Media bucket name                |
| `S3_ACCESS_KEY` | Yes      | Access key ID                    |
| `S3_SECRET_KEY` | Yes      | Secret access key                |

For Cloudflare R2, set `S3_ENDPOINT` to your R2 endpoint and use R2 API tokens.

### Auth & seeding

| Variable                 | Required  | Description                                     |
| ------------------------ | --------- | ----------------------------------------------- |
| `JWT_ACCESS_SECRET`      | Yes       | Long random secret for access tokens            |
| `JWT_REFRESH_SECRET`     | Yes       | Different long random secret for refresh tokens |
| `JWT_ACCESS_EXPIRES_IN`  | No        | Default `15m`                                   |
| `JWT_REFRESH_EXPIRES_IN` | No        | Default `7d`                                    |
| `SEED_ADMIN_EMAIL`       | Seed only | Initial admin email                             |
| `SEED_ADMIN_PASSWORD`    | Seed only | Initial admin password                          |
| `SEED_ADMIN_NAME`        | Seed only | Initial admin display name                      |

Generate secrets:

```bash
openssl rand -base64 48
```

---

## Database migrations

Run migrations **before** starting a new API version that depends on schema changes.

From the repo root:

```bash
pnpm install
pnpm db:generate
pnpm --filter @blog/database migrate:deploy
```

For first-time production setup (optional seed):

```bash
pnpm db:seed
```

Verify:

```bash
pnpm --filter @blog/database exec prisma migrate status
```

### Rollback strategy

Prisma does not auto-rollback migrations. Preferred approach:

1. Deploy the previous API/web image or release.
2. If a migration must be reversed, create a **forward** migration that undoes the change, or restore from backup (see below).

---

## Container builds

Dockerfiles live in `docker/`. Build from the **repository root**:

### API

```bash
docker build -f docker/Dockerfile.api -t blog-api:latest .
docker run --rm -p 4000:4000 \
  -e DATABASE_URL=... \
  -e REDIS_URL=... \
  -e JWT_ACCESS_SECRET=... \
  -e JWT_REFRESH_SECRET=... \
  -e WEB_ORIGIN=https://blog.example.com \
  blog-api:latest
```

### Web (Next.js standalone)

```bash
docker build -f docker/Dockerfile.web \
  --build-arg NEXT_PUBLIC_API_URL=https://api.example.com/api/v1 \
  -t blog-web:latest .
docker run --rm -p 3000:3000 blog-web:latest
```

`NEXT_PUBLIC_API_URL` must be set at **build time** for the web image.

---

## Recommended production topology

```text
                    ┌─────────────┐
   Visitors ───────►│ CDN / Proxy │─── HTTPS ───► Web (3000)
                    │ (Cloudflare)│
                    └──────┬──────┘
                           │
                           ├──────────────► API (4000) ──► PostgreSQL
                           │                    │
                           │                    ├──► Redis
                           │                    └──► S3 / R2
                           └──► Static / media CDN
```

### Platform options

| Layer    | Options                                      |
| -------- | -------------------------------------------- |
| Web      | Vercel, Fly.io, Railway, VPS + Docker        |
| API      | Fly.io, Railway, Render, VPS + Docker        |
| Postgres | Neon, Supabase, RDS, DigitalOcean Managed DB |
| Redis    | Upstash, Redis Cloud, DO Managed Redis       |
| Media    | Cloudflare R2, AWS S3, Backblaze B2          |

---

## Domain & SSL

1. Point DNS `A`/`CNAME` records to your web and API hosts.
2. Terminate TLS at your edge (Cloudflare proxy, load balancer, or platform-managed certs).
3. Set `WEB_ORIGIN` to the exact public web origin (scheme + host, no trailing slash).
4. Enforce HTTPS redirects at the proxy.
5. Set `Secure` cookies in production (`NODE_ENV=production` enables this for refresh cookies).

Example Cloudflare:

- `blog.example.com` → web app
- `api.example.com` → NestJS API
- Enable **Full (strict)** SSL and automatic HTTPS rewrites

---

## Deploy sequence (zero-downtime friendly)

1. Build and push container images (or trigger platform deploy).
2. Run `prisma migrate deploy` against production Postgres.
3. Deploy API instances with updated env vars.
4. Deploy web with matching `NEXT_PUBLIC_API_URL`.
5. Smoke-test:
   - `GET /api/v1/health` → `{ "status": "ok" }`
   - Login at `/login`, open `/admin`
   - Publish a test post and confirm public `/blog/[slug]`

---

## CI/CD

GitHub Actions workflow: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)

On every PR and push to `main`:

- Install dependencies (pnpm, Node 20)
- Generate Prisma client
- Apply migrations (CI Postgres service)
- Lint, typecheck, API unit/e2e tests
- Build all packages

Extend the workflow with deploy jobs (Fly.io, Railway, Vercel, etc.) once production targets are chosen.

---

## Backups & monitoring

| Item         | Recommendation                                                         |
| ------------ | ---------------------------------------------------------------------- |
| Database     | Daily automated backups; test restore quarterly                        |
| Media bucket | Versioning or periodic sync to cold storage                            |
| Uptime       | Health check on `/api/v1/health` (UptimeRobot, Better Stack)           |
| Errors       | Sentry or similar on API + web                                         |
| Logs         | Structured JSON logs from API; aggregate via your host or Loki/Datadog |

---

## Troubleshooting

| Symptom                        | Check                                                         |
| ------------------------------ | ------------------------------------------------------------- |
| API health fails               | `DATABASE_URL`, network to Postgres, migration status         |
| Login works locally, not prod  | `WEB_ORIGIN`, cookie `Secure`/`SameSite`, HTTPS mismatch      |
| Media upload fails             | S3 credentials, bucket policy, CORS on bucket                 |
| Scheduled posts not publishing | Redis reachable, BullMQ worker logs, API running continuously |

---

## Related docs

- [README](../README.md) — local development
- [architecture.md](./architecture.md) — system design
- [TODO.md](./TODO.md) — implementation workflow
- [USER-GUIDE.md](./USER-GUIDE.md) — admin how-to
