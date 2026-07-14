'use client';

import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { ThemeToggle } from '@/components/blog/ThemeToggle';
import { Button } from '@/components/ui/button';

export function SiteHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-stone-200 dark:border-stone-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Monalo Journal
          </Link>
          <nav className="hidden items-center gap-4 text-sm text-stone-600 sm:flex dark:text-stone-400">
            <Link
              href="/blog"
              className="hover:text-stone-900 dark:hover:text-stone-100"
            >
              Blog
            </Link>
            <Link
              href="/search"
              className="hover:text-stone-900 dark:hover:text-stone-100"
            >
              Search
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <>
              <Link href="/profile">
                <Button variant="ghost" size="sm">
                  Profile
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => logout()}>
                Sign out
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button size="sm">Sign in</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
