'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { setAccessToken, apiFetch } from '@/lib/api';
import type { User } from '@/lib/types';

function AuthCallbackInner() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('accessToken');
    if (!token) {
      setError('Missing access token from OAuth provider.');
      return;
    }

    setAccessToken(token);
    void apiFetch<User>('/auth/me')
      .then(() => {
        window.location.assign('/admin');
      })
      .catch(() => {
        setError('Could not complete social sign-in.');
      });
  }, [searchParams]);

  return (
    <section>
      <h1 className="text-2xl font-semibold">Completing sign-in…</h1>
      {error ? (
        <p className="mt-3 text-red-600">{error}</p>
      ) : (
        <p className="mt-3 text-stone-600">
          Please wait while we finish Google/GitHub login.
        </p>
      )}
    </section>
  );
}

export default function AuthCallbackPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <Suspense fallback={<p className="text-stone-600">Completing sign-in…</p>}>
        <AuthCallbackInner />
      </Suspense>
    </main>
  );
}
