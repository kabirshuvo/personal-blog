import { hashSync } from 'bcrypt';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import { PrismaClient, type Permission, type Role } from '../src/generated/client';

loadEnv({ path: resolve(__dirname, '../../../.env') });

const prisma = new PrismaClient();

const PERMISSIONS = [
  { key: 'posts:create', description: 'Create posts' },
  { key: 'posts:edit', description: 'Edit own posts' },
  { key: 'posts:edit_all', description: 'Edit any post' },
  { key: 'posts:publish', description: 'Publish and schedule posts' },
  { key: 'posts:delete', description: 'Delete posts' },
  { key: 'categories:manage', description: 'Manage categories' },
  { key: 'tags:manage', description: 'Manage tags' },
  { key: 'media:upload', description: 'Upload media' },
  { key: 'media:manage', description: 'Manage all media' },
  { key: 'comments:moderate', description: 'Moderate comments' },
  { key: 'users:manage', description: 'Manage users and roles' },
  { key: 'analytics:view', description: 'View analytics dashboard' },
  { key: 'seo:manage', description: 'Manage SEO settings' },
  { key: 'settings:manage', description: 'Manage site settings' },
  { key: 'audit:view', description: 'View audit logs' },
] as const;

const ROLE_PERMISSIONS: Record<string, readonly string[]> = {
  admin: PERMISSIONS.map((permission) => permission.key),
  editor: [
    'posts:create',
    'posts:edit',
    'posts:edit_all',
    'posts:publish',
    'posts:delete',
    'categories:manage',
    'tags:manage',
    'media:upload',
    'media:manage',
    'comments:moderate',
    'analytics:view',
    'seo:manage',
  ],
  author: ['posts:create', 'posts:edit', 'media:upload'],
  subscriber: [],
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function hashPassword(password: string): string {
  // bcrypt.hashSync keeps seed synchronous; 12 rounds matches API default.
  return hashSync(password, 12);
}

async function seedPermissions(): Promise<Permission[]> {
  const permissions: Permission[] = [];

  for (const permission of PERMISSIONS) {
    permissions.push(
      await prisma.permission.upsert({
        where: { key: permission.key },
        update: { description: permission.description },
        create: permission,
      }),
    );
  }

  return permissions;
}

async function seedRoles(permissions: Permission[]): Promise<Record<string, Role>> {
  const permissionByKey = new Map(
    permissions.map((permission) => [permission.key, permission]),
  );
  const roles: Record<string, Role> = {};

  for (const [name, permissionKeys] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.upsert({
      where: { name },
      update: {
        description: `${name.charAt(0).toUpperCase()}${name.slice(1)} role`,
      },
      create: {
        name,
        description: `${name.charAt(0).toUpperCase()}${name.slice(1)} role`,
      },
    });

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });

    if (permissionKeys.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissionKeys.map((key) => {
          const permission = permissionByKey.get(key);
          if (!permission) {
            throw new Error(`Missing permission: ${key}`);
          }

          return {
            roleId: role.id,
            permissionId: permission.id,
          };
        }),
      });
    }

    roles[name] = role;
  }

  return roles;
}

async function seedAdmin(adminRole: Role): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL?.trim();
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME?.trim() || 'Site Administrator';

  if (!email) {
    throw new Error('SEED_ADMIN_EMAIL is required');
  }

  if (!password) {
    throw new Error('SEED_ADMIN_PASSWORD is required and cannot be empty');
  }

  const slug = slugify(name) || `admin-${email.split('@')[0]}`;

  await prisma.user.upsert({
    where: { email },
    update: {
      name,
      slug,
      passwordHash: hashPassword(password),
      provider: 'local',
      roleId: adminRole.id,
      status: 'ACTIVE',
    },
    create: {
      email,
      name,
      slug,
      passwordHash: hashPassword(password),
      provider: 'local',
      roleId: adminRole.id,
      status: 'ACTIVE',
    },
  });
}

async function seedCategories(): Promise<void> {
  const categories = [
    {
      name: 'Engineering',
      slug: 'engineering',
      description: 'Architecture, tooling, and practical software craft.',
    },
    {
      name: 'Product',
      slug: 'product',
      description: 'Product thinking, roadmaps, and user experience notes.',
    },
    {
      name: 'Writing',
      slug: 'writing',
      description: 'Essays and long-form reflections.',
    },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
      },
      create: category,
    });
  }
}

async function seedSettings(): Promise<void> {
  await prisma.setting.upsert({
    where: { key: 'site' },
    update: {
      value: {
        name: 'Monalo Journal',
        description: 'A personal blog for thoughtful writing and practical ideas.',
        logoUrl: null,
        social: {
          twitter: null,
          github: null,
          linkedin: null,
        },
      },
    },
    create: {
      key: 'site',
      value: {
        name: 'Monalo Journal',
        description: 'A personal blog for thoughtful writing and practical ideas.',
        logoUrl: null,
        social: {
          twitter: null,
          github: null,
          linkedin: null,
        },
      },
    },
  });
}

