import type {
  AnalyticsOverview,
  Category,
  PaginatedResponse,
  Post,
  Tag,
} from './types';
import { getPrisma } from './db';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

type FetchOptions = {
  revalidate?: number | false;
  tags?: string[];
};

const postInclude = {
  author: {
    select: { id: true, name: true, slug: true, avatarUrl: true },
  },
  category: {
    select: { id: true, name: true, slug: true, description: true },
  },
  tags: {
    include: {
      tag: { select: { id: true, name: true, slug: true } },
    },
  },
  featuredImage: {
    select: { url: true, altText: true },
  },
} as const;

function mapPost(post: {
  id: string;
  title: string;
  slug: string;
  content?: string;
  excerpt: string | null;
  status: string;
  featured: boolean;
  publishedAt: Date | null;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: Date;
  updatedAt: Date;
  author: { id: string; name: string; slug: string; avatarUrl: string | null };
  category: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
  } | null;
  tags: Array<{ tag: { id: string; name: string; slug: string } }>;
  featuredImage?: { url: string; altText: string | null } | null;
}): Post {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    content: post.content,
    excerpt: post.excerpt,
    status: post.status as Post['status'],
    featured: post.featured,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    metaTitle: post.metaTitle,
    metaDescription: post.metaDescription,
    author: post.author,
    category: post.category,
    tags: post.tags.map((entry) => entry.tag),
    featuredImage: post.featuredImage ?? null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}

