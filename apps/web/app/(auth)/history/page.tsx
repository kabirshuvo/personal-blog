'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/components/providers/auth-provider';

type HistoryItem = {
  id: string;
  progress: number;
  lastReadAt: string;
  post: { title: string; slug: string };
};

export default function HistoryPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    void api
      .get<HistoryItem[]>('/reading-history')
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
          to view reading history.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold">Reading history</h1>
      {error && <p className="mt-4 text-red-600">{error}</p>}
      <ul className="mt-8 space-y-4">
        {items.length === 0 && (
          <li className="text-stone-500">No reading history yet.</li>
        )}
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-4">
            <Link href={`/blog/${item.post.slug}`} className="font-medium underline">
              {item.post.title}
            </Link>
            <span className="text-sm text-stone-500">
              {Math.round(item.progress * 100)}% ·{' '}
              {new Date(item.lastReadAt).toLocaleDateString()}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
