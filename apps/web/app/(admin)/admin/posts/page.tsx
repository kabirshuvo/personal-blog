'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import type { PaginatedResponse, Post } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default function AdminPostsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-posts'],
    queryFn: () => apiFetch<PaginatedResponse<Post>>('/admin/posts'),
  });

  return (
    <>
      <AdminHeader title="Posts" />
      <div className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-stone-600 dark:text-stone-400">Manage blog posts.</p>
          <Link href="/admin/posts/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              New post
            </Button>
          </Link>
        </div>

        {isLoading && <p className="mt-6 text-stone-500">Loading posts…</p>}
        {error && <p className="mt-6 text-sm text-red-600">Failed to load posts.</p>}

        {data && data.data.length > 0 ? (
          <div className="mt-6 overflow-x-auto rounded-lg border border-stone-200 dark:border-stone-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-900/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {data.data.map((post) => (
                  <tr
                    key={post.id}
                    className="border-b border-stone-100 dark:border-stone-800"
                  >
                    <td className="px-4 py-3">{post.title}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs dark:bg-stone-800">
                        {post.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-500">
                      {post.updatedAt ? formatDate(post.updatedAt) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/posts/${post.id}/edit`}
                        className="text-sm font-medium hover:underline"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !isLoading && (
            <p className="mt-6 text-stone-500">No posts yet. Create your first post.</p>
          )
        )}
      </div>
    </>
  );
}
