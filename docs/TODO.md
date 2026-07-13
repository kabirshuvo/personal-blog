# Project Workflow & Todo List

Complete development workflow for the Personal Blog Platform with CMS Backend & Live Data Dashboard.

**Related docs:** [`projectDetails.md`](../projectDetails.md) · [`architecture.md`](./architecture.md)

---

## How to Use This Document

1. Work **top to bottom** within each phase — later tasks depend on earlier ones.
2. Do not skip **Phase Gates** — they confirm a phase is stable before moving on.
3. Mark items `[x]` when done, `[ ]` when pending, `[-]` when in progress.
4. One feature slice = **API → shared types → frontend → test** before starting the next slice.
5. Keep `main` deployable; use feature branches per phase or major task group.

### Status Legend

| Mark  | Meaning            |
| ----- | ------------------ |
| `[ ]` | Not started        |
| `[-]` | In progress        |
| `[x]` | Completed          |
| `[~]` | Blocked / deferred |

---

## Workflow Overview

```mermaid
flowchart TD
    P0[Phase 0: Decisions & Planning]
    P1[Phase 1: Monorepo & Dev Environment]
    P2[Phase 2: Database Schema]
    P3[Phase 3: Auth & RBAC]
    P4[Phase 4: Posts & Content API]
    P5[Phase 5: Public Blog Frontend]
    P6[Phase 6: CMS Admin Panel]
    P7[Phase 7: Media Library]
    P8[Phase 8: Engagement Features]
    P9[Phase 9: SEO & Discoverability]
    P10[Phase 10: Analytics & Live Charts]
    P11[Phase 11: Notifications & Newsletter]
    P12[Phase 12: Security Hardening]
    P13[Phase 13: Performance & Caching]
    P14[Phase 14: Testing & QA]
    P15[Phase 15: Deployment & CI/CD]
    P16[Phase 16: Documentation & Launch]

    P0 --> P1 --> P2 --> P3 --> P4
    P4 --> P5
    P4 --> P6
    P6 --> P7
    P5 --> P8
    P7 --> P8
    P8 --> P9
    P6 --> P10
    P9 --> P10
    P10 --> P11
    P11 --> P12 --> P13 --> P14 --> P15 --> P16
```

**Estimated timeline:** 8–10 weeks (solo developer, part-time adjust accordingly)

---

## Phase 0: Decisions & Planning

> **Goal:** Lock architecture choices and define scope before writing code.

### 0.1 Confirm architecture decisions

- [x] Confirm monorepo approach (Turborepo)
- [x] Confirm stack: Next.js 15, NestJS, Prisma, PostgreSQL, Redis
- [x] Confirm hosting strategy (container-friendly and provider-neutral until production deployment)
- [x] Confirm object storage provider (MinIO locally; S3-compatible provider in production)
- [x] Confirm chart library (Recharts)
- [x] Document architecture decisions and MVP scope in `docs/ADR.md`

### 0.2 Define MVP scope

- [x] List **must-have** features for v1 launch
- [x] List **nice-to-have** features deferred to post-launch
- [x] Explicitly defer: 2FA, OAuth (unless required for launch), AI features, mobile apps, PWA
- [x] Define default admin account seed strategy

### 0.3 Project setup (non-code)

- [x] Create GitHub repository and connect it as `origin`
- [x] Define branch strategy (`main` + feature branches)
- [x] Choose GitHub Issues and GitHub Projects for project management
- [~] Set up local prerequisites: Node.js 20+, Docker, pnpm/npm, Git (Docker Compose is not installed)

### Phase 0 Gate

- [x] Architecture decisions documented and agreed
- [x] MVP scope written down (what ships vs what waits)
- [x] Repository exists locally and is connected to GitHub

---

## Phase 1: Monorepo & Development Environment

> **Goal:** Runnable local dev environment with all apps and services wired together.

### 1.1 Initialize monorepo

- [x] Scaffold Turborepo root (`package.json`, `turbo.json`, workspace config)
- [x] Create `apps/web` — Next.js 15 App Router + TypeScript
- [x] Create `apps/api` — NestJS + TypeScript
- [x] Create `packages/database` — Prisma package
- [x] Create `packages/shared` — shared types, enums, constants
- [x] Create `packages/config` — ESLint, Prettier, TypeScript base configs
- [x] Configure path aliases and workspace dependencies
- [x] Add root scripts: `dev`, `build`, `lint`, `test`, `db:migrate`

