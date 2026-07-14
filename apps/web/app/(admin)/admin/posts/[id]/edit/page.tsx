'use client';

import { useQuery } from '@tanstack/react-query';
import { use } from 'react';
import { PostForm } from '@/components/admin/PostForm';
import { apiFetch } from '@/lib/api';
import type { Category, Post, Tag } from '@/lib/types';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function EditPostPage({ params }: PageProps) {
  const { id } = use(params);

  const { data: post, isLoading } = useQuery({
    queryKey: ['admin-post', id],
    queryFn: () => apiFetch<Post>(`/admin/posts/${id}`),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => apiFetch<Category[]>('/admin/categories'),
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['admin-tags'],
    queryFn: () => apiFetch<Tag[]>('/admin/tags'),
  });

  if (isLoading) {
    return <p className="p-6 text-stone-500">Loading post…</p>;
  }

  if (!post) {
    return <p className="p-6 text-red-600">Post not found.</p>;
  }

  return <PostForm post={post} categories={categories} tags={tags} />;
}
