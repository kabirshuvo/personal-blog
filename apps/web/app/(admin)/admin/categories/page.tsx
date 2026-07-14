'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api';
import type { Category } from '@/lib/types';

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => apiFetch<Category[]>('/admin/categories'),
  });

  const saveMutation = useMutation({
    mutationFn: (body: { name: string; slug: string; description?: string }) =>
      editingId
        ? apiFetch(`/admin/categories/${editingId}`, {
            method: 'PATCH',
            body: JSON.stringify(body),
          })
        : apiFetch('/admin/categories', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/admin/categories/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-categories'] }),
  });

  const resetForm = () => {
    setName('');
    setSlug('');
    setDescription('');
    setEditingId(null);
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description ?? '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({ name, slug, description: description || undefined });
  };

  return (
    <>
      <AdminHeader title="Categories" />
      <div className="grid gap-8 p-6 lg:grid-cols-2">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-stone-200 p-6 dark:border-stone-800"
        >
          <h2 className="font-semibold">
            {editingId ? 'Edit category' : 'New category'}
          </h2>
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
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
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
          <h2 className="mb-4 font-semibold">All categories</h2>
          {isLoading && <p className="text-stone-500">Loading…</p>}
          <ul className="space-y-2">
            {categories.map((cat) => (
              <li
                key={cat.id}
                className="flex items-center justify-between rounded-lg border border-stone-200 px-4 py-3 dark:border-stone-800"
              >
                <div>
                  <p className="font-medium">{cat.name}</p>
                  <p className="text-xs text-stone-500">/{cat.slug}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(cat)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(cat.id)}
                    disabled={deleteMutation.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          {!isLoading && categories.length === 0 && (
            <p className="text-stone-500">No categories yet.</p>
          )}
        </div>
      </div>
    </>
  );
}
