export type UserRole = {
  id: string;
  name: string;
};

export type User = {
  id: string;
  email: string;
  name: string;
  slug: string;
  bio?: string | null;
  avatarUrl?: string | null;
  role?: UserRole;
  createdAt?: string;
};

export type AuthResponse = {
  accessToken: string;
  user: User;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  _count?: { posts: number };
};

export type Tag = {
  id: string;
  name: string;
  slug: string;
  _count?: { posts: number };
};

export type PostAuthor = {
  id: string;
  name: string;
  slug: string;
  avatarUrl?: string | null;
};

export type Post = {
  id: string;
  title: string;
  slug: string;
  content?: string;
  excerpt?: string | null;
  status?: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';
  featured?: boolean;
  publishedAt?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  author?: PostAuthor;
  category?: Category | null;
  tags?: Tag[];
  featuredImage?: { url: string; altText?: string | null } | null;
  createdAt?: string;
  updatedAt?: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type AdminStats = {
  posts: number;
  publishedPosts: number;
  draftPosts: number;
  users: number;
  categories: number;
  tags: number;
  subscribers: number;
};

export type Setting = {
  key: string;
  value: unknown;
};

export type MediaItem = {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  altText?: string | null;
  createdAt: string;
};

export type AnalyticsOverview = {
  pageViews: number;
  uniqueVisitors: number;
  topPosts: { title: string; slug: string; views: number }[];
  dailyViews: { date: string; views: number }[];
};
