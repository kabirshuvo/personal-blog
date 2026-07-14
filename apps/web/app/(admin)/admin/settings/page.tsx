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

type SiteSettings = {
  siteName: string;
  siteDescription: string;
  postsPerPage: number;
  allowComments: boolean;
};

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: 'Monalo Journal',
  siteDescription: 'A personal blog for thoughtful writing.',
  postsPerPage: 10,
  allowComments: true,
};

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => apiFetch<Setting[]>('/admin/settings'),
  });

  useEffect(() => {
    if (data) {
      const map = Object.fromEntries(data.map((s) => [s.key, s.value]));
      setSettings({
        siteName: (map.siteName as string) ?? DEFAULT_SETTINGS.siteName,
        siteDescription:
          (map.siteDescription as string) ?? DEFAULT_SETTINGS.siteDescription,
        postsPerPage: (map.postsPerPage as number) ?? DEFAULT_SETTINGS.postsPerPage,
        allowComments: (map.allowComments as boolean) ?? DEFAULT_SETTINGS.allowComments,
      });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      apiFetch('/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify(settings),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-settings'] }),
  });

  return (
    <>
      <AdminHeader title="Settings" />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveMutation.mutate();
        }}
        className="max-w-xl space-y-6 p-6"
      >
        {isLoading && <p className="text-stone-500">Loading settings…</p>}

        <div className="space-y-2">
          <Label htmlFor="siteName">Site name</Label>
          <Input
            id="siteName"
            value={settings.siteName}
            onChange={(e) => setSettings((s) => ({ ...s, siteName: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="siteDescription">Site description</Label>
          <Textarea
            id="siteDescription"
            value={settings.siteDescription}
            onChange={(e) =>
              setSettings((s) => ({ ...s, siteDescription: e.target.value }))
            }
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="postsPerPage">Posts per page</Label>
          <Input
            id="postsPerPage"
            type="number"
            min={1}
            max={50}
            value={settings.postsPerPage}
            onChange={(e) =>
              setSettings((s) => ({ ...s, postsPerPage: Number(e.target.value) }))
            }
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="allowComments"
            type="checkbox"
            checked={settings.allowComments}
            onChange={(e) =>
              setSettings((s) => ({ ...s, allowComments: e.target.checked }))
            }
            className="h-4 w-4"
          />
          <Label htmlFor="allowComments">Allow comments</Label>
        </div>

        {saveMutation.isSuccess && (
          <p className="text-sm text-green-600">Settings saved.</p>
        )}
        {saveMutation.isError && (
          <p className="text-sm text-red-600">Failed to save settings.</p>
        )}

        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? 'Saving…' : 'Save settings'}
        </Button>
      </form>
    </>
  );
}