### 1.2 Docker & local services

- [x] Create `docker/docker-compose.yml`
- [x] Add PostgreSQL 16 service with persistent volume
- [x] Add Redis service
- [x] Add MinIO service (S3-compatible local storage)
- [x] Add health checks for all services
- [x] Create `.env.example` with all required variables
- [x] Create local `.env` (never commit)

### 1.3 App bootstrapping

- [x] Configure NestJS: global prefix `/api/v1`, CORS, validation pipe, exception filter
- [x] Configure Next.js: route groups `(public)`, `(auth)`, `(admin)`
- [x] Install and configure Tailwind CSS in `apps/web`
- [x] Install shadcn/ui and set up base theme tokens
- [x] Add dark/light mode provider (next-themes)
- [x] Verify `pnpm dev` starts web + api concurrently
- [x] Verify API health endpoint: `GET /api/v1/health`
- [x] Verify web home page renders

### 1.4 Developer experience

- [x] Configure ESLint + Prettier across all packages
- [x] Configure Husky + lint-staged (pre-commit hooks)
- [x] Add `.gitignore` (node_modules, .env, dist, .turbo)
- [~] Add VS Code recommended extensions / settings (optional; deferred)
- [x] Write short `README.md` with local setup steps

### Phase 1 Gate

- [~] `docker compose up` starts Postgres, Redis, MinIO without errors (Docker Compose is unavailable in this environment)
- [x] `pnpm dev` runs web (port 3000) and api (port 4000) simultaneously
- [x] Health check passes on both apps

---

## Phase 2: Database Schema & Migrations

> **Goal:** Complete Prisma schema covering all core entities; migrations run cleanly.

### 2.1 Identity & access models

- [ ] Define `User` model (email, password hash, profile fields, status)
- [ ] Define `Role` model (admin, editor, author, subscriber)
- [ ] Define `Permission` model (granular: `posts:create`, etc.)
- [ ] Define `RolePermission` join table
- [ ] Define `Session` model (refresh token tracking)
- [ ] Define `AuditLog` model (actor, action, resource, metadata, IP)

### 2.2 Content models

- [ ] Define `Post` model (title, slug, content, excerpt, status, publishedAt, scheduledAt)
- [ ] Define `Category` model (name, slug, description)
- [ ] Define `Tag` model (name, slug)
- [ ] Define `PostTag` join table
- [ ] Define `Comment` model (threaded via parentId, moderation status)
- [ ] Define `Media` model (filename, mimeType, size, url, storageKey, altText)

### 2.3 Engagement models

- [ ] Define `Bookmark` model (userId + postId unique)
- [ ] Define `ReadingHistory` model (userId, postId, lastReadAt, progress)
- [ ] Define `NewsletterSubscriber` model (email, status, subscribedAt)

### 2.4 Analytics models

- [ ] Define `AnalyticsEvent` model (eventType, userId?, postId?, metadata JSON, createdAt)
- [ ] Define `AnalyticsDailyAggregate` model (date, metric, value, dimensions JSON)
- [ ] Define `ChartDataset` model (name, type, source, config JSON)
- [ ] Define `ChartDataPoint` model (datasetId, label, value, timestamp)

### 2.5 System models

- [ ] Define `Setting` model (key-value site configuration)
- [ ] Define `Notification` model (userId, type, content, readAt)

### 2.6 Schema hardening

- [ ] Add indexes: `posts(slug)`, `posts(status, publishedAt)`, `analytics_events(createdAt, eventType)`
- [ ] Add unique constraints where needed (slugs, emails)
- [ ] Add cascading delete rules (e.g. comments on post delete)
- [ ] Add `onDelete` / `onUpdate` relations explicitly
- [ ] Run initial migration: `prisma migrate dev --name init`
- [ ] Create seed script: default roles, permissions, admin user, sample categories
- [ ] Verify seed runs: `pnpm db:seed`

### Phase 2 Gate

- [ ] All models migrate without errors
- [ ] Seed creates admin user + 4 roles + base permissions
- [ ] Prisma Client generates and is importable from `packages/database`

---

## Phase 3: Authentication & Authorization

