import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** Client marker set alongside access token; API also sets httpOnly refresh_token */
const AUTH_PRESENT_COOKIE = 'auth_present';
const REFRESH_COOKIE = 'refresh_token';

function hasSession(request: NextRequest) {
  return (
    request.cookies.has(AUTH_PRESENT_COOKIE) || request.cookies.has(REFRESH_COOKIE)
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authenticated = hasSession(request);

  if (pathname.startsWith('/admin')) {
    if (!authenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname === '/login' || pathname === '/register') {
    if (authenticated) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/login', '/register'],
};
