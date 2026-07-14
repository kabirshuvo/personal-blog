'use client';

import Cookies from 'js-cookie';
import type { AuthResponse } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

const ACCESS_TOKEN_KEY = 'access_token';
const AUTH_PRESENT_COOKIE = 'auth_present';

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  if (accessToken) return accessToken;
  const stored = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (stored) accessToken = stored;
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    Cookies.set(AUTH_PRESENT_COOKIE, '1', { sameSite: 'lax', expires: 7 });
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    Cookies.remove(AUTH_PRESENT_COOKIE);
  }
}

export function getAccessToken() {
  return getStoredToken();
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        setAccessToken(null);
        return null;
      }
      const data = (await res.json()) as AuthResponse;
      setAccessToken(data.accessToken);
      return data.accessToken;
    } catch {
      setAccessToken(null);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type FetchOptions = RequestInit & {
  skipAuth?: boolean;
  skipRefresh?: boolean;
};

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { skipAuth, skipRefresh, headers, ...rest } = options;
  const url = path.startsWith('http') ? path : `${API_URL}${path}`;

  const buildHeaders = (token?: string | null): HeadersInit => ({
    ...(rest.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...headers,
    ...(!skipAuth && token ? { Authorization: `Bearer ${token}` } : {}),
  });

  const token = skipAuth ? null : getStoredToken();
  let res = await fetch(url, {
    ...rest,
    credentials: 'include',
    headers: buildHeaders(token),
  });

  if (res.status === 401 && !skipAuth && !skipRefresh) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await fetch(url, {
        ...rest,
        credentials: 'include',
        headers: buildHeaders(newToken),
      });
    }
  }

  if (!res.ok) {
    let data: unknown;
    try {
      data = await res.json();
    } catch {
      data = undefined;
    }
    const message =
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof (data as { message: unknown }).message === 'string'
        ? (data as { message: string }).message
        : res.statusText || 'Request failed';
    throw new ApiError(message, res.status, data);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, options?: FetchOptions) =>
    apiFetch<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: FetchOptions) =>
    apiFetch<T>(path, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    }),
  patch: <T>(path: string, body?: unknown, options?: FetchOptions) =>
    apiFetch<T>(path, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body ?? {}),
    }),
  delete: <T>(path: string, options?: FetchOptions) =>
    apiFetch<T>(path, { ...options, method: 'DELETE' }),
};