> **Goal:** Secure login/register, JWT flow, RBAC guards on all protected routes.

### 3.1 Auth module (NestJS)

- [ ] Implement password hashing (bcrypt / argon2)
- [ ] Implement `POST /auth/register` (subscriber role by default)
- [ ] Implement `POST /auth/login` (returns access token)
- [ ] Implement refresh token flow with HTTP-only cookie
- [ ] Store refresh token JTI in Redis with TTL
- [ ] Implement `POST /auth/refresh`
- [ ] Implement `POST /auth/logout` (invalidate refresh token)
- [ ] Implement `GET /auth/me` (current user + role + permissions)

### 3.2 Guards & decorators

- [ ] Create `@Public()` decorator for unauthenticated routes
- [ ] Create `@Roles()` decorator
- [ ] Create `@Permissions()` decorator
- [ ] Implement `JwtAuthGuard`
- [ ] Implement `RolesGuard`
- [ ] Implement `PermissionsGuard`
- [ ] Apply guards globally; mark public routes explicitly

### 3.3 Auth frontend (Next.js)

- [ ] Build `/login` page
- [ ] Build `/register` page
- [ ] Implement auth context / session hook
- [ ] Configure API client with token refresh interceptor
- [ ] Add Next.js middleware to protect `(admin)` and `(auth)` routes
- [ ] Redirect unauthenticated users from `/admin/*` to `/login`
- [ ] Redirect authenticated users away from `/login` to `/admin`

### 3.4 User module (basic)

- [ ] Implement `GET /users/me`
- [ ] Implement `PATCH /users/me` (profile update)
- [ ] Implement password change endpoint
- [ ] Build `/profile` page (view + edit)

### Phase 3 Gate

- [ ] Register → login → access protected route works end-to-end
- [ ] Admin role can access `/admin`; subscriber cannot
- [ ] Refresh token rotation works; logout invalidates session
- [ ] Invalid/expired tokens return 401 consistently

---

## Phase 4: Posts & Content API

> **Goal:** Full post lifecycle via API — draft, publish, schedule, categorize, tag.

### 4.1 Categories & tags module

- [ ] `GET /categories` — public list
- [ ] `GET /tags` — public list
- [ ] Admin CRUD: `POST/PATCH/DELETE /admin/categories`
- [ ] Admin CRUD: `POST/PATCH/DELETE /admin/tags`
- [ ] Slug auto-generation utility (unique, URL-safe)

### 4.2 Posts module — public endpoints

- [ ] `GET /posts` — paginated, filter by category/tag/status=published
- [ ] `GET /posts/:slug` — single published post
- [ ] `GET /posts/featured` — featured posts
- [ ] `GET /posts/trending` — trending logic (views or recent engagement)
- [ ] `GET /posts/:slug/related` — related by category/tags

### 4.3 Posts module — admin endpoints

- [ ] `GET /admin/posts` — all statuses, paginated, searchable
- [ ] `GET /admin/posts/:id` — single post (any status)
- [ ] `POST /admin/posts` — create draft
- [ ] `PATCH /admin/posts/:id` — update
- [ ] `DELETE /admin/posts/:id` — soft or hard delete
- [ ] `POST /admin/posts/:id/publish` — publish immediately
- [ ] `POST /admin/posts/:id/schedule` — set scheduledAt
- [ ] Enforce author can only edit own posts; editor/admin can edit all

### 4.4 Shared types & validation

- [ ] Define DTOs in `packages/shared`: CreatePostDto, UpdatePostDto, PostResponse
- [ ] Add validation: title required, slug unique, content min length
- [ ] Add post status enum: DRAFT, SCHEDULED, PUBLISHED, ARCHIVED

### 4.5 Scheduled publishing (background job)

- [ ] Set up BullMQ in NestJS
- [ ] Create scheduled publish job (runs every minute)
- [ ] Publish posts where `scheduledAt <= now` and status = SCHEDULED
- [ ] Log publish events to audit log

### Phase 4 Gate

- [ ] Admin can create, edit, publish, and schedule posts via API
- [ ] Public API returns only published posts
- [ ] Scheduled posts auto-publish when due
- [ ] RBAC enforced on all admin post routes

---

## Phase 5: Public Blog Frontend

> **Goal:** Visitor-facing blog — fast, responsive, SEO-friendly pages.

