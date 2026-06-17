'use client';
// ================================================================
//  ALPHENIX — Loader (components/Loader.tsx)
//
//  Recria a tela de carregamento que existia no site estático
//  (main.js → initLoader). Mostra a logo + barra de progresso por
//  ~1.9s, depois adiciona a classe `loaded` ao <body> — é essa
//  classe que libera a visibilidade do <main> e do <header> (ver
//  a regra `body:not(.loaded) main, body:not(.loaded) .header`
//  em components.css). Sem este componente, o body nunca recebe
//  `loaded` e o site fica com a aparência de "tela preta".
//
//  Importante: este componente precisa ficar dentro de <body>,
//  no app/layout.tsx, ANTES de <Header /> e {children}.
// ================================================================

import { useEffect, useState } from 'react';

export function Loader() {
  const [hiding, setHiding] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let done = false;
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined;

    function hideLoader() {
      if (done) return;
      done = true;
      setTimeout(() => {
        setHiding(true);
        document.body.classList.add('loaded');
        setTimeout(() => setHidden(true), 750);
      }, 1900);
    }

    if (document.readyState === 'complete') {
      hideLoader();
    } else {
      window.addEventListener('load', hideLoader);
      fallbackTimer = setTimeout(hideLoader, 4500);
    }

    return () => {
      window.removeEventListener('load', hideLoader);
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, []);

  if (hidden) return null;

  return (
    <div
      className={`loader${hiding ? ' loader--hiding' : ''}`}
      role="status"
      aria-label="Carregando"
    >
      <div className="loader__content">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/images/logo_oficial.png" alt="Alphenix" className="loader__logo" />
        <div className="loader__bar-track">
          <div className="loader__bar" />
        </div>
        <p className="loader__label">CARREGANDO</p>
      </div>
    </div>
  );
}
