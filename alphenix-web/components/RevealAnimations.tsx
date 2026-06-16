'use client';
// ================================================================
//  ALPHENIX — RevealAnimations (components/RevealAnimations.tsx)
//
//  Client Component que ativa a animação `.reveal → .visible`
//  via IntersectionObserver, replicando o comportamento que
//  existia no HTML original (script inline).
//
//  Adicione <RevealAnimations /> no final do <body> em layout.tsx.
// ================================================================

import { useEffect } from 'react';

export function RevealAnimations() {
  useEffect(() => {
    const els = Array.from(
      document.querySelectorAll<HTMLElement>('.reveal')
    );
    if (!els.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // Unobserve após animar — não precisa mais observar
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0 } // 8% visível já dispara a animação
    );

    els.forEach((el) => observer.observe(el));

    // Cleanup: desconecta quando o componente desmonta
    return () => observer.disconnect();
  }, []);

  // Não renderiza nada — só gerencia o DOM
  return null;
}
