'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/components/providers/auth-provider';

type BookmarkItem = {
  id: string;
  post: { title: string; slug: string; excerpt?: string | null };
};

export default function BookmarksPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<BookmarkItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    void api
      .get<BookmarkItem[]>('/bookmarks')
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'));
  }, [user]);

  if (authLoading)
    return <main className="mx-auto max-w-3xl px-6 py-12">Loading…</main>;
  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p>
          <Link href="/login" className="underline">
            Sign in
          </Link>{' '}
          to view bookmarks.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold">Bookmarks</h1>
      {error && <p className="mt-4 text-red-600">{error}</p>}
      <ul className="mt-8 space-y-4">
        {items.length === 0 && <li className="text-stone-500">No bookmarks yet.</li>}
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={`/blog/${item.post.slug}`}
              className="text-lg font-medium underline"
            >
              {item.post.title}
            </Link>
            {item.post.excerpt && (
              <p className="mt-1 text-stone-600 dark:text-stone-400">
                {item.post.excerpt}
              </p>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
