'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { LiveAnalyticsIndicator } from '@/components/admin/LiveAnalyticsIndicator';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';
import type { AnalyticsOverview } from '@/lib/types';

export default function AdminAnalyticsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => apiFetch<AnalyticsOverview>('/admin/analytics/overview'),
  });

  const dailyViews = data?.dailyViews ?? [
    { date: 'Mon', views: 120 },
    { date: 'Tue', views: 180 },
    { date: 'Wed', views: 150 },
    { date: 'Thu', views: 220 },
    { date: 'Fri', views: 190 },
    { date: 'Sat', views: 95 },
    { date: 'Sun', views: 80 },
  ];

  const topPosts = data?.topPosts ?? [];

  return (
    <>
      <AdminHeader title="Analytics" />
      <div className="space-y-6 p-6">
        <LiveAnalyticsIndicator />
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {isLoading ? '—' : (data?.pageViews ?? 0).toLocaleString()}
              </CardTitle>
              <CardDescription>Page views (30 days)</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {isLoading ? '—' : (data?.uniqueVisitors ?? 0).toLocaleString()}
              </CardTitle>
              <CardDescription>Unique visitors (30 days)</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daily page views</CardTitle>
          </CardHeader>
          <div className="h-64 px-4 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyViews}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-stone-200 dark:stroke-stone-700"
                />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#78716c"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {topPosts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top posts</CardTitle>
            </CardHeader>
            <div className="h-64 px-4 pb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topPosts} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-stone-200 dark:stroke-stone-700"
                  />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis
                    dataKey="title"
                    type="category"
                    width={120}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip />
                  <Bar dataKey="views" fill="#78716c" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {error && (
          <p className="text-sm text-stone-500">
            Live analytics unavailable — showing placeholder chart data.
          </p>
        )}
      </div>
    </>
  );
}
