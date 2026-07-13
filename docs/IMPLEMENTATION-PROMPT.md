# Implementation Prompts

Copy-paste prompts for implementing the Personal Blog Platform defined in this repository.

**Related docs:** [`projectDetails.md`](../projectDetails.md) · [`architecture.md`](./architecture.md) · [`TODO.md`](./TODO.md)

---

## How to Use

| Approach            | When to use                                                  |
| ------------------- | ------------------------------------------------------------ |
| **Master prompt**   | New agent session; you want full autonomy across phases      |
| **Phase prompts**   | Better control, cleaner context, easier review (recommended) |
| **Continue prompt** | Resuming work after a break                                  |

Work phase by phase. Do not skip phase gates in [`TODO.md`](./TODO.md).

---

## Master Prompt (Full Project)

```text
Implement the Personal Blog Platform defined in this repository. You are the lead engineer — read all spec docs first, then execute the workflow phase by phase.

## Required reading (read ALL before writing code)
1. @projectDetails.md — product requirements and deliverables
2. @docs/architecture.md — system design, stack, API contracts, DB models
3. @docs/TODO.md — complete phased workflow with checkboxes and phase gates

## Locked architecture decisions (do not re-debate unless blocked)
- Monorepo: Turborepo with pnpm workspaces
- Frontend: Next.js 15 App Router + TypeScript + Tailwind CSS + shadcn/ui
- Backend: NestJS + TypeScript + REST API (`/api/v1`)
- Database: PostgreSQL 16 + Prisma ORM in `packages/database`
- Cache/sessions/queues: Redis + BullMQ
- Object storage: MinIO locally, S3/R2-compatible API in production
- Charts: Recharts in admin dashboard
- Auth: JWT access token + HTTP-only refresh cookie, RBAC from day one
- Package manager: pnpm

## Implementation rules
1. Follow @docs/TODO.md strictly — top to bottom, phase by phase. Do NOT skip phases or phase gates.
2. For every feature slice: Prisma model → shared DTOs (`packages/shared`) → NestJS service/controller/guards → frontend UI → verify → mark TODO items `[x]`.
3. Do NOT start Phase N+1 until Phase N gate criteria are met and you have verified locally (run dev servers, hit health endpoints, test critical flows).
4. Match existing conventions once established; keep diffs focused — no unrelated refactors.
5. Update @docs/TODO.md as you complete items (`[ ]` → `[x]`, current phase → `[-]`).
6. Create `.env.example` with all required vars; never commit secrets.
7. Do not implement deferred items unless explicitly asked: 2FA, OAuth, AI features, PWA, mobile apps, MongoDB, GraphQL.
8. Do not create git commits unless I ask. Do not push unless I ask.
9. When a phase completes, give me a short summary: what was built, how to run it, gate checklist status, and what's next.

## Target monorepo structure (from architecture.md)
blog-app/
├── apps/web/          # Next.js — (public), (auth), (admin) route groups
├── apps/api/          # NestJS — auth, users, posts, media, comments, analytics, seo, notifications
├── packages/database/ # Prisma schema + client + seed
├── packages/shared/   # DTOs, enums, types, validators
├── packages/config/   # ESLint, Prettier, TS configs
├── docker/            # docker-compose.yml (postgres, redis, minio)
└── docs/

## Execution plan
Start at Phase 0 in @docs/TODO.md:
- Phase 0: Lock decisions, define MVP scope, document in a brief `docs/ADR.md` if needed
- Phase 1: Scaffold monorepo + Docker + runnable dev environment
- Phase 2: Full Prisma schema + migrations + seed (admin user, roles, permissions)
- Phase 3: Auth + RBAC
- Phase 4: Posts, categories, tags API + scheduled publish job
- Phase 5: Public blog frontend
- Phase 6: CMS admin panel
- Phase 7: Media library
- Phase 8: Comments, bookmarks, reading history
- Phase 9: SEO (sitemap, meta, OG, JSON-LD)
- Phase 10: Analytics pipeline + live charts + WebSocket dashboard
- Phase 11: Newsletter + notifications
- Phase 12: Security hardening
- Phase 13: Performance + Redis caching
- Phase 14: Tests (unit, integration, E2E for critical paths)
- Phase 15: Docker production builds + GitHub Actions CI/CD
- Phase 16: README, Swagger, deployment runbook

## First action
1. Read all three docs completely.
2. Report current repo state (what exists vs what's missing).
3. Begin Phase 0, then immediately proceed to Phase 1 scaffolding unless I say stop.
4. Work autonomously through as much as you can in this session, stopping only at phase gates if verification fails.

Begin now.
```

---

## Phase-by-Phase Prompts (Recommended)

Use one prompt per chat/session so context stays manageable.

### Phase 0–1 (Setup)

