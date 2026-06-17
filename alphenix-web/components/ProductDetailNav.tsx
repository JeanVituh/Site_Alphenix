'use client';
// ================================================================
//  ALPHENIX — ProductDetailNav (components/ProductDetailNav.tsx)
//
//  Nav sticky de seções da página de produto (Benefícios,
//  Modo de Uso, Tabela Nutricional). Usa IntersectionObserver
//  para destacar automaticamente a seção visível no viewport.
// ================================================================

import { useEffect, useState } from 'react';

export interface NavItem {
  id:    string;
  label: string;
}

interface Props {
  items: NavItem[];
}

export function ProductDetailNav({ items }: Props) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? '');

  useEffect(() => {
    if (!items.length) return;

    const sections = items
      .map(item => document.getElementById(item.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (!sections.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        // Pega a primeira seção que cruzou para "dentro" do viewport
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        // Dispara quando a seção entra na metade superior da tela
        rootMargin: '-10% 0px -50% 0px',
        threshold: 0,
      }
    );

    sections.forEach(s => obs.observe(s));
    return () => obs.disconnect();
  }, [items]);

  if (!items.length) return null;

  return (
    <nav className="pdp-details-nav" aria-label="Seções do produto">
      <div className="container pdp-details-nav__inner">
        {items.map(item => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={`pdp-details-nav__link${activeId === item.id ? ' active' : ''}`}
          >
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
