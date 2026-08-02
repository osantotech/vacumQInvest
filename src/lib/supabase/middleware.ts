import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Páginas de login/callback: prefixo, porque têm sub-rotas próprias.
  const publicPagePrefixes = ['/login', '/auth/callback'];

  // Rotas de API que o middleware deixa passar porque elas mesmas fazem a
  // autenticação: /api/webhook valida o WEBHOOK_SECRET e /api/scanner aceita
  // o Bearer CRON_SECRET do cron da Vercel (que não tem sessão de usuário) ou
  // exige sessão. Sem isto o cron era redirecionado para /login e nunca rodava.
  //
  // Comparação EXATA de propósito: com prefixo, `/api/scanner` liberaria
  // também `/api/scanner/history`, que depende do middleware para se proteger.
  const selfAuthenticatedApis = ['/api/webhook', '/api/scanner'];

  const isPublicPath =
    publicPagePrefixes.some(path => pathname.startsWith(path)) ||
    selfAuthenticatedApis.includes(pathname);

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return response;
}