```text
Read @projectDetails.md, @docs/architecture.md, and @docs/TODO.md.

Implement Phase 0 and Phase 1 only:
- Confirm architecture decisions (document in docs/ADR.md if anything differs)
- Define MVP scope in docs/ADR.md
- Scaffold Turborepo monorepo: apps/web (Next.js 15), apps/api (NestJS), packages/database, packages/shared, packages/config
- Docker Compose: PostgreSQL 16, Redis, MinIO
- .env.example, root README with setup steps
- Verify: `docker compose up`, `pnpm dev`, API health check, web home page

Update @docs/TODO.md checkboxes as you go. Do not proceed past Phase 1 gate. Summarize when done.
```

### Phase 2 (Database)

```text
Read @docs/architecture.md (Database section) and @docs/TODO.md Phase 2.

Implement the full Prisma schema in packages/database:
- All models: users, roles, permissions, posts, categories, tags, comments, media, bookmarks, reading_history, analytics, chart datasets, settings, notifications, audit_logs, sessions
- Indexes, relations, cascades
- Initial migration + seed script (admin user, 4 roles, base permissions, sample categories)

Verify: migration runs clean, seed works, Prisma Client importable from apps/api.

Update @docs/TODO.md. Stop at Phase 2 gate. Summarize.
```

### Phase 3 (Auth)

```text
Read @docs/architecture.md (Auth section) and @docs/TODO.md Phase 3.

Implement authentication and RBAC:
- NestJS auth module: register, login, refresh, logout, me
- JWT + HTTP-only refresh cookie, Redis session storage
- Guards: JwtAuthGuard, RolesGuard, PermissionsGuard
- Next.js: /login, /register, /profile, middleware protecting /admin
- RBAC: admin, editor, author, subscriber

Verify end-to-end: register → login → protected route → role enforcement → logout.

Update @docs/TODO.md. Stop at Phase 3 gate.
```

### Phase 4 (Content API)

```text
Read @docs/TODO.md Phase 4 and @docs/architecture.md API section.

Implement posts, categories, and tags:
- Public API: list/filter posts, single post by slug, featured, trending, related
- Admin API: full CRUD, publish, schedule, RBAC (author owns posts only)
- Categories/tags public + admin CRUD
- BullMQ scheduled publish job
- Shared DTOs in packages/shared

Verify via API calls. Update @docs/TODO.md. Stop at Phase 4 gate.
```

### Phase 5 (Public Frontend)

```text
Read @docs/TODO.md Phase 5.

Build the public blog frontend in apps/web:
- Layout, PostCard, dark/light mode
- Pages: /, /blog, /blog/[slug], /category/[slug], /tag/[slug], /author/[slug], /search
- ISR/SSR, generateMetadata, related posts, social share
- Wire to NestJS API

Verify all public routes with real data. Mobile responsive. Update @docs/TODO.md. Stop at Phase 5 gate.
```

### Phase 6–7 (CMS + Media)

```text
Read @docs/TODO.md Phase 6 and Phase 7.

Implement CMS admin panel and media library:
- Admin layout, sidebar, TanStack Query
- /admin/posts (list + TipTap editor), categories, tags, users, settings
- Media: S3/MinIO upload, /admin/media grid, picker in post editor
- Image thumbnails via sharp

Verify: create post in admin → publish → appears on public site with image.

Update @docs/TODO.md. Stop at Phase 7 gate.
```

### Phase 8–11 (Engagement, SEO, Analytics, Newsletter)

```text
Read @docs/TODO.md Phases 8–11.

Implement in order:
- Phase 8: Comments, bookmarks, reading history
- Phase 9: SEO — sitemap.xml, robots.txt, OG tags, JSON-LD, /admin/seo
- Phase 10: Analytics events, BullMQ aggregation, Redis cache, WebSocket live dashboard, Recharts on /admin
- Phase 11: Newsletter subscribe, in-app notifications

Verify each phase gate before moving on. Update @docs/TODO.md.
```

### Phase 12–16 (Production Ready)

```text
Read @docs/TODO.md Phases 12–16.

Implement:
- Phase 12: Rate limiting, Helmet, sanitization, audit logs
- Phase 13: Redis caching, bundle optimization, DB indexes
- Phase 14: Unit/integration tests + Playwright E2E for critical flows
- Phase 15: Dockerfiles, GitHub Actions CI/CD, production env docs
- Phase 16: README, Swagger, deployment runbook, final QA

Update @docs/TODO.md. Deliver launch checklist status.
```

---

## Continue Prompt (Mid-Project)

```text
Continue implementing @docs/TODO.md from where we left off.

1. Read @docs/TODO.md and find the first unchecked item.
2. Mark it `[-]` in progress.
3. Implement it following @docs/architecture.md.
4. Verify locally, mark `[x]`, move to next item.
5. Stop at the current phase gate and summarize.

Do not skip ahead. Do not commit unless I ask.
```

---

_Last updated: July 2026_
