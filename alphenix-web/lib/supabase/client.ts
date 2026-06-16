// ================================================================
//  ALPHENIX — Supabase Client (Browser-Side)
//  lib/supabase/client.ts
//
//  Use em Client Components ('use client').
//  Singleton: cria apenas uma instância por sessão de navegador.
// ================================================================

import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Retorna o cliente Supabase para uso em Client Components.
 * Padrão singleton — seguro para chamar várias vezes.
 *
 * @example
 * // components/VariantSelector.tsx
 * 'use client';
 * const supabase = getSupabaseBrowserClient();
 */
export function getSupabaseBrowserClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
}