async function serverFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T | null> {
  const { revalidate = 60, tags } = options;
  try {
    const res = await fetch(`${API_URL}${path}`, {
      next: { revalidate, tags },
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

export async function getPosts(params?: {
  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
  author?: string;
}): Promise<PaginatedResponse<Post> | null> {
  const prisma = getPrisma();
  if (prisma) {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const where = {
      status: 'PUBLISHED' as const,
      ...(params?.category ? { category: { slug: params.category } } : {}),
      ...(params?.tag ? { tags: { some: { tag: { slug: params.tag } } } } : {}),
      ...(params?.author ? { author: { slug: params.author } } : {}),
    };

    const [total, posts] = await prisma.$transaction([
      prisma.post.count({ where }),
      prisma.post.findMany({
        where,
        include: postInclude,
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: posts.map((post) => mapPost(post)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  const search = new URLSearchParams();
  if (params?.page) search.set('page', String(params.page));
  if (params?.limit) search.set('limit', String(params.limit));
  if (params?.category) search.set('category', params.category);
  if (params?.tag) search.set('tag', params.tag);
  if (params?.author) search.set('author', params.author);
  const qs = search.toString();
  return serverFetch<PaginatedResponse<Post>>(`/posts${qs ? `?${qs}` : ''}`);
}

export async function getPost(slug: string): Promise<Post | null> {
  const prisma = getPrisma();
  if (prisma) {
    const post = await prisma.post.findFirst({
      where: { slug, status: 'PUBLISHED' },
      include: postInclude,
    });
    return post ? mapPost(post) : null;
  }

  return serverFetch<Post>(`/posts/${slug}`, {
    revalidate: 30,
    tags: [`post-${slug}`],
  });
}

export async function getRelatedPosts(slug: string): Promise<Post[] | null> {
  const prisma = getPrisma();
  if (prisma) {
    const current = await prisma.post.findFirst({
      where: { slug, status: 'PUBLISHED' },
      select: { id: true, categoryId: true, tags: { select: { tagId: true } } },
    });
    if (!current) return [];

    const related = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        id: { not: current.id },
        OR: [
          ...(current.categoryId ? [{ categoryId: current.categoryId }] : []),
          ...(current.tags.length
            ? [
                {
                  tags: {
                    some: { tagId: { in: current.tags.map((t) => t.tagId) } },
                  },
                },
              ]
            : []),
        ],
      },
      include: postInclude,
      take: 4,
      orderBy: { publishedAt: 'desc' },
    });

    return related.map((post) => mapPost(post));
  }

  return serverFetch<Post[]>(`/posts/${slug}/related`, {
    revalidate: 120,
    tags: [`post-${slug}-related`],
  });
}

export async function getFeaturedPosts(): Promise<Post[] | null> {
  const prisma = getPrisma();
  if (prisma) {
    const posts = await prisma.post.findMany({
      where: { status: 'PUBLISHED', featured: true },
      include: postInclude,
      orderBy: { publishedAt: 'desc' },
      take: 6,
    });
    return posts.map((post) => mapPost(post));
  }

  return serverFetch<Post[]>('/posts/featured', {
    revalidate: 120,
    tags: ['featured-posts'],
  });
}

export async function getTrendingPosts(): Promise<Post[] | null> {
  const prisma = getPrisma();
  if (prisma) {
    // Without analytics pipeline on Vercel, fall back to featured then latest
    const featured = await getFeaturedPosts();
    if (featured && featured.length > 0) return featured;
    const latest = await getPosts({ limit: 6 });
    return latest?.data ?? [];
  }

  return serverFetch<Post[]>('/posts/trending', {
    revalidate: 120,
    tags: ['trending-posts'],
  });
}

export async function getCategories(): Promise<Category[] | null> {
  const prisma = getPrisma();
  if (prisma) {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { posts: true } } },
      orderBy: { name: 'asc' },
    });
    return categories;
  }

  return serverFetch<Category[]>('/categories', {
    revalidate: 300,
    tags: ['categories'],
  });
}

export async function getCategory(slug: string): Promise<Category | null> {
  const prisma = getPrisma();
  if (prisma) {
    return prisma.category.findUnique({
      where: { slug },
      include: { _count: { select: { posts: true } } },
    });
  }

  return serverFetch<Category>(`/categories/${slug}`, {
    tags: [`category-${slug}`],
  });
}

export async function getTags(): Promise<Tag[] | null> {
  const prisma = getPrisma();
  if (prisma) {
    return prisma.tag.findMany({
      include: { _count: { select: { posts: true } } },
      orderBy: { name: 'asc' },
    });
  }

  return serverFetch<Tag[]>('/tags', { revalidate: 300, tags: ['tags'] });
}

export async function getTag(slug: string): Promise<Tag | null> {
  const prisma = getPrisma();
  if (prisma) {
    return prisma.tag.findUnique({
      where: { slug },
      include: { _count: { select: { posts: true } } },
    });
  }

  return serverFetch<Tag>(`/tags/${slug}`, { tags: [`tag-${slug}`] });
}

export async function searchPosts(
  q: string,
  page = 1,
): Promise<PaginatedResponse<Post> | null> {
  const prisma = getPrisma();
  if (prisma) {
    const limit = 20;
    const where = {
      status: 'PUBLISHED' as const,
      OR: [
        { title: { contains: q, mode: 'insensitive' as const } },
        { excerpt: { contains: q, mode: 'insensitive' as const } },
        { content: { contains: q, mode: 'insensitive' as const } },
      ],
    };
    const [total, posts] = await prisma.$transaction([
      prisma.post.count({ where }),
      prisma.post.findMany({
        where,
        include: postInclude,
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return {
      data: posts.map((post) => mapPost(post)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  return serverFetch<PaginatedResponse<Post>>(
    `/search?q=${encodeURIComponent(q)}&page=${page}`,
    { revalidate: false },
  );
}

export async function getAuthor(slug: string) {
  const prisma = getPrisma();
  if (prisma) {
    return prisma.user.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true, bio: true, avatarUrl: true },
    });
  }

  return serverFetch<{ id: string; name: string; slug: string; bio?: string | null }>(
    `/users/${slug}`,
    { tags: [`author-${slug}`] },
  );
}

export async function subscribeNewsletter(email: string) {
  const prisma = getPrisma();
  if (prisma) {
    try {
      await prisma.newsletterSubscriber.upsert({
        where: { email },
        update: { status: 'ACTIVE' },
        create: { email, status: 'ACTIVE' },
      });
      return true;
    } catch {
      return false;
    }
  }

  const res = await fetch(`${API_URL}/newsletter/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return res.ok;
}

export async function getAnalyticsOverview() {
  return serverFetch<AnalyticsOverview>('/admin/analytics/overview', {
    revalidate: false,
  });
}