### 5.1 Layout & design system

- [ ] Build public layout: header, footer, navigation
- [ ] Build responsive mobile navigation
- [ ] Create reusable components: PostCard, CategoryBadge, TagList, Pagination
- [ ] Apply typography scale and reading-optimized article layout
- [ ] Verify dark/light mode on all public pages

### 5.2 Core pages

- [ ] **Home (`/`)** — featured, latest, trending sections, category grid
- [ ] **Blog listing (`/blog`)** — paginated post grid with filters
- [ ] **Article page (`/blog/[slug]`)** — SSR/ISR, rich content render, author, date
- [ ] **Category page (`/category/[slug]`)**
- [ ] **Tag page (`/tag/[slug]`)**
- [ ] **Author page (`/author/[slug]`)** — bio + post list

### 5.3 Home page features

- [ ] Featured articles section (from API)
- [ ] Latest posts section
- [ ] Trending posts section
- [ ] Categories showcase
- [ ] Newsletter subscription form (UI only — wire in Phase 11)

### 5.4 Article page features

- [ ] Render rich HTML/Markdown content safely
- [ ] Display tags and category
- [ ] Show author profile snippet
- [ ] Related posts section
- [ ] Social share buttons (Twitter/X, LinkedIn, copy link)
- [ ] Reading progress indicator (optional)

### 5.5 Search

- [ ] Build `/search` page with query input
- [ ] Implement `GET /search?q=` API (PostgreSQL full-text search)
- [ ] Display search results with highlighting
- [ ] Handle empty results state

### 5.6 Performance (initial)

- [ ] Configure ISR revalidation on home and listing pages
- [ ] Add `generateMetadata` for article pages (title, description)
- [ ] Lazy load below-fold images
- [ ] Verify Lighthouse score baseline (target > 80 performance)

### Phase 5 Gate

- [ ] All public routes render with real API data
- [ ] Article pages work with SSR/ISR
- [ ] Mobile layout verified at 375px width
- [ ] Search returns relevant results

---

## Phase 6: CMS Admin Panel

> **Goal:** Full admin UI for content management, user overview, and site control.

### 6.1 Admin shell

- [ ] Build admin layout: sidebar navigation, top bar, breadcrumbs
- [ ] Admin nav items: Dashboard, Posts, Media, Categories, Tags, Users, SEO, Analytics, Settings
- [ ] Role-based nav visibility (hide Users from non-admin)
- [ ] Admin dashboard placeholder page

### 6.2 Posts management UI

- [ ] **Posts list (`/admin/posts`)** — table with status, author, date, actions
- [ ] Filters: status, category, author, date range
- [ ] Bulk actions: publish, archive, delete
- [ ] **Post editor (`/admin/posts/new`, `/admin/posts/[id]/edit`)**
- [ ] Integrate rich text editor (TipTap or similar)
- [ ] Title, slug (auto-gen), excerpt, featured image selector
- [ ] Category and tag multi-select
- [ ] Status controls: save draft, publish, schedule (date picker)
- [ ] Preview mode (opens public URL or inline preview)

### 6.3 Categories & tags UI

- [ ] `/admin/categories` — CRUD table + modal form
- [ ] `/admin/tags` — CRUD table + modal form

### 6.4 User management UI (admin only)

- [ ] `/admin/users` — user list with role, status, last login
- [ ] Create user / invite flow
- [ ] Edit role assignment
- [ ] Deactivate / activate user

### 6.5 Settings UI

- [ ] `/admin/settings` — site name, description, logo URL, social links
- [ ] Persist via Settings API

### 6.6 TanStack Query setup

- [ ] Configure QueryClient in admin layout
- [ ] Add query hooks: `usePosts`, `usePost`, `useCategories`, etc.
- [ ] Add mutation hooks with optimistic updates where appropriate
- [ ] Toast notifications for success/error states

### Phase 6 Gate

- [ ] Admin can manage full post lifecycle without using API directly
- [ ] Rich text editor saves and renders content correctly
- [ ] Non-admin roles see appropriate UI restrictions
- [ ] All admin forms validate before submit

---

## Phase 7: Media Library

> **Goal:** Upload, store, browse, and attach media from admin and editor.

### 7.1 Storage integration

