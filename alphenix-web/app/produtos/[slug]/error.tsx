'use client';
// ================================================================
//  ALPHENIX — Error Boundary da Página de Produto
//  app/produtos/[slug]/error.tsx
//
//  Captura erros do Server Component (ex: falha de conexão com
//  Supabase, .env.local errado, slug não encontrado no banco).
//  Sem este arquivo, um erro no page.tsx resulta em tela branca.
// ================================================================

import { useEffect } from 'react';

export default function ProductError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log detalhado no console do navegador
    console.error('[Alphenix] Erro na página de produto:', error);
  }, [error]);

  const isSupabaseError =
    error.message.includes('supabase') ||
    error.message.includes('PGRST') ||
    error.message.includes('fetch') ||
    error.message.includes('getProductBySlug');

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.5rem',
        background: '#080808',
        color: '#fff',
        fontFamily: 'Inter, Helvetica Neue, Arial, sans-serif',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <span style={{ fontSize: '3rem' }}>⚠️</span>

      <h2
        style={{
          fontFamily: 'Bebas Neue, Impact, sans-serif',
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          letterSpacing: '0.04em',
          color: '#FF6B00',
          lineHeight: 1,
        }}
      >
        Erro ao carregar produto
      </h2>

      {isSupabaseError ? (
        <div
          style={{
            background: '#111',
            border: '1px solid #232323',
            borderLeft: '3px solid #FF6B00',
            borderRadius: '12px',
            padding: '1.25rem 1.5rem',
            maxWidth: '520px',
            textAlign: 'left',
          }}
        >
          <p style={{ color: '#BBB', marginBottom: '1rem', lineHeight: 1.7 }}>
            Parece um problema de conexão com o Supabase. Verifique:
          </p>
          <ol style={{ color: '#777', lineHeight: 2, paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
            <li>
              O arquivo <code style={{ color: '#FF8C38' }}>.env.local</code> existe na raiz do projeto?
            </li>
            <li>
              <code style={{ color: '#FF8C38' }}>NEXT_PUBLIC_SUPABASE_URL</code> e{' '}
              <code style={{ color: '#FF8C38' }}>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> estão corretos?
            </li>
            <li>
              O <code style={{ color: '#FF8C38' }}>schema.sql</code> foi executado no SQL Editor do Supabase?
            </li>
            <li>
              O <code style={{ color: '#FF8C38' }}>seed_dux_whey.sql</code> foi executado?
            </li>
            <li>
              O produto tem <code style={{ color: '#FF8C38' }}>active = true</code> no banco?
            </li>
          </ol>
        </div>
      ) : (
        <p style={{ color: '#BBB', maxWidth: '400px', lineHeight: 1.7 }}>
          {error.message || 'Ocorreu um erro inesperado.'}
        </p>
      )}

      {/* Mensagem de erro raw — útil para debug */}
      {error.message && (
        <pre
          style={{
            background: '#111',
            border: '1px solid #232323',
            borderRadius: '8px',
            padding: '1rem',
            fontSize: '0.72rem',
            color: '#555',
            maxWidth: '600px',
            width: '100%',
            overflowX: 'auto',
            textAlign: 'left',
          }}
        >
          {error.message}
          {error.digest && `\nDigest: ${error.digest}`}
        </pre>
      )}

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={reset}
          style={{
            padding: '12px 24px',
            background: '#FF6B00',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.9rem',
            letterSpacing: '0.04em',
          }}
        >
          🔄 Tentar novamente
        </button>
        <a
          href="/"
          style={{
            padding: '12px 24px',
            background: 'transparent',
            color: '#BBB',
            border: '1px solid #232323',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.9rem',
          }}
        >
          ← Voltar ao início
        </a>
      </div>
    </main>
  );
}
