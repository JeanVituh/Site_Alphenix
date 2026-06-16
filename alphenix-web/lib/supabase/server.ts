// ================================================================
//  ALPHENIX — lib/supabase/server.ts
//
//  Dois clientes Supabase para contextos diferentes:
//
//  createSupabaseServerClient()  → usa cookies do Next.js
//                                  para Server Components em runtime
//
//  createSupabaseStaticClient()  → SEM cookies, para build-time
//                                  (generateStaticParams, ISR)
// ================================================================

import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Cliente com cookies — use em Server Components e Route Handlers
 * que rodam durante uma request HTTP real.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components não podem escrever cookies — ok ignorar.
          }
        },
      },
    }
  );
}

/**
 * Cliente SEM cookies — use em generateStaticParams e qualquer
 * função que roda no build (sem HTTP request disponível).
 *
 * @example
 * // app/produtos/[slug]/page.tsx
 * export async function generateStaticParams() {
 *   const supabase = createSupabaseStaticClient();
 *   const { data } = await supabase.from('products').select('slug');
 *   return (data ?? []).map(p => ({ slug: p.slug }));
 * }
 */
export function createSupabaseStaticClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
