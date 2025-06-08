import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    if (
      req.nextUrl.pathname.startsWith('/admin') ||
      req.nextUrl.pathname.startsWith('/api/admin')
    ) {
      if (
        !req.nextauth?.token ||
        !req.nextauth.token.role ||
        !['admin', 'agent'].includes(req.nextauth.token.role as string)
      ) {
        const url = new URL('/auth/error', req.url);
        url.searchParams.set('error', '401');
        return NextResponse.redirect(url);
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        return !!token;
      },
    },
  },
);

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
