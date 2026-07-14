'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch, getAccessToken } from '@/lib/api';
import type { MediaItem } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export default function AdminMediaPage() {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const { data: media = [], isLoading } = useQuery({
    queryKey: ['admin-media'],
    queryFn: () => apiFetch<MediaItem[]>('/admin/media'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/admin/media/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-media'] }),
  });

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    if (altText) formData.append('altText', altText);

    try {
      const token = getAccessToken();
      const res = await fetch(`${API_URL}/admin/media/upload`, {
        method: 'POST',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      queryClient.invalidateQueries({ queryKey: ['admin-media'] });
      setFile(null);
      setAltText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <AdminHeader title="Media" />
      <div className="p-6">
        <form
          onSubmit={handleUpload}
          className="mb-8 max-w-lg space-y-4 rounded-xl border border-stone-200 p-6 dark:border-stone-800"
        >
          <h2 className="font-semibold">Upload file</h2>
          <div className="space-y-2">
            <Label htmlFor="file">File</Label>
            <Input
              id="file"
              type="file"
              accept="image/*,video/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="altText">Alt text</Label>
            <Input
              id="altText"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Describe the image…"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={!file || uploading}>
            {uploading ? 'Uploading…' : 'Upload'}
          </Button>
        </form>

        <h2 className="mb-4 font-semibold">Media library</h2>
        {isLoading && <p className="text-stone-500">Loading media…</p>}

        {media.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {media.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-lg border border-stone-200 dark:border-stone-800"
              >
                {item.mimeType.startsWith('image/') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.url}
                    alt={item.altText ?? item.originalName}
                    className="aspect-video w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-video items-center justify-center bg-stone-100 dark:bg-stone-800">
                    <span className="text-sm text-stone-500">{item.mimeType}</span>
                  </div>
                )}
                <div className="p-3">
                  <p className="truncate text-sm font-medium">{item.originalName}</p>
                  <p className="text-xs text-stone-500">
                    {(item.size / 1024).toFixed(1)} KB
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => deleteMutation.mutate(item.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !isLoading && <p className="text-stone-500">No media uploaded yet.</p>
        )}
      </div>
    </>
  );
}
