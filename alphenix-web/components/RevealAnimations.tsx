'use client';
// ================================================================
//  ALPHENIX — RevealAnimations (components/RevealAnimations.tsx)
//
//  CORREÇÃO: antes o observer era criado uma única vez no mount e
//  desconectado após animar cada elemento. Com a navegação
//  client-side do Next.js, ao voltar para a home os elementos
//  .reveal são recriados sem a classe .visible — e o observer
//  já estava morto, deixando tudo invisível (tela preta).
//
//  Solução: dependência em `pathname` → o useEffect re-executa a
//  cada troca de rota, criando um novo observer para observar os
//  elementos .reveal:not(.visible) que ainda precisam animar.
// ================================================================

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function RevealAnimations() {
  const pathname = usePathname();

  useEffect(() => {
    let observer: IntersectionObserver | null = null;

    // Pequeno delay garante que o DOM já foi atualizado pelo React
    // após a navegação antes de querySelectorAll
    const timer = setTimeout(() => {
      const els = Array.from(
        document.querySelectorAll<HTMLElement>('.reveal:not(.visible)')
      );
      if (!els.length) return;

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              observer?.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.08, rootMargin: '0px 0px -32px 0px' }
      );

      els.forEach((el) => observer!.observe(el));
    }, 100);

    // Cleanup: cancela o timer e desconecta o observer ao trocar de rota
    return () => {
      clearTimeout(timer);
      observer?.disconnect();
    };
  }, [pathname]); // ← Re-executa sempre que a rota mudar

  return null;
}
