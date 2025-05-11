import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Делаем все пути публичными
  return NextResponse.next();
}

// Сохраним matcher для будущего расширения функциональности
export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|favicon.ico|logo.png).*)',
  ],
}; 