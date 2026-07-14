'use client';

import { useQuery } from '@tanstack/react-query';
import { FileText, FolderOpen, Tags, Users } from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';
import type { AdminStats } from '@/lib/types';

const statCards = [
  { key: 'posts' as const, label: 'Total posts', icon: FileText },
  { key: 'publishedPosts' as const, label: 'Published', icon: FileText },
  { key: 'draftPosts' as const, label: 'Drafts', icon: FileText },
  { key: 'users' as const, label: 'Users', icon: Users },
  { key: 'categories' as const, label: 'Categories', icon: FolderOpen },
  { key: 'tags' as const, label: 'Tags', icon: Tags },
];

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => apiFetch<AdminStats>('/admin/analytics/stats'),
  });

  return (
    <>
      <AdminHeader title="Dashboard" />
      <div className="p-6">
        <p className="text-stone-600 dark:text-stone-400">
          Overview of your blog content and audience.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statCards.map(({ key, label, icon: Icon }) => (
            <Card key={key}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">
                    {isLoading ? '—' : (stats?.[key] ?? 0)}
                  </CardTitle>
                  <Icon className="h-5 w-5 text-stone-400" />
                </div>
                <CardDescription>{label}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {!isLoading && !stats && (
          <p className="mt-8 text-sm text-stone-500">
            Stats will appear once the API analytics endpoints are available.
          </p>
        )}
      </div>
    </>
  );
}
