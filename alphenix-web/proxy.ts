// ================================================================
//  ALPHENIX — proxy.ts (Next.js 16+)
//
//  Next.js 16 renomeou "middleware" para "proxy".
//  A função exportada também deve se chamar "proxy".
//
//  Renova o token de sessão do Supabase antes de cada request.
// ================================================================

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Sanitize: remove \r (Windows), espaços e barra final do .env.local
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim().replace(/\/$/, '');
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

  // Se as variáveis não estiverem configuradas, deixa a request passar
  if (!url || !key) return supabaseResponse;

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Renova a sessão — obrigatório, não remova
  await supabase.auth.getUser();

  return supabaseResponse;
}

// Aplica apenas nas rotas que precisam (exclui assets estáticos)
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
