import type { Metadata } from 'next';

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
        {/* Fontes */}
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

        {/* ─── CSS do projeto (ordem importa!) ─── */}
        {/* 1. Tokens de design — deve vir antes de tudo */}
        <link rel="stylesheet" href="/assets/css/variables.css" />
        {/* 2. Reset e utilitários globais */}
        <link rel="stylesheet" href="/assets/css/base.css" />
        {/* 3. Keyframes e animações */}
        <link rel="stylesheet" href="/assets/css/animations.css" />
        {/* 4. Componentes globais (header, footer, cards...) */}
        <link rel="stylesheet" href="/assets/css/components.css" />
        {/* 5. Estilos da página de produto
               ⚠️ ESTAVA FALTANDO — causa das classes pdp-* sem efeito */}
        <link rel="stylesheet" href="/assets/css/produto.css" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
