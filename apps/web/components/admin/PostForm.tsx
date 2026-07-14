'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { apiFetch } from '@/lib/api';
import type { Category, Post, Tag } from '@/lib/types';

type PostFormProps = {
  post?: Post;
  categories: Category[];
  tags: Tag[];
};

export function PostForm({ post, categories, tags }: PostFormProps) {
  const router = useRouter();
  const isEdit = !!post;

  const [title, setTitle] = useState(post?.title ?? '');
  const [slug, setSlug] = useState(post?.slug ?? '');
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? '');
  const [content, setContent] = useState(post?.content ?? '');
  const [status, setStatus] = useState(post?.status ?? 'DRAFT');
  const [featured, setFeatured] = useState(post?.featured ?? false);
  const [categoryId, setCategoryId] = useState(post?.category?.id ?? '');
  const [selectedTags, setSelectedTags] = useState<string[]>(
    post?.tags?.map((t) => t.id) ?? [],
  );
  const [metaTitle, setMetaTitle] = useState(post?.metaTitle ?? '');
  const [metaDescription, setMetaDescription] = useState(post?.metaDescription ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const body = {
      title,
      slug,
      excerpt: excerpt || undefined,
      content,
      status,
      featured,
      categoryId: categoryId || undefined,
      tagIds: selectedTags,
      metaTitle: metaTitle || undefined,
      metaDescription: metaDescription || undefined,
    };
    try {
      if (isEdit) {
        await apiFetch(`/admin/posts/${post.id}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
        router.push('/admin/posts');
      } else {
        const created = await apiFetch<Post>('/admin/posts', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        router.push(`/admin/posts/${created.id}/edit`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AdminHeader title={isEdit ? 'Edit post' : 'New post'} />
      <form onSubmit={handleSubmit} className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
        </div>

        <div className="space-y-2">
          <Label htmlFor="excerpt">Excerpt</Label>
          <Textarea
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="content">Content</Label>
            <button
              type="button"
              onClick={() => setShowPreview((value) => !value)}
              className="text-xs font-medium text-stone-600 underline dark:text-stone-400"
            >
              {showPreview ? 'Edit' : 'Preview'}
            </button>
          </div>
          {showPreview ? (
            <div
              className="prose prose-stone dark:prose-invert min-h-[280px] max-w-none rounded-lg border border-stone-300 px-4 py-3 dark:border-stone-700"
              dangerouslySetInnerHTML={{
                __html:
                  content || '<p class="text-stone-500">Nothing to preview yet.</p>',
              }}
            />
          ) : (
            <RichTextEditor value={content} onChange={setContent} />
          )}
          {isEdit && post?.slug && status === 'PUBLISHED' && (
            <p className="text-xs text-stone-500">
              Public URL:{' '}
              <a
                href={`/blog/${post.slug}`}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                /blog/{post.slug}
              </a>
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as NonNullable<Post['status']>)}
              className="flex h-10 w-full rounded-lg border border-stone-300 bg-transparent px-3 text-sm dark:border-stone-700"
            >
              <option value="DRAFT">Draft</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-stone-300 bg-transparent px-3 text-sm dark:border-stone-700"
            >
              <option value="">None</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2 pb-1">
            <input
              id="featured"
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="featured">Featured</Label>
          </div>
        </div>

        {tags.length > 0 && (
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`rounded-full px-3 py-1 text-xs ${
                    selectedTags.includes(tag.id)
                      ? 'bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900'
                      : 'border border-stone-300 dark:border-stone-700'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="metaTitle">Meta title</Label>
            <Input
              id="metaTitle"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="metaDescription">Meta description</Label>
            <Input
              id="metaDescription"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Update post' : 'Create post'}
          </Button>
          <Link href="/admin/posts">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </>
  );
}
