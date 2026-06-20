'use client';
// ================================================================
//  ALPHENIX — Header (components/Header.tsx)
//
//  Header/nav/menu mobile global + botão de carrinho sempre visível.
// ================================================================

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { CartButton } from '@/components/cart/CartButton';

const NAV_LINKS = [
  { label: 'Início',       id: 'inicio'   },
  { label: 'Produtos',     id: 'produtos' },
  { label: 'Diferenciais', id: 'sobre'    },
  { label: 'Contato',      id: 'contato'  },
] as const;

type SectionId = (typeof NAV_LINKS)[number]['id'];

const PENDING_SCROLL_KEY = 'alphenix:pending-scroll-section';

export function Header() {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeId, setActiveId] = useState<SectionId>('inicio');

  function getHeaderOffset() {
    return headerRef.current?.offsetHeight ?? 0;
  }

  function scrollToSection(sectionId: SectionId, behavior: ScrollBehavior = 'smooth') {
    const section = document.getElementById(sectionId);
    if (!section) return;

    const top = Math.max(
      section.getBoundingClientRect().top + window.scrollY - getHeaderOffset(),
      0,
    );

    window.scrollTo({ top, behavior });
  }

  function closeMobileMenuNow() {
    setMenuOpen(false);

    // Remove a trava do scroll na hora do clique. No celular, se o body
    // continuar com overflow hidden durante a navegação por âncora, a página
    // pode não descer mesmo com o link certo.
    document.body.classList.remove('menu-open');
  }

  function goToSection(sectionId: SectionId) {
    closeMobileMenuNow();
    setActiveId(sectionId);

    // Se estiver em uma página de produto, volta para a home e guarda
    // qual seção deve abrir depois do carregamento.
    if (window.location.pathname !== '/') {
      sessionStorage.setItem(PENDING_SCROLL_KEY, sectionId);
      window.location.assign(`/#${sectionId}`);
      return;
    }

    if (window.location.hash !== `#${sectionId}`) {
      window.history.pushState(null, '', `/#${sectionId}`);
    }

    // Faz a rolagem manualmente, sem depender do comportamento automático
    // do Link/âncora. Os retries deixam estável no mobile, mesmo com menu
    // fechando, imagens carregando e altura do layout mudando.
    window.requestAnimationFrame(() => scrollToSection(sectionId));
    window.setTimeout(() => scrollToSection(sectionId), 80);
    window.setTimeout(() => scrollToSection(sectionId), 220);
  }

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

    return () => {
      document.body.classList.remove('menu-open');
    };
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

  // ── Se abriu a home já com hash ou vindo de produto, rola até a seção ──
  useEffect(() => {
    if (pathname !== '/') return;

    const pendingId = sessionStorage.getItem(PENDING_SCROLL_KEY) as SectionId | null;
    const hashId = window.location.hash.replace('#', '') as SectionId;
    const targetId = pendingId || hashId;
    const matchingLink = NAV_LINKS.find((link) => link.id === targetId);

    if (!matchingLink) return;

    sessionStorage.removeItem(PENDING_SCROLL_KEY);
    setActiveId(matchingLink.id);

    window.setTimeout(() => scrollToSection(matchingLink.id, 'auto'), 120);
    window.setTimeout(() => scrollToSection(matchingLink.id, 'auto'), 300);
  }, [pathname]);

  // ── Destaca o link correto do menu conforme a seção atual ─────
  useEffect(() => {
    if (pathname !== '/') {
      setActiveId('inicio');
      return;
    }

    let frameId: number | null = null;

    function syncActiveSection() {
      const scrollPoint = window.scrollY + getHeaderOffset() + 96;
      let currentId: SectionId = 'inicio';

      for (const link of NAV_LINKS) {
        const section = document.getElementById(link.id);
        if (!section) continue;

        if (section.offsetTop <= scrollPoint) {
          currentId = link.id;
        }
      }

      const isNearBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 80;

      if (isNearBottom) {
        currentId = 'contato';
      }

      setActiveId(currentId);
    }

    function scheduleSync() {
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(syncActiveSection);
    }

    scheduleSync();
    window.setTimeout(scheduleSync, 120);

    window.addEventListener('scroll', scheduleSync, { passive: true });
    window.addEventListener('resize', scheduleSync);

    return () => {
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      window.removeEventListener('scroll', scheduleSync);
      window.removeEventListener('resize', scheduleSync);
    };
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
                <button
                  type="button"
                  className={`nav__link${activeId === link.id ? ' active' : ''}`}
                  onClick={() => goToSection(link.id)}
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="header__actions">
          {/* Carrinho sempre visível no header, inclusive no mobile */}
          <CartButton />

          <button
            type="button"
            className="btn btn--primary header__cta"
            onClick={() => goToSection('produtos')}
          >
            <i className="fa-solid fa-bolt" aria-hidden="true" />
            Ver Produtos
          </button>

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
                <button
                  type="button"
                  className="mobile-menu__link"
                  onClick={() => goToSection(link.id)}
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <CartButton variant="menu" onClick={() => setMenuOpen(false)} />

        <button
          type="button"
          className="btn btn--primary mobile-menu__cta"
          onClick={() => goToSection('produtos')}
        >
          <i className="fa-solid fa-bolt" aria-hidden="true" />
          Ver Produtos
        </button>
      </div>
    </header>
  );
}
