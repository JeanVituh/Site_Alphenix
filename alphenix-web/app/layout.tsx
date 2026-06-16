// ================================================================
//  ALPHENIX — app/layout.tsx (Versão Corrigida)
// ================================================================

import type { Metadata } from 'next';
import { RevealAnimations } from '@/components/RevealAnimations';

// ─── IMPORTAÇÃO CORRETA DOS ARQUIVOS CSS ───
// Mudamos de tags <link> para imports normais. A ordem original foi mantida!
// Nota: Se o seu projeto usar a pasta 'src', mude o início do caminho para '../../public'
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
        {/* Fontes Externas (Podem continuar aqui sem problemas) */}
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
      <body className="loaded">
        {children}

        {/*
          RevealAnimations: ativa .reveal → .visible via IntersectionObserver.
          Deve ficar DEPOIS de {children} para que o DOM já exista quando
          o useEffect rodar.
        */}
        <RevealAnimations />
      </body>
    </html>
  );
}