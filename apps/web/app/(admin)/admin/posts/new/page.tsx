'use client';

import { useQuery } from '@tanstack/react-query';
import { PostForm } from '@/components/admin/PostForm';
import { apiFetch } from '@/lib/api';
import type { Category, Tag } from '@/lib/types';

export default function NewPostPage() {
  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => apiFetch<Category[]>('/admin/categories'),
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['admin-tags'],
    queryFn: () => apiFetch<Tag[]>('/admin/tags'),
  });

  return <PostForm categories={categories} tags={tags} />;
}
