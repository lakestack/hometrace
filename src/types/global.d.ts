import type { NextRequest } from 'next/server';
import type { JWT } from 'next-auth/jwt';

declare module 'next/server' {
  interface NextRequest {
    nextauth?: {
      token: JWT | null;
    };
  }
}
