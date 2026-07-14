'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';

export function AdminHeader({ title }: { title: string }) {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between border-b border-stone-200 px-6 py-4 dark:border-stone-800">
      <h1 className="text-xl font-semibold">{title}</h1>
      <div className="flex items-center gap-3">
        {user && (
          <span className="text-sm text-stone-600 dark:text-stone-400">
            {user.name}
          </span>
        )}
        <Button variant="outline" size="sm" onClick={() => logout()}>
          Sign out
        </Button>
      </div>
    </header>
  );
}