- [ ] Configure S3/R2/MinIO client in NestJS
- [ ] Implement presigned upload URL generation
- [ ] Implement `POST /admin/media/upload` (direct or presigned flow)
- [ ] Store metadata in `Media` table after upload
- [ ] Implement file type validation (images, video, documents)
- [ ] Implement file size limits

### 7.2 Media API

- [ ] `GET /admin/media` — paginated library with filters (type, date)
- [ ] `GET /admin/media/:id`
- [ ] `PATCH /admin/media/:id` — update alt text, caption
- [ ] `DELETE /admin/media/:id` — remove from storage + DB

### 7.3 Media UI

- [ ] `/admin/media` — grid/list view with thumbnails
- [ ] Upload dropzone (drag & drop + file picker)
- [ ] Upload progress indicator
- [ ] Media detail panel (preview, alt text, URL copy, delete)
- [ ] Media picker modal (used in post editor for featured image + inline)

### 7.4 Media optimization

- [ ] Generate image thumbnails on upload (sharp)
- [ ] Store width/height metadata
- [ ] Serve images via Next.js `<Image>` with remote pattern config
- [ ] Add WebP conversion (optional for v1)

### Phase 7 Gate

- [ ] Upload image → appears in library → attach to post → renders on public site
- [ ] Invalid file types rejected with clear error
- [ ] Delete removes file from storage and DB

---

## Phase 8: Engagement Features

> **Goal:** Comments, bookmarks, reading history, and user-facing interactivity.

### 8.1 Comments

- [ ] `GET /comments?postId=` — public, approved only
- [ ] `POST /comments` — authenticated users
- [ ] `PATCH /admin/comments/:id` — approve/reject/edit
- [ ] `DELETE /admin/comments/:id`
- [ ] Support threaded replies (parentId)
- [ ] Rate limit comment submission
- [ ] Build comment section UI on article page
- [ ] Build comment moderation UI in admin

### 8.2 Bookmarks

- [ ] `GET /bookmarks` — user's saved posts
- [ ] `POST /bookmarks` — add bookmark
- [ ] `DELETE /bookmarks/:postId` — remove
- [ ] Bookmark toggle button on article page
- [ ] `/bookmarks` page for logged-in users

### 8.3 Reading history

- [ ] Track page view on article read (authenticated)
- [ ] `GET /reading-history` — user's recent reads
- [ ] `/history` page for logged-in users
- [ ] Optional: reading progress percentage

### 8.4 Author profiles (public)

- [ ] Author bio field on User model (if not already)
- [ ] Public author page with avatar, bio, social links, posts

### Phase 8 Gate

- [ ] Logged-in user can comment, bookmark, and view history
- [ ] Admin can moderate comments
- [ ] Guest users can read comments but not post

---

## Phase 9: SEO & Discoverability

> **Goal:** Search-engine-ready site with proper metadata, sitemaps, and URL management.

### 9.1 Meta & Open Graph

- [ ] Per-post meta title and description fields (admin editor)
- [ ] `generateMetadata` on all public pages using post/site settings
- [ ] Open Graph tags: og:title, og:description, og:image, og:url
- [ ] Twitter Card tags
- [ ] Canonical URLs on article pages

### 9.2 SEO module (API)

- [ ] `GET /sitemap.xml` — dynamic sitemap (posts, categories, tags, authors)
- [ ] `GET /robots.txt`
- [ ] Admin: edit default meta templates in SEO settings
- [ ] Admin: `/admin/seo` — overview of posts missing meta description

### 9.3 URL management

- [ ] Slug uniqueness validation with helpful errors
- [ ] Redirect old slug → new slug on post slug change (301)
- [ ] Store slug history for redirects (optional)

### 9.4 Structured data

- [ ] JSON-LD `Article` schema on blog posts
- [ ] JSON-LD `WebSite` schema on home page
- [ ] Validate with Google Rich Results Test

### Phase 9 Gate

- [ ] `/sitemap.xml` and `/robots.txt` accessible
- [ ] Article pages pass basic OG preview (Facebook/Twitter debugger)
- [ ] No published post missing meta description (admin warning shown)

---

## Phase 10: Analytics & Live Charts

> **Goal:** Track visitor behavior, aggregate data, and display real-time dashboards in admin.

### 10.1 Event tracking