async function seedPosts(adminRoleId: string): Promise<void> {
  const admin = await prisma.user.findFirst({
    where: { roleId: adminRoleId },
  });
  if (!admin) {
    throw new Error('Admin user required before seeding posts');
  }

  const categories = await prisma.category.findMany();
  const bySlug = Object.fromEntries(
    categories.map((category) => [category.slug, category]),
  );

  const samples = [
    {
      title: 'Designing a Monorepo for a Personal Blog',
      slug: 'designing-a-monorepo-for-a-personal-blog',
      category: 'engineering',
      featured: true,
      excerpt:
        'How Turborepo, NestJS, and Next.js fit together without overcomplicating local development.',
      content:
        '<p>A monorepo keeps shared types and the Prisma client close to both the API and the web app.</p><p>Start with clear package boundaries, then add features phase by phase.</p>',
      tags: ['architecture', 'typescript'],
    },
    {
      title: 'Prisma Migrations That Stay Trustworthy',
      slug: 'prisma-migrations-that-stay-trustworthy',
      category: 'engineering',
      featured: false,
      excerpt:
        'A practical checklist for schema changes, seeds, and rollback-friendly migrations.',
      content:
        '<p>Always generate migrations from code, review SQL, and keep seed scripts idempotent.</p>',
      tags: ['database', 'prisma'],
    },
    {
      title: 'Shipping a CMS That Authors Enjoy',
      slug: 'shipping-a-cms-that-authors-enjoy',
      category: 'product',
      featured: true,
      excerpt:
        'Reduce friction in drafting, scheduling, and publishing without burying power under menus.',
      content:
        '<p>Authors need a fast editor, clear status controls, and confidence that publish means publish.</p>',
      tags: ['cms', 'ux'],
    },
    {
      title: 'What Metrics Matter Before Launch',
      slug: 'what-metrics-matter-before-launch',
      category: 'product',
      featured: false,
      excerpt:
        'Choose a few analytics signals that guide iteration instead of vanity dashboards.',
      content:
        '<p>Track page views, popular posts, and engagement first. Live charts can come later.</p>',
      tags: ['analytics'],
    },
    {
      title: 'Notes on Writing in Public',
      slug: 'notes-on-writing-in-public',
      category: 'writing',
      featured: true,
      excerpt:
        'Publishing incomplete thoughts can build trust if the craft stays honest.',
      content:
        '<p>Write for one reader. Prefer clarity over cleverness. Edit after the first draft lands.</p>',
      tags: ['craft'],
    },
    {
      title: 'A Small Ritual for Better Essays',
      slug: 'a-small-ritual-for-better-essays',
      category: 'writing',
      featured: false,
      excerpt:
        'Outline lightly, draft quickly, and leave overnight distance before the final pass.',
      content:
        '<p>Distance reveals weak transitions. Print or change context before the last edit.</p>',
      tags: ['process'],
    },
  ];

  for (const sample of samples) {
    const category = bySlug[sample.category];
    if (!category) continue;

    const tagRecords = [];
    for (const tagName of sample.tags) {
      const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      tagRecords.push(
        await prisma.tag.upsert({
          where: { slug: tagSlug },
          update: { name: tagName },
          create: { name: tagName, slug: tagSlug },
        }),
      );
    }

    const post = await prisma.post.upsert({
      where: { slug: sample.slug },
      update: {
        title: sample.title,
        excerpt: sample.excerpt,
        content: sample.content,
        featured: sample.featured,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        categoryId: category.id,
        authorId: admin.id,
        metaTitle: sample.title,
        metaDescription: sample.excerpt,
      },
      create: {
        title: sample.title,
        slug: sample.slug,
        excerpt: sample.excerpt,
        content: sample.content,
        featured: sample.featured,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        categoryId: category.id,
        authorId: admin.id,
        metaTitle: sample.title,
        metaDescription: sample.excerpt,
      },
    });

    await prisma.postTag.deleteMany({ where: { postId: post.id } });
    if (tagRecords.length > 0) {
      await prisma.postTag.createMany({
        data: tagRecords.map((tag) => ({ postId: post.id, tagId: tag.id })),
      });
    }
  }
}

async function main(): Promise<void> {
  const permissions = await seedPermissions();
  const roles = await seedRoles(permissions);
  await seedAdmin(roles.admin);
  await seedCategories();
  await seedSettings();
  await seedPosts(roles.admin.id);

  console.log('Seed complete:');
  console.log(`- ${permissions.length} permissions`);
  console.log(`- ${Object.keys(roles).length} roles`);
  console.log(`- admin user: ${process.env.SEED_ADMIN_EMAIL}`);
  console.log('- sample categories, settings, and published posts');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
