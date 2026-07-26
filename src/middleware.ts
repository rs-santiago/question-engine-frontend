import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl;

  // Ignora arquivos estáticos e chamadas internas
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api') ||
    url.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Header White-Label
  const currentHost =
    process.env.NODE_ENV === 'production'
      ? hostname.replace(`.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`, '')
      : hostname.replace('.localhost:3001', '');

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-host', currentHost);

  // Leitura de sessão
  const token = request.cookies.get('token')?.value;
  const userRole = request.cookies.get('userRole')?.value;

  const isLoginPage = url.pathname === '/login';
  const isAdminRoute = url.pathname.startsWith('/admin');
  const isStudentRoute = url.pathname.startsWith('/questoes') || url.pathname.startsWith('/simulados');

  // Trava de Rotas Não Autenticadas
  if (!token && (isAdminRoute || isStudentRoute)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Se logado tentar ir pro /login -> redireciona pro destino correto
  if (token && isLoginPage) {
    if (['SUPER_ADMIN', 'OWNER', 'TEACHER'].includes(userRole || '')) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.redirect(new URL('/questoes', request.url));
  }

  // Trava de Alunos tentando acessar o /admin
  if (token && isAdminRoute && userRole === 'STUDENT') {
    return NextResponse.redirect(new URL('/questoes', request.url));
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};