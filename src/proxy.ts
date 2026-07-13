import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip static files, API routes, or media assets
  if (
    pathname.startsWith('/api') || 
    pathname.startsWith('/_next') || 
    pathname.includes('.') || 
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // 2. Read session cookie
  const sessionToken = request.cookies.get('session')?.value;

  let userRole: string | null = null;
  let hasValidSession = false;

  if (sessionToken) {
    try {
      // Hash token to look it up in DB
      const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
      const session = await db.session.findUnique({
        where: { tokenHash },
        include: { user: true },
      });

      if (session && new Date() < session.expiresAt) {
        hasValidSession = true;
        userRole = session.user.role;
      } else if (session) {
        // Delete expired session
        await db.session.delete({ where: { id: session.id } });
      }
    } catch (err) {
      console.error('Proxy session check error:', err);
    }
  }

  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const isDashboardPage = pathname.startsWith('/dashboard');

  // 3. Unauthenticated redirects
  if (!hasValidSession) {
    if (isDashboardPage) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('session');
      return response;
    }
    return NextResponse.next();
  }

  // 4. Authenticated redirects (Prevent accessing login/signup, redirect to respective dashboards)
  if (isAuthPage) {
    let dashboardPath = '/dashboard/patient';
    if (userRole === 'ADMIN') dashboardPath = '/dashboard/admin';
    else if (userRole === 'DOCTOR') dashboardPath = '/dashboard/doctor';
    else if (userRole === 'RECEPTIONIST') dashboardPath = '/dashboard/receptionist';

    return NextResponse.redirect(new URL(dashboardPath, request.url));
  }

  // 5. Enforce RBAC on dashboard subroutes
  if (isDashboardPage) {
    // If accessing bare /dashboard, redirect to appropriate role subroute
    if (pathname === '/dashboard') {
      let dashboardPath = '/dashboard/patient';
      if (userRole === 'ADMIN') dashboardPath = '/dashboard/admin';
      else if (userRole === 'DOCTOR') dashboardPath = '/dashboard/doctor';
      else if (userRole === 'RECEPTIONIST') dashboardPath = '/dashboard/receptionist';
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }

    // Role subroute restriction checks
    if (pathname.startsWith('/dashboard/admin') && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    if (pathname.startsWith('/dashboard/doctor') && userRole !== 'DOCTOR') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    if (pathname.startsWith('/dashboard/receptionist') && userRole !== 'RECEPTIONIST') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    if (pathname.startsWith('/dashboard/patient') && userRole !== 'PATIENT') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

// Matching paths
export const config = {
  matcher: ['/dashboard/:path*', '/login', '/signup'],
};
