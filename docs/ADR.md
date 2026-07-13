# Architecture Decisions and MVP Scope

## ADR-001: Foundation Stack

**Status:** Accepted  
**Date:** 2026-07-13

The application will use a Turborepo monorepo managed with pnpm workspaces:

- **Web:** Next.js App Router, TypeScript, Tailwind CSS, and shadcn/ui
- **API:** NestJS REST API, versioned under `/api/v1`
- **Data:** PostgreSQL 16 with Prisma
- **Infrastructure:** Redis for caching, refresh-session tracking, and BullMQ queues
- **Development object storage:** MinIO; production storage will use an S3-compatible service such as Cloudflare R2
- **Charts:** Recharts
- **Authentication:** short-lived JWT access tokens and rotating HTTP-only refresh cookies, with role-based access control

The initial deployment target is container-friendly and provider-neutral. A production provider is intentionally deferred until the app has a verified deployment build.

## ADR-002: Version 1 Scope

### Must ship

- Public responsive blog with home, post listing, article, category, tag, author, and search pages
- CMS for posts, categories, tags, media, users, and settings
- Roles: administrator, editor, author, and subscriber
- Local email/password authentication and role-based authorization
- Draft, publish, and scheduled-post workflows
- Media upload and image metadata management
- Comments, bookmarks, and reading history
- SEO metadata, sitemap, robots.txt, Open Graph tags, and structured article data
- Basic analytics events, aggregated dashboard charts, and live dashboard updates
- Newsletter subscriptions, audit logging, security controls, tests, CI, and deployment documentation

### Deferred after version 1

- OAuth providers and two-factor authentication
- AI content features and recommendations
- Native mobile apps and PWA support
- Memberships, paywalls, courses, podcasts, video blogging, and e-commerce
- MongoDB, GraphQL, and a dedicated analytics database
- Advanced external chart data sources and revenue analytics

## ADR-003: Default Admin Seed

The seed script creates a single administrator from environment variables:

- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`
- `SEED_ADMIN_NAME`

It will refuse to use an empty password and development defaults will be documented only in `.env.example`. Production credentials must be supplied through the deployment environment.

## Working Agreement

- Use `main` as the deployable branch and feature branches for isolated work.
- Track work with GitHub Issues and a GitHub Project once the remote repository is created.
- Require Node.js 20+, pnpm, Docker Engine, and Docker Compose v2 or `docker-compose` for local services.
