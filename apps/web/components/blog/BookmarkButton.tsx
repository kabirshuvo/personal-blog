'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';

export function BookmarkButton({ postId }: { postId: string }) {
  const { user, isAuthenticated } = useAuth();
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setBookmarked(false);
      return;
    }
    void api
      .get<Array<{ post: { id: string } }>>('/bookmarks')
      .then((items) => setBookmarked(items.some((item) => item.post.id === postId)))
      .catch(() => setBookmarked(false));
  }, [user, postId]);

  if (!isAuthenticated) {
    return (
      <a
        href="/login"
        className="inline-flex h-9 items-center rounded-lg border border-stone-300 px-3 text-sm dark:border-stone-700"
      >
        Sign in to bookmark
      </a>
    );
  }

  async function toggle() {
    setLoading(true);
    try {
      if (bookmarked) {
        await api.delete(`/bookmarks/${postId}`);
        setBookmarked(false);
      } else {
        await api.post('/bookmarks', { postId });
        setBookmarked(true);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={toggle}
      disabled={loading}
    >
      {bookmarked ? 'Bookmarked' : 'Bookmark'}
    </Button>
  );
}
