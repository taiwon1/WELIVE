import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decode } from 'jsonwebtoken';

interface DecodedToken {
  id: string;
  role: string;
}

export function middleware(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value;

  if (token && req.nextUrl.pathname === '/') {
    try {
      const decoded = decode(token) as DecodedToken | null;

      const isLoggedIn = !!decoded?.id && !!decoded?.role;

      if (isLoggedIn) {
        const url = req.nextUrl.clone();

        if (decoded.role === 'ADMIN') {
          url.pathname = '/admin/notice';
        } else {
          url.pathname = '/resident/notice';
        }

        return NextResponse.redirect(url);
      }
    } catch {}
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/'],
};
