// question-engine-frontend/src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl;

  // Ignora arquivos estáticos e chamadas de API do Next.js
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api') ||
    url.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Extrai o subdomínio ou domínio customizado CNAME
  // Exemplo: cursoalfa.localhost:3001 -> subdomínio 'cursoalfa'
  const currentHost =
    process.env.NODE_ENV === 'production'
      ? hostname.replace(`.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`, '')
      : hostname.replace('.localhost:3001', '');

  // Clona os headers da requisição e injeta o host para consumo nas páginas Server Components
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-host', currentHost);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};