- [ ] Implement `POST /analytics/events` — public, rate-limited
- [ ] Event types: `page_view`, `post_view`, `search`, `signup`, `comment`
- [ ] Client-side tracker hook in Next.js public layout
- [ ] Capture: path, postId, referrer, userAgent, sessionId (anonymous)
- [ ] Batch events client-side to reduce API calls (optional)

### 10.2 Aggregation pipeline

- [ ] BullMQ job: hourly aggregation → `AnalyticsDailyAggregate`
- [ ] Metrics: total page views, unique visitors (session), top posts, top categories
- [ ] BullMQ job: daily roll-up for monthly statistics
- [ ] Cache aggregated results in Redis (TTL 5 min)

### 10.3 Analytics API (admin)

- [ ] `GET /admin/analytics/overview` — summary cards (today, week, month)
- [ ] `GET /admin/analytics/traffic` — time series data
- [ ] `GET /admin/analytics/popular-posts` — bar chart data
- [ ] `GET /admin/analytics/categories` — pie chart data
- [ ] `GET /admin/analytics/engagement` — comments, bookmarks, signups

### 10.4 Real-time WebSocket

- [ ] Implement WebSocket gateway in NestJS (`/ws/analytics`)
- [ ] Push live page view count to connected admin clients
- [ ] Use Redis pub/sub to fan out events across API instances
- [ ] Authenticate WebSocket connections (admin only)

### 10.5 Chart datasets (custom)

- [ ] Admin CRUD for `ChartDataset` and `ChartDataPoint`
- [ ] Support manual data entry and CSV import
- [ ] Support external API URL as data source (fetch + cache)
- [ ] `GET /admin/chart-datasets/:id/data`

### 10.6 Admin dashboard UI

- [ ] `/admin` dashboard — overview stat cards
- [ ] Line chart: traffic over time (Recharts)
- [ ] Bar chart: popular posts
- [ ] Pie chart: traffic by category
- [ ] Area chart: engagement metrics
- [ ] Live indicator on real-time page view counter
- [ ] Date range selector (7d, 30d, 90d, custom)
- [ ] `/admin/analytics` — full analytics page with all charts
- [ ] Custom chart builder UI (basic)

### Phase 10 Gate

- [ ] Page views recorded when visiting public pages
- [ ] Admin dashboard shows accurate aggregated data
- [ ] WebSocket updates live view count without page refresh
- [ ] At least 4 chart types render with real data

---

## Phase 11: Notifications & Newsletter

> **Goal:** Keep users and admin informed; grow audience via newsletter.

### 11.1 Newsletter

- [ ] `POST /newsletter/subscribe` — public, double opt-in optional
- [ ] Store in `NewsletterSubscriber` table
- [ ] Wire home page newsletter form to API
- [ ] Admin: `/admin/newsletter` — subscriber list, export CSV
- [ ] Unsubscribe endpoint + page

### 11.2 In-app notifications

- [ ] `GET /notifications` — user's notifications
- [ ] `PATCH /notifications/:id/read`
- [ ] Create notifications on: comment reply, post published (for authors)
- [ ] Notification bell in header (logged-in users)

### 11.3 Email (optional for v1)

- [ ] Configure email provider (Resend / SendGrid / SMTP)
- [ ] Send welcome email on register
- [ ] Send newsletter confirmation email
- [ ] Send new post notification to subscribers (manual trigger from admin)

### Phase 11 Gate

- [ ] Newsletter signup works from home page
- [ ] Admin can view subscriber list
- [ ] In-app notifications appear for comment replies

---

## Phase 12: Security Hardening

> **Goal:** Production-grade security before launch.

### 12.1 API security

- [ ] Rate limiting on all public endpoints (Redis-backed)
- [ ] Stricter rate limits on auth endpoints (login, register)
- [ ] Request size limits (body parser config)
- [ ] Helmet.js security headers
- [ ] CORS whitelist for production domains only

### 12.2 Input sanitization

- [ ] Sanitize rich text HTML on save (DOMPurify server-side)
- [ ] Validate and sanitize all DTO inputs
- [ ] Escape user content in API responses where needed

### 12.3 CSRF & cookies

- [ ] SameSite=Strict on refresh cookie
- [ ] Secure flag on cookies in production
- [ ] CSRF protection for cookie-based mutations (if applicable)

### 12.4 Audit & logging

- [ ] Audit log interceptor on all admin mutations
- [ ] Log: login, logout, failed login attempts
- [ ] Admin: `/admin/audit-logs` — searchable log viewer
- [ ] Structured logging (JSON) for production

### 12.5 OAuth (post-MVP or if required)

- [ ] Google OAuth via Passport
- [ ] GitHub OAuth via Passport
- [ ] Link OAuth account to existing user

### 12.6 Two-factor authentication (deferred)

- [ ] [~] TOTP 2FA — defer unless explicitly required for launch

### Phase 12 Gate

- [ ] Rate limiting blocks excessive requests
- [ ] XSS test: script tags in comments/posts are sanitized
- [ ] All admin actions appear in audit log
- [ ] Security headers present in production responses

---

## Phase 13: Performance & Caching

> **Goal:** Fast page loads, efficient API, and scalable caching layer.

### 13.1 Redis caching

- [ ] Cache published posts list (TTL 60s, invalidate on publish)
- [ ] Cache single post by slug (TTL 5m, invalidate on edit)
- [ ] Cache categories/tags (TTL 1h)
- [ ] Cache analytics overview (TTL 5m)
- [ ] Implement cache-aside pattern in NestJS service layer

### 13.2 Frontend performance

- [ ] Audit and optimize bundle size (analyze with `@next/bundle-analyzer`)
- [ ] Code-split admin routes (separate from public bundle)
- [ ] Optimize images: Next.js Image, proper sizes, priority on LCP
- [ ] Font optimization (next/font)
- [ ] Prefetch linked posts on hover (optional)

### 13.3 Database performance

- [ ] Review slow query log
- [ ] Add missing indexes based on query patterns
- [ ] Pagination on all list endpoints (cursor or offset)
- [ ] Avoid N+1 queries (Prisma `include` / dataloader pattern)

### 13.4 CDN & static assets

- [ ] Serve media via CDN (Cloudflare / R2 public URL)
- [ ] Configure cache headers on static assets
- [ ] Enable gzip/brotli compression

### Phase 13 Gate

- [ ] Lighthouse Performance score ≥ 90 on home and article pages
- [ ] API list endpoints respond < 200ms with cache warm
- [ ] No N+1 query warnings in dev logs

---

## Phase 14: Testing & Quality Assurance

> **Goal:** Confidence in core flows before production deployment.

### 14.1 Backend tests

- [ ] Unit tests: auth service (login, token refresh, password hash)
- [ ] Unit tests: posts service (CRUD, publish, schedule, RBAC)
- [ ] Unit tests: analytics aggregation logic
- [ ] Integration tests: auth flow (register → login → protected route)
- [ ] Integration tests: post publish flow
- [ ] Integration tests: comment moderation flow

### 14.2 Frontend tests

- [ ] Component tests: PostCard, CommentSection, AdminPostForm
- [ ] E2E (Playwright): public blog browse flow
- [ ] E2E: admin login → create post → publish → view on public site
- [ ] E2E: user register → bookmark → view bookmarks

### 14.3 Manual QA checklist

- [ ] All public pages on mobile (375px) and desktop (1280px)
- [ ] Dark mode on all pages
- [ ] Admin RBAC: test as admin, editor, author, subscriber
- [ ] Scheduled post publishes on time
- [ ] 404 page for invalid slugs
- [ ] Error boundaries on frontend
- [ ] API returns proper error codes (400, 401, 403, 404, 429, 500)

### Phase 14 Gate

- [ ] All critical E2E tests pass
- [ ] No P0/P1 bugs open
- [ ] Manual QA checklist completed

---

## Phase 15: Deployment & CI/CD

> **Goal:** Automated, repeatable deployments to production.

### 15.1 Containerization

- [ ] Write `Dockerfile` for NestJS API
- [ ] Write `Dockerfile` for Next.js (or use Vercel)
- [ ] Production `docker-compose.prod.yml` (optional for VPS)
- [ ] Multi-stage builds for minimal image size

### 15.2 CI pipeline (GitHub Actions)

- [ ] Workflow: lint + typecheck on every PR
- [ ] Workflow: run unit + integration tests on every PR
- [ ] Workflow: build web + api on merge to main
- [ ] Workflow: run Prisma migrations on deploy
- [ ] Block merge if CI fails

