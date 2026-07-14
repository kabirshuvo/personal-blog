'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

type Providers = { google: boolean; github: boolean };

export function OAuthButtons() {
  const [providers, setProviders] = useState<Providers>({ google: true, github: true });

  useEffect(() => {
    void fetch(`${API_URL}/auth/providers`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Providers | null) => {
        if (data) setProviders(data);
      })
      .catch(() => {
        /* keep defaults; buttons may 503 until configured */
      });
  }, []);

  if (!providers.google && !providers.github) {
    return (
      <p className="text-center text-xs text-stone-500">
        Social login is available after you set Google/GitHub OAuth credentials in{' '}
        <code className="rounded bg-stone-100 px-1 dark:bg-stone-900">.env</code>.
      </p>
    );
  }

  return (
    <>
      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-stone-500">
        <span className="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
        Or continue with
        <span className="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {providers.google && (
          <a
            href={`${API_URL}/auth/google`}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-stone-300 text-sm font-medium dark:border-stone-700"
          >
            Google
          </a>
        )}
        {providers.github && (
          <a
            href={`${API_URL}/auth/github`}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-stone-300 text-sm font-medium dark:border-stone-700"
          >
            GitHub
          </a>
        )}
      </div>
    </>
  );
}
