'use client';
// ================================================================
//  ALPHENIX — Header (components/Header.tsx)
//
//  Header/nav/menu mobile global + botão de carrinho sempre visível.
// ================================================================

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
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

  const getHeaderOffset = useCallback(() => {
    return headerRef.current?.getBoundingClientRect().height ?? 0;
  }, []);

  const getSectionTop = useCallback((sectionId: SectionId) => {
    const section = document.getElementById(sectionId);
    if (!section) return null;

    return Math.max(
      section.getBoundingClientRect().top + window.scrollY - getHeaderOffset(),
      0,
    );
  }, [getHeaderOffset]);

  const scrollToSection = useCallback((
    sectionId: SectionId,
    behavior: ScrollBehavior = 'smooth',
  ) => {
    const top = getSectionTop(sectionId);
    if (top === null) return false;

    window.scrollTo({ top, behavior });
    return true;
  }, [getSectionTop]);

  const scheduleSectionScroll = useCallback((
    sectionId: SectionId,
    behavior: ScrollBehavior = 'smooth',
  ) => {
    // Aguarda o React fechar o menu e o navegador recalcular o layout.
    // Duas animações são mais confiáveis no Safari/Chrome mobile do que
    // tentar rolar no mesmo instante do toque.
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        scrollToSection(sectionId, behavior);
      });
    });

    // Fallback: caso o navegador interrompa a rolagem durante o fechamento
    // do menu, posiciona a página corretamente depois da animação.
    window.setTimeout(() => {
      const expectedTop = getSectionTop(sectionId);
      if (expectedTop === null) return;

      if (Math.abs(window.scrollY - expectedTop) > 12) {
        window.scrollTo({ top: expectedTop, behavior: 'auto' });
      }
    }, 700);
  }, [getSectionTop, scrollToSection]);

  function closeMobileMenuNow() {
    setMenuOpen(false);

    // Compatibilidade com versões anteriores do menu, que adicionavam esta
    // classe e bloqueavam a rolagem do body no celular.
    document.body.classList.remove('menu-open');
  }

  function goToSection(sectionId: SectionId) {
    closeMobileMenuNow();
    setActiveId(sectionId);

    // Em uma página de produto, volta para a home e guarda a seção que deve
    // ser aberta depois que a página terminar de carregar.
    if (pathname !== '/') {
      sessionStorage.setItem(PENDING_SCROLL_KEY, sectionId);
      window.location.assign(`/#${sectionId}`);
      return;
    }

    const nextUrl = `${window.location.pathname}${window.location.search}#${sectionId}`;
    if (window.location.hash !== `#${sectionId}`) {
      window.history.pushState(null, '', nextUrl);
    }

    scheduleSectionScroll(sectionId);
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

  // ── Garante que nenhuma trava antiga permaneça no body ──────
  useEffect(() => {
    document.body.classList.remove('menu-open');

    return () => {
      document.body.classList.remove('menu-open');
    };
  }, []);

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
    document.body.classList.remove('menu-open');
    window.setTimeout(() => {
      setActiveId(matchingLink.id);
      scheduleSectionScroll(matchingLink.id, 'auto');
    }, 120);
  }, [pathname, scheduleSectionScroll]);

  // ── Suporte aos botões voltar/avançar do navegador ──────────
  useEffect(() => {
    if (pathname !== '/') return;

    function onHashChange() {
      const hashId = window.location.hash.replace('#', '') as SectionId;
      const matchingLink = NAV_LINKS.find((link) => link.id === hashId);
      if (!matchingLink) return;

      setActiveId(matchingLink.id);
      scheduleSectionScroll(matchingLink.id, 'auto');
    }

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [pathname, scheduleSectionScroll]);

  // ── Destaca o link correto do menu conforme a seção atual ─────
  useEffect(() => {
    if (pathname !== '/') return;

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
  }, [getHeaderOffset, pathname]);

  const displayedActiveId: SectionId = pathname === '/' ? activeId : 'inicio';

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
                  className={`nav__link${displayedActiveId === link.id ? ' active' : ''}`}
                  onClick={() => goToSection(link.id)}
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="header__actions">
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
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

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
                  className={`mobile-menu__link${displayedActiveId === link.id ? ' active' : ''}`}
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
