'use client';

import { useQuery } from '@tanstack/react-query';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { apiFetch } from '@/lib/api';
import type { User } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default function AdminUsersPage() {
  const {
    data: users = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => apiFetch<User[]>('/admin/users'),
  });

  return (
    <>
      <AdminHeader title="Users" />
      <div className="p-6">
        <p className="text-stone-600 dark:text-stone-400">Manage registered users.</p>

        {isLoading && <p className="mt-6 text-stone-500">Loading users…</p>}
        {error && <p className="mt-6 text-sm text-red-600">Failed to load users.</p>}

        {users.length > 0 ? (
          <div className="mt-6 overflow-x-auto rounded-lg border border-stone-200 dark:border-stone-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-900/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-stone-100 dark:border-stone-800"
                  >
                    <td className="px-4 py-3">{user.name}</td>
                    <td className="px-4 py-3 text-stone-600 dark:text-stone-400">
                      {user.email}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs dark:bg-stone-800">
                        {user.role?.name ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-500">
                      {user.createdAt ? formatDate(user.createdAt) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !isLoading && !error && <p className="mt-6 text-stone-500">No users found.</p>
        )}
      </div>
    </>
  );
}
