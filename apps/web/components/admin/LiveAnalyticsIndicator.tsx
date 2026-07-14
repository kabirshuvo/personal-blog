'use client';

import { useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { getAccessToken } from '@/lib/api';

type LivePayload = {
  liveViewers: number;
  pageViewsToday: number;
};

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ??
  (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1').replace(
    /\/api\/v1$/,
    '',
  );

export function LiveAnalyticsIndicator() {
  const [live, setLive] = useState<LivePayload | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    const socket: Socket = io(`${WS_URL}/ws/analytics`, {
      transports: ['websocket'],
      auth: { token },
      query: { token },
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('live', (payload: LivePayload) => setLive(payload));

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-stone-200 px-4 py-3 text-sm dark:border-stone-800">
      <span
        className={`inline-block h-2.5 w-2.5 rounded-full ${
          connected ? 'bg-emerald-500' : 'bg-stone-400'
        }`}
      />
      <span className="font-medium">{connected ? 'Live' : 'Connecting…'}</span>
      <span className="text-stone-500">
        {live
          ? `${live.liveViewers} viewers · ${live.pageViewsToday} views today`
          : 'Waiting for events'}
      </span>
    </div>
  );
}
