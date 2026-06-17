'use client';
// ================================================================
//  ALPHENIX — Header (components/Header.tsx)
//
//  Recria header/nav/menu mobile do index.html original, agora
//  como Client Component global (renderizado em app/layout.tsx,
//  então aparece em TODAS as páginas — home e produto).
//
//  Funcionalidades portadas de main.js:
//   • initHeader   → classe `scrolled` ao passar de 60px de scroll
//   • initMobileMenu → abrir/fechar, fechar ao clicar fora ou Esc
//   • initActiveNav → destaca o link da seção visível
//
//  O scroll suave até cada seção (#inicio, #produtos...) não
//  depende mais de JS: o CSS já tem `scroll-behavior: smooth`
//  (base.css) — só falta adicionar `scroll-margin-top` nessas
//  seções para compensar a altura do header fixo. Isso está
//  explicado na mensagem, é um adicional pequeno no CSS.
// ================================================================

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const NAV_LINKS = [
  { href: '/#inicio',   label: 'Início',       id: 'inicio'   },
  { href: '/#produtos', label: 'Produtos',     id: 'produtos' },
  { href: '/#sobre',    label: 'Diferenciais', id: 'sobre'    },
  { href: '/#contato',  label: 'Contato',      id: 'contato'  },
];

export function Header() {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeId, setActiveId] = useState('inicio');

  // ── Header com fundo ao rolar a página ──────────────────────
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 60);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Trava o scroll do body quando o menu mobile está aberto ──
  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen);
  }, [menuOpen]);

  // ── Fecha o menu mobile ao clicar fora ou apertar Esc ───────
  useEffect(() => {
    if (!menuOpen) return;

    function onDocClick(e: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }

    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  // ── Destaca o link da seção visível (recalcula por rota,
  //     já que a página de produto não tem essas seções) ──────
  useEffect(() => {
    const sections = document.querySelectorAll('section[id], footer[id]');
    if (!sections.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { threshold: 0.25 }
    );
    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, [pathname]);

  return (
    <header ref={headerRef} id="header" className={`header${scrolled ? ' scrolled' : ''}`}>
      <div className="container header__inner">
        <Link href="/" className="header__logo" aria-label="Alphenix — Início">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/images/logo_oficial.png" alt="Alphenix" height={44} />
        </Link>

        <nav className="nav" aria-label="Menu principal">
          <ul className="nav__list">
            {NAV_LINKS.map((link) => (
              <li key={link.id}>
                <Link
                  href={link.href}
                  className={`nav__link${activeId === link.id ? ' active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="header__actions">
          <Link
            href="/#produtos"
            className="btn btn--primary header__cta"
            onClick={() => setMenuOpen(false)}
          >
            <i className="fa-solid fa-bolt" aria-hidden="true" />
            Ver Produtos
          </Link>

          <button
            type="button"
            className={`hamburger${menuOpen ? ' active' : ''}`}
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
            aria-controls="mobileMenu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`mobile-menu${menuOpen ? ' active' : ''}`}
        id="mobileMenu"
        aria-hidden={!menuOpen}
      >
        <nav aria-label="Menu mobile">
          <ul className="mobile-menu__list">
            {NAV_LINKS.map((link) => (
              <li key={link.id}>
                <Link
                  href={link.href}
                  className="mobile-menu__link"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <Link
          href="/#produtos"
          className="btn btn--primary mobile-menu__cta"
          onClick={() => setMenuOpen(false)}
        >
          <i className="fa-solid fa-bolt" aria-hidden="true" />
          Ver Produtos
        </Link>
      </div>
    </header>
  );
}
