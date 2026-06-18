// ================================================================
//  ALPHENIX — app/layout.tsx (com Header, Footer, Loader e Carrinho)
// ================================================================

import type { Metadata } from 'next';
import { RevealAnimations } from '@/components/RevealAnimations';
import { Loader } from '@/components/Loader';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartRoot } from '@/components/cart/CartRoot';

// ─── IMPORTAÇÃO CORRETA DOS ARQUIVOS CSS ───
import '@/public/assets/css/variables.css';
import '@/public/assets/css/base.css';
import '@/public/assets/css/animations.css';
import '@/public/assets/css/components.css';
import '@/public/assets/css/produto.css';

export const metadata: Metadata = {
  title: 'Alphenix | Suplementos Premium',
  description: 'Suplementos premium selecionados para quem treina de verdade.',
  icons: {
    icon: '/assets/images/logo_oficial.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Fontes Externas */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />

        {/* Ícones FontAwesome */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
        />
      </head>
      <body>
        <CartRoot>
          {/*
            Loader: mostra a tela de carregamento e, ao final,
            adiciona a classe `loaded` ao <body> — é o que libera
            a visibilidade do <main> e do <header> (regra em
            components.css). Precisa vir ANTES de Header/children.
          */}
          <Loader />

          {/* Header global: aparece em todas as páginas */}
          <Header />

          {children}

          {/* Footer global: aparece em todas as páginas */}
          <Footer />

          {/*
            RevealAnimations: ativa .reveal → .visible via IntersectionObserver
            para as seções estáticas (hero, features, cta-banner etc).
            A grade de produtos da home tem seu próprio observer interno
            (ver components/HomeProducts.tsx), pois os cards mudam
            dinamicamente com busca/filtro.
          */}
          <RevealAnimations />
        </CartRoot>
      </body>
    </html>
  );
}
