'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

async function subscribeNewsletter(email: string) {
  const res = await fetch(`${API_URL}/newsletter/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return res.ok;
}

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(
    'idle',
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      const ok = await subscribeNewsletter(email);
      setStatus(ok ? 'success' : 'error');
      if (ok) setEmail('');
    } catch {
      setStatus('error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <Input
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="sm:flex-1"
      />
      <Button type="submit" disabled={status === 'loading'}>
        {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
      </Button>
      {status === 'success' && (
        <p className="text-sm text-green-600 sm:basis-full">Thanks for subscribing!</p>
      )}
      {status === 'error' && (
        <p className="text-sm text-stone-500 sm:basis-full">
          Subscription unavailable — we&apos;ll save your interest for later.
        </p>
      )}
    </form>
  );
}
