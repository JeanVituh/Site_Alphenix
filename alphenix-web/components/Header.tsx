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

  // ── Destaca o link correto do menu conforme a seção atual.
  //    A versão anterior usava IntersectionObserver e, em alguns casos,
  //    o link ficava preso na aba anterior depois do clique em âncoras
  //    como /#produtos ou /#contato. Aqui o estado é atualizado no clique
  //    e também sincronizado pelo scroll.
  useEffect(() => {
    if (pathname !== '/') {
      setActiveId('inicio');
      return;
    }

    let frameId: number | null = null;

    function syncActiveSection() {
      const headerOffset = headerRef.current?.offsetHeight ?? 0;
      const scrollPoint = window.scrollY + headerOffset + 96;
      let currentId = 'inicio';

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

    function onHashChange() {
      const hashId = window.location.hash.replace('#', '');
      const matchingLink = NAV_LINKS.find((link) => link.id === hashId);

      if (matchingLink) {
        setActiveId(matchingLink.id);
      }

      window.setTimeout(scheduleSync, 80);
    }

    scheduleSync();
    window.setTimeout(scheduleSync, 120);

    window.addEventListener('scroll', scheduleSync, { passive: true });
    window.addEventListener('resize', scheduleSync);
    window.addEventListener('hashchange', onHashChange);

    return () => {
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      window.removeEventListener('scroll', scheduleSync);
      window.removeEventListener('resize', scheduleSync);
      window.removeEventListener('hashchange', onHashChange);
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
                <Link
                  href={link.href}
                  className={`nav__link${activeId === link.id ? ' active' : ''}`}
                  onClick={() => {
                    setActiveId(link.id);
                    setMenuOpen(false);
                  }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="header__actions">
          {/* Carrinho sempre visível no header, inclusive no mobile */}
          <CartButton />

          <Link
            href="/#produtos"
            className="btn btn--primary header__cta"
            onClick={() => {
              setActiveId('produtos');
              setMenuOpen(false);
            }}
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
                  onClick={() => {
                    setActiveId(link.id);
                    setMenuOpen(false);
                  }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <CartButton variant="menu" onClick={() => setMenuOpen(false)} />

        <Link
          href="/#produtos"
          className="btn btn--primary mobile-menu__cta"
          onClick={() => {
            setActiveId('produtos');
            setMenuOpen(false);
          }}
        >
          <i className="fa-solid fa-bolt" aria-hidden="true" />
          Ver Produtos
        </Link>
      </div>
    </header>
  );
}
