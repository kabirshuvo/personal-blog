import { expect, test } from '@playwright/test';

const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
const password = process.env.SEED_ADMIN_PASSWORD ?? 'change-me-before-seeding';

test('admin can login, create a draft post, and visit public blog', async ({
  page,
}) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/admin/);

  const slug = `e2e-post-${Date.now()}`;
  await page.goto('/admin/posts/new');
  await page.getByLabel('Title').fill('E2E Publish Flow');
  await page.getByLabel('Slug').fill(slug);
  await page.getByLabel('Excerpt').fill('Created by Playwright');
  // TipTap content area
  await page.locator('.ProseMirror').click();
  await page.keyboard.type('Hello from Playwright end-to-end coverage.');
  await page.getByLabel('Status').selectOption('PUBLISHED');
  await page.getByRole('button', { name: /Create post|Update post/i }).click();

  await page.goto(`/blog/${slug}`);
  await expect(page.getByRole('heading', { name: 'E2E Publish Flow' })).toBeVisible({
    timeout: 15000,
  });
});
