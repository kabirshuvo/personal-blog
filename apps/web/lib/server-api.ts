import type {
  AnalyticsOverview,
  Category,
  PaginatedResponse,
  Post,
  Tag,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

type FetchOptions = {
  revalidate?: number | false;
  tags?: string[];
};

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
}) {
  const search = new URLSearchParams();
  if (params?.page) search.set('page', String(params.page));
  if (params?.limit) search.set('limit', String(params.limit));
  if (params?.category) search.set('category', params.category);
  if (params?.tag) search.set('tag', params.tag);
  if (params?.author) search.set('author', params.author);
  const qs = search.toString();
  return serverFetch<PaginatedResponse<Post>>(`/posts${qs ? `?${qs}` : ''}`);
}

export async function getPost(slug: string) {
  return serverFetch<Post>(`/posts/${slug}`, {
    revalidate: 30,
    tags: [`post-${slug}`],
  });
}

export async function getRelatedPosts(slug: string) {
  return serverFetch<Post[]>(`/posts/${slug}/related`, {
    revalidate: 120,
    tags: [`post-${slug}-related`],
  });
}

export async function getFeaturedPosts() {
  return serverFetch<Post[]>('/posts/featured', {
    revalidate: 120,
    tags: ['featured-posts'],
  });
}

export async function getTrendingPosts() {
  return serverFetch<Post[]>('/posts/trending', {
    revalidate: 120,
    tags: ['trending-posts'],
  });
}

export async function getCategories() {
  return serverFetch<Category[]>('/categories', {
    revalidate: 300,
    tags: ['categories'],
  });
}

export async function getCategory(slug: string) {
  return serverFetch<Category>(`/categories/${slug}`, { tags: [`category-${slug}`] });
}

export async function getTags() {
  return serverFetch<Tag[]>('/tags', { revalidate: 300, tags: ['tags'] });
}

export async function getTag(slug: string) {
  return serverFetch<Tag>(`/tags/${slug}`, { tags: [`tag-${slug}`] });
}

export async function searchPosts(q: string, page = 1) {
  return serverFetch<PaginatedResponse<Post>>(
    `/search?q=${encodeURIComponent(q)}&page=${page}`,
    { revalidate: false },
  );
}

export async function getAuthor(slug: string) {
  return serverFetch<{ id: string; name: string; slug: string; bio?: string | null }>(
    `/users/${slug}`,
    { tags: [`author-${slug}`] },
  );
}

export async function subscribeNewsletter(email: string) {
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
