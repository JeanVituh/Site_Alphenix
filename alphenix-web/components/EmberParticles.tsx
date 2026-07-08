'use client';
// ================================================================
//  ALPHENIX — EmberParticles (components/EmberParticles.tsx)
//
//  Mantém o efeito de brasas do hero sem criar/remover elementos
//  continuamente. As partículas são fixas, pausam fora da tela e
//  também quando a aba fica em segundo plano.
// ================================================================

import { useEffect, useRef, type CSSProperties } from 'react';

type EmberStyle = CSSProperties & {
  '--drift': string;
  '--duration': string;
  '--delay': string;
  '--glow-delay': string;
};

const EMBERS: EmberStyle[] = [
  { left: '9%',  bottom: '5%',  width: 3,   height: 3,   '--drift': '42px',  '--duration': '6.8s', '--delay': '-1.2s', '--glow-delay': '-0.3s' },
  { left: '18%', bottom: '13%', width: 4,   height: 4,   '--drift': '-38px', '--duration': '7.6s', '--delay': '-5.1s', '--glow-delay': '-1.1s' },
  { left: '31%', bottom: '8%',  width: 2.5, height: 2.5, '--drift': '58px',  '--duration': '5.9s', '--delay': '-3.8s', '--glow-delay': '-0.7s' },
  { left: '44%', bottom: '16%', width: 3.5, height: 3.5, '--drift': '-52px', '--duration': '8.1s', '--delay': '-6.4s', '--glow-delay': '-1.4s' },
  { left: '57%', bottom: '4%',  width: 4.5, height: 4.5, '--drift': '34px',  '--duration': '7.2s', '--delay': '-2.7s', '--glow-delay': '-0.5s' },
  { left: '68%', bottom: '11%', width: 3,   height: 3,   '--drift': '-64px', '--duration': '6.4s', '--delay': '-4.6s', '--glow-delay': '-1.2s' },
  { left: '77%', bottom: '6%',  width: 2.5, height: 2.5, '--drift': '48px',  '--duration': '8.4s', '--delay': '-7.3s', '--glow-delay': '-0.9s' },
  { left: '86%', bottom: '15%', width: 4,   height: 4,   '--drift': '-44px', '--duration': '7.8s', '--delay': '-3.2s', '--glow-delay': '-0.2s' },
  { left: '24%', bottom: '2%',  width: 3,   height: 3,   '--drift': '71px',  '--duration': '9.1s', '--delay': '-8.2s', '--glow-delay': '-1.5s' },
  { left: '73%', bottom: '1%',  width: 3.5, height: 3.5, '--drift': '-31px', '--duration': '6.9s', '--delay': '-5.8s', '--glow-delay': '-0.6s' },
];

export function EmberParticles() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isInView = false;

    const updateAnimationState = () => {
      container.classList.toggle('embers--active', isInView && !document.hidden);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        isInView = entry.isIntersecting;
        updateAnimationState();
      },
      { rootMargin: '120px 0px', threshold: 0 },
    );

    observer.observe(container);
    document.addEventListener('visibilitychange', updateAnimationState);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', updateAnimationState);
    };
  }, []);

  return (
    <div className="embers" ref={containerRef} aria-hidden="true">
      {EMBERS.map((style, index) => (
        <span className="ember" style={style} key={index} />
      ))}
    </div>
  );
}
