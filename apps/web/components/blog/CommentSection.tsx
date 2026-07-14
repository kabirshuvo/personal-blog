'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/components/providers/auth-provider';

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  author?: { name: string };
  replies?: Comment[];
};

export function CommentSection({ postId }: { postId: string }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.get<Comment[]>(`/comments?postId=${postId}`, {
        skipAuth: true,
      });
      setComments(data);
    } catch {
      setComments([]);
    }
  }, [postId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!user) {
      setError('Sign in to leave a comment.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.post('/comments', { postId, content });
      setContent('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-12 border-t border-stone-200 pt-8 dark:border-stone-800">
      <h2 className="text-2xl font-semibold">Comments</h2>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={4}
          placeholder={user ? 'Share your thoughts…' : 'Sign in to comment'}
          disabled={!user || loading}
          className="w-full rounded-lg border border-stone-300 bg-transparent px-3 py-2 dark:border-stone-700"
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={!user || loading || !content.trim()}
          className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-stone-100 dark:text-stone-900"
        >
          {loading ? 'Posting…' : 'Post comment'}
        </button>
      </form>
      <ul className="mt-8 space-y-6">
        {comments.length === 0 && <li className="text-stone-500">No comments yet.</li>}
        {comments.map((comment) => (
          <li
            key={comment.id}
            className="rounded-lg border border-stone-200 p-4 dark:border-stone-800"
          >
            <p className="text-sm font-medium">{comment.author?.name ?? 'Reader'}</p>
            <p className="mt-2 text-stone-700 dark:text-stone-300">{comment.content}</p>
            <p className="mt-2 text-xs text-stone-500">
              {new Date(comment.createdAt).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
