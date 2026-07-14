# Admin User Guide

Short guide for managing content on the Personal Blog Platform.

## Sign in

1. Open `/login` on your site.
2. Enter the admin email and password (seeded or created by a site administrator).
3. After login you are redirected to `/admin`.

Only users with **admin**, **editor**, or **author** roles can access the CMS. Subscribers can read and engage but cannot manage posts.

---

## Create a post

1. Go to **Admin → Posts** (`/admin/posts`).
2. Click **New post** (or open `/admin/posts/new`).
3. Fill in:
   - **Title** — displayed on the public site
   - **Slug** — URL path under `/blog/[slug]` (auto-generated from title; edit if needed)
   - **Excerpt** — short summary for listings and SEO
   - **Content** — main article body (rich text)
   - **Category** and **Tags** — optional organization
   - **Featured image** — optional; pick from the media library
4. Click **Save draft** to store without publishing.

---

## Publish a post

From the post editor:

- **Publish now** — sets status to published and makes the post visible on `/blog` and `/blog/[slug]`.
- **Schedule** — choose a future date/time; the API publishes automatically when due (requires Redis and a running API worker).

You can also publish from the posts list using row actions or bulk actions (when available in your build).

---

## Edit or unpublish

1. Open **Admin → Posts** and select a post.
2. Update fields and **Save**, or change status to **Draft** / **Archived** to hide from the public site.

Editors and admins can edit any post; authors can edit only their own posts.

---

## Media library

1. Go to **Admin → Media** (`/admin/media`).
2. Upload images via drag-and-drop or file picker.
3. Set **alt text** for accessibility.
4. Copy the URL or select media when editing a post.

Supported types and size limits are enforced by the API.

---

## Categories & tags

- **Categories** — broad groupings (e.g. “Engineering”, “Notes”).
- **Tags** — finer labels (e.g. “nextjs”, “postgres”).

Manage both under **Admin → Categories** and **Admin → Tags**.

---

## SEO basics

In the post editor (when SEO fields are enabled):

- Set a custom **meta title** and **meta description** for search and social previews.
- Use a featured image for Open Graph cards.

Site-wide defaults live under **Admin → Settings** and **Admin → SEO**.

---

## Analytics dashboard

Visit **Admin → Analytics** (`/admin/analytics`) for traffic, popular posts, and engagement charts. Data is collected from public page views and aggregated in the background.

---

## Common tasks

| Task              | Where                      |
| ----------------- | -------------------------- |
| Create draft      | Admin → Posts → New        |
| Publish           | Post editor → Publish now  |
| Schedule          | Post editor → Schedule     |
| Upload image      | Admin → Media              |
| Moderate comments | Admin → Comments           |
| Manage users      | Admin → Users (admin only) |
| Change site name  | Admin → Settings           |

---

## Getting help

- API reference: `/api/docs` (Swagger UI on the running API)
- Technical setup: [DEPLOYMENT.md](./DEPLOYMENT.md)
- Development workflow: [TODO.md](./TODO.md)
