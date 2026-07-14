'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api';
import type { Tag } from '@/lib/types';

export default function AdminTagsPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['admin-tags'],
    queryFn: () => apiFetch<Tag[]>('/admin/tags'),
  });

  const saveMutation = useMutation({
    mutationFn: (body: { name: string; slug: string }) =>
      editingId
        ? apiFetch(`/admin/tags/${editingId}`, {
            method: 'PATCH',
            body: JSON.stringify(body),
          })
        : apiFetch('/admin/tags', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tags'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/admin/tags/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-tags'] }),
  });

  const resetForm = () => {
    setName('');
    setSlug('');
    setEditingId(null);
  };

  const startEdit = (tag: Tag) => {
    setEditingId(tag.id);
    setName(tag.name);
    setSlug(tag.slug);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({ name, slug });
  };

  return (
    <>
      <AdminHeader title="Tags" />
      <div className="grid gap-8 p-6 lg:grid-cols-2">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-stone-200 p-6 dark:border-stone-800"
        >
          <h2 className="font-semibold">{editingId ? 'Edit tag' : 'New tag'}</h2>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saveMutation.isPending}>
              {editingId ? 'Update' : 'Create'}
            </Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            )}
          </div>
        </form>

        <div>
          <h2 className="mb-4 font-semibold">All tags</h2>
          {isLoading && <p className="text-stone-500">Loading…</p>}
          <ul className="space-y-2">
            {tags.map((tag) => (
              <li
                key={tag.id}
                className="flex items-center justify-between rounded-lg border border-stone-200 px-4 py-3 dark:border-stone-800"
              >
                <div>
                  <p className="font-medium">{tag.name}</p>
                  <p className="text-xs text-stone-500">/{tag.slug}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(tag)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(tag.id)}
                    disabled={deleteMutation.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          {!isLoading && tags.length === 0 && (
            <p className="text-stone-500">No tags yet.</p>
          )}
        </div>
      </div>
    </>
  );
}