### 15.3 Production infrastructure

- [ ] Provision PostgreSQL (Neon / DigitalOcean / RDS)
- [ ] Provision Redis (Upstash / DO Managed Redis)
- [ ] Provision object storage (R2 / S3) with public read bucket
- [ ] Deploy Next.js to Vercel (or VPS)
- [ ] Deploy NestJS API to Fly.io / Railway / VPS
- [ ] Configure custom domain + SSL (Cloudflare)
- [ ] Set all production environment variables

### 15.4 Production checklist

- [ ] HTTPS enforced on all routes
- [ ] Database connection pooling configured
- [ ] Automated daily database backups
- [ ] Error monitoring (Sentry or similar)
- [ ] Uptime monitoring (UptimeRobot / Better Stack)
- [ ] Log aggregation accessible

### Phase 15 Gate

- [ ] Production URL loads public blog
- [ ] Admin panel accessible at production `/admin`
- [ ] CI/CD deploys on push to main without manual steps
- [ ] Backups verified restorable

---

## Phase 16: Documentation & Launch

> **Goal:** Ship with documentation; project is handoff-ready.

### 16.1 Technical documentation

- [ ] Update root `README.md`: overview, setup, scripts, env vars
- [ ] API documentation (Swagger/OpenAPI via NestJS)
- [ ] Database schema diagram (export from Prisma or Mermaid)
- [ ] Deployment runbook (how to deploy, rollback, migrate)
- [ ] Environment variables reference (all vars documented)

### 16.2 User documentation

- [ ] Admin user guide: how to create/publish posts
- [ ] Admin user guide: media library, SEO, analytics dashboard
- [ ] FAQ: common admin tasks

### 16.3 Launch preparation

- [ ] Seed production with initial content (at least 3 posts)
- [ ] Verify sitemap submitted to Google Search Console
- [ ] Verify OG previews on social platforms
- [ ] Final security review
- [ ] Create v1.0.0 git tag
- [ ] Announce launch 🚀

### Phase 16 Gate

- [ ] All deliverables from `projectDetails.md` checked off
- [ ] Documentation sufficient for another developer to run locally
- [ ] Site live on production domain

---

## Future Enhancements Backlog

> Not in v1 scope — track here for later phases.

- [ ] AI-powered content recommendations
- [ ] AI writing assistant in post editor
- [ ] Email marketing integration (Mailchimp, ConvertKit)
- [ ] Membership subscriptions and paywall
- [ ] Online courses module
- [ ] Podcast hosting
- [ ] Video blogging
- [ ] E-commerce integration
- [ ] Native mobile apps (iOS & Android)
- [ ] Multi-language / i18n support
- [ ] Progressive Web App (PWA)
- [ ] Two-factor authentication (2FA)
- [ ] Revenue tracking in analytics
- [ ] Meilisearch for advanced search
- [ ] TimescaleDB / ClickHouse if analytics scale demands it

---

## Milestone Summary

| Milestone | Phase       | Key deliverable              | Target    |
| --------- | ----------- | ---------------------------- | --------- |
| **M0**    | Phase 0     | Decisions locked, repo ready | Week 0    |
| **M1**    | Phase 1–2   | Dev environment + DB schema  | Week 1    |
| **M2**    | Phase 3–4   | Auth + Posts API complete    | Week 2    |
| **M3**    | Phase 5     | Public blog live locally     | Week 3    |
| **M4**    | Phase 6–7   | CMS admin + media library    | Week 4–5  |
| **M5**    | Phase 8–9   | Engagement + SEO complete    | Week 6    |
| **M6**    | Phase 10    | Analytics dashboard live     | Week 7    |
| **M7**    | Phase 11–13 | Newsletter + security + perf | Week 8    |
| **M8**    | Phase 14–16 | Tested, deployed, documented | Week 9–10 |

---

## Quick Reference: Build Order for Any Feature

When adding any new feature, always follow this order:

```
1. Prisma model (+ migration if needed)
2. Shared types/DTOs in packages/shared
3. NestJS module: service → controller → guards
4. API manual test (curl / Postman / Swagger)
5. Next.js UI consuming the API
6. TanStack Query hooks (admin) or SSR fetch (public)
7. Unit/integration test for critical path
8. Update this TODO.md checklist
```

---

_Last updated: July 2026_
