'use client';
// ================================================================
//  ALPHENIX — EmberParticles (components/EmberParticles.tsx)
//
//  Recria o efeito de "brasas flutuantes" do hero que existia em
//  main.js (initEmbers). Gera divs .ember periodicamente dentro
//  do container, cada uma com posição/duração/drift aleatórios,
//  e remove sozinha depois da animação (ver @keyframes emberFloat
//  em animations.css).
// ================================================================

import { useEffect, useRef } from 'react';

export function EmberParticles() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function spawnEmber() {
      if (!container) return;
      const e = document.createElement('div');
      e.className = 'ember';

      const size  = (2 + Math.random() * 4).toFixed(1);
      const drift = ((Math.random() - 0.5) * 120).toFixed(0);
      const dur   = (3.5 + Math.random() * 4).toFixed(1);
      const delay = (Math.random() * 1.5).toFixed(1);

      e.style.cssText = [
        `left:${(5 + Math.random() * 90).toFixed(1)}%`,
        `bottom:${(Math.random() * 18).toFixed(1)}%`,
        `width:${size}px`,
        `height:${size}px`,
        `--drift:${drift}px`,
        `animation-duration:${dur}s`,
        `animation-delay:${delay}s`,
      ].join(';');

      container.appendChild(e);

      setTimeout(() => {
        if (e.parentNode) e.parentNode.removeChild(e);
      }, (parseFloat(dur) + parseFloat(delay) + 0.5) * 1000);
    }

    let interval = setInterval(spawnEmber, 280);

    function onVisibilityChange() {
      if (document.hidden) {
        clearInterval(interval);
      } else {
        interval = setInterval(spawnEmber, 280);
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return <div className="embers" ref={containerRef} aria-hidden="true" />;
}
