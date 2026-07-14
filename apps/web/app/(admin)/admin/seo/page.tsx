'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api';
import type { Setting } from '@/lib/types';

type SeoSettings = {
  defaultMetaTitle: string;
  defaultMetaDescription: string;
  ogImageUrl: string;
  robotsTxt: string;
};

const DEFAULT_SEO: SeoSettings = {
  defaultMetaTitle: 'Monalo Journal',
  defaultMetaDescription: 'Thoughtful writing on technology and creativity.',
  ogImageUrl: '',
  robotsTxt: 'User-agent: *\nAllow: /',
};

export default function AdminSeoPage() {
  const queryClient = useQueryClient();
  const [seo, setSeo] = useState<SeoSettings>(DEFAULT_SEO);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-seo'],
    queryFn: () => apiFetch<Setting[]>('/admin/settings/seo'),
  });

  useEffect(() => {
    if (data) {
      const map = Object.fromEntries(data.map((s) => [s.key, s.value]));
      setSeo({
        defaultMetaTitle:
          (map.defaultMetaTitle as string) ?? DEFAULT_SEO.defaultMetaTitle,
        defaultMetaDescription:
          (map.defaultMetaDescription as string) ?? DEFAULT_SEO.defaultMetaDescription,
        ogImageUrl: (map.ogImageUrl as string) ?? '',
        robotsTxt: (map.robotsTxt as string) ?? DEFAULT_SEO.robotsTxt,
      });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      apiFetch('/admin/settings/seo', {
        method: 'PATCH',
        body: JSON.stringify(seo),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-seo'] }),
  });

  return (
    <>
      <AdminHeader title="SEO" />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveMutation.mutate();
        }}
        className="max-w-xl space-y-6 p-6"
      >
        {isLoading && <p className="text-stone-500">Loading SEO settings…</p>}

        <div className="space-y-2">
          <Label htmlFor="defaultMetaTitle">Default meta title</Label>
          <Input
            id="defaultMetaTitle"
            value={seo.defaultMetaTitle}
            onChange={(e) =>
              setSeo((s) => ({ ...s, defaultMetaTitle: e.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="defaultMetaDescription">Default meta description</Label>
          <Textarea
            id="defaultMetaDescription"
            value={seo.defaultMetaDescription}
            onChange={(e) =>
              setSeo((s) => ({ ...s, defaultMetaDescription: e.target.value }))
            }
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ogImageUrl">Default OG image URL</Label>
          <Input
            id="ogImageUrl"
            value={seo.ogImageUrl}
            onChange={(e) => setSeo((s) => ({ ...s, ogImageUrl: e.target.value }))}
            placeholder="https://…"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="robotsTxt">robots.txt</Label>
          <Textarea
            id="robotsTxt"
            value={seo.robotsTxt}
            onChange={(e) => setSeo((s) => ({ ...s, robotsTxt: e.target.value }))}
            rows={5}
            className="font-mono text-sm"
          />
        </div>

        {saveMutation.isSuccess && (
          <p className="text-sm text-green-600">SEO settings saved.</p>
        )}
        {saveMutation.isError && (
          <p className="text-sm text-red-600">Failed to save.</p>
        )}

        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? 'Saving…' : 'Save SEO settings'}
        </Button>
      </form>
    </>
  );
}
