import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Paths that are publicly accessible
  const publicPaths = ['/login', '/api/auth/login', '/api/auth/logout'];
  if (publicPaths.some(p => pathname.startsWith(p)) || pathname.startsWith('/_next') || pathname.startsWith('/favicon.ico')) {
    // If logged in and trying to access /login, redirect to dashboard
    if (pathname === '/login') {
      const session = req.cookies.get('auth_session');
      if (session) {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }
    return NextResponse.next();
  }

  // Check auth session
  const sessionCookie = req.cookies.get('auth_session');
  if (!sessionCookie) {
    // Unauthenticated, redirect to login
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    const session = JSON.parse(sessionCookie.value);
    const role = session.role;

    // Nabta user must not access admin routes
    const adminOnlyRoutes = ['/orders', '/payments', '/reports', '/settings'];
    if (role === 'nabta' && adminOnlyRoutes.some(p => pathname.startsWith(p))) {
      // Redirect Nabta to the dashboard (which shows the Nabta Report)
      return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.next();
  } catch (err) {
    // Invalid session JSON
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = {
  matcher: ['/((?!api/auth/login|api/auth/logout|_next/static|_next/image|favicon.ico).*)'],
};
