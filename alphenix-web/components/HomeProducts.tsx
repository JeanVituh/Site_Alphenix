'use client';
// ================================================================
//  ALPHENIX — HomeProducts (components/HomeProducts.tsx)
//
//  Recria a busca + filtros de categoria + grade de produtos que
//  existiam em main.js (initSearch, initFilters, renderProducts),
//  agora em React e usando os produtos reais do Supabase (recebidos
//  via prop, buscados em app/page.tsx com getAllProducts()) em vez
//  da lista fixa de products.js.
//
//  Recebe `products: ProductCard[]` já prontos do servidor e faz
//  toda a busca/filtro no cliente (mesmo comportamento do site
//  original — dataset pequeno, não precisa de round-trip ao banco
//  a cada digitação).
// ================================================================

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ProductCard } from '@/lib/types';
import { CATEGORIES } from '@/lib/categories';
import { formatCurrencyBR } from '@/lib/cart';
import { PAYMENT_DISCOUNT_PERCENT, calculateDiscountedPrice } from '@/lib/payment';

// ── Helpers ──────────────────────────────────────────────────────

function normalizeStr(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function assetUrl(path: string): string {
  if (!path) return path;
  if (path.startsWith('http') || path.startsWith('/')) return path;
  return '/' + path;
}

// ── Componente principal ────────────────────────────────────────

interface HomeProductsProps {
  products: ProductCard[];
}

export function HomeProducts({ products }: HomeProductsProps) {
  const searchParams = useSearchParams();
  const gridRef = useRef<HTMLDivElement>(null);
  const filterTabsRef = useRef<HTMLDivElement>(null);

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterHint, setShowFilterHint] = useState(false);
  const [filterHintHidden, setFilterHintHidden] = useState(false);

  // Deep-link: /?categoria=X (vindo do rodapé ou de fora) pré-seleciona a aba
  useEffect(() => {
    const cat = searchParams.get('categoria');
    if (cat) setActiveCategory(cat);
  }, [searchParams]);

  // Mobile: mostra uma seta discreta quando existem categorias para o lado direito.
  useEffect(() => {
    const tabsEl = filterTabsRef.current;
    if (!tabsEl) return;

    function syncHint() {
      const currentTabs = filterTabsRef.current;
      if (!currentTabs) return;

      const hasOverflow = currentTabs.scrollWidth > currentTabs.clientWidth + 4;
      const userScrolled = currentTabs.scrollLeft > 8;

      setShowFilterHint(hasOverflow);
      setFilterHintHidden(userScrolled);
    }

    syncHint();
    tabsEl.addEventListener('scroll', syncHint, { passive: true });
    window.addEventListener('resize', syncHint);

    return () => {
      tabsEl.removeEventListener('scroll', syncHint);
      window.removeEventListener('resize', syncHint);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = normalizeStr(searchQuery.trim());
    return products.filter((p) => {
      const matchCat = activeCategory === 'all' || p.category === activeCategory;
      if (!matchCat) return false;
      if (!q) return true;
      return (
        normalizeStr(p.name).includes(q) ||
        normalizeStr(p.brand).includes(q) ||
        normalizeStr(p.description ?? '').includes(q)
      );
    });
  }, [products, activeCategory, searchQuery]);

  // Reaplica o scroll-reveal nos cards sempre que a lista filtrada muda
  // (a versão global em RevealAnimations.tsx só observa o que existe no
  // mount inicial — aqui os cards entram/saem dinamicamente).
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const items = grid.querySelectorAll<HTMLElement>('.reveal:not(.visible)');
    if (!items.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -32px 0px' }
    );
    items.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [filtered]);

  const hasQuery = searchQuery.trim().length > 0;

  function handleCategoryClick(id: string) {
    setActiveCategory(id);
    if (hasQuery) setSearchQuery('');
  }

  return (
    <>
      {/* ── Search Bar ── */}
      <div className="search-bar-wrapper reveal">
        <div className="search-bar">
          <i className="fa-solid fa-magnifying-glass search-bar__icon" aria-hidden="true" />
          <input
            type="search"
            className="search-bar__input"
            placeholder="Buscar por nome, marca..."
            aria-label="Buscar produtos"
            autoComplete="off"
            spellCheck={false}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {hasQuery && (
            <button
              type="button"
              className="search-bar__clear"
              aria-label="Limpar busca"
              onClick={() => setSearchQuery('')}
            >
              <i className="fa-solid fa-xmark" aria-hidden="true" />
            </button>
          )}
        </div>

        {hasQuery && (
          <p className="search-results-count" aria-live="polite">
            {filtered.length > 0 ? (
              <>
                <span>{filtered.length}</span> resultado{filtered.length !== 1 ? 's' : ''} para
                {' "'}<span>{searchQuery}</span>{'"'}
              </>
            ) : (
              <>Nenhum resultado para {'"'}<span>{searchQuery}</span>{'"'}</>
            )}
          </p>
        )}
      </div>

      {/* ── Category Filters ── */}
      <div
        className={`filter-tabs-wrapper${showFilterHint ? ' has-scroll' : ''}${filterHintHidden ? ' scrolled' : ''}`}
      >
        <div
          ref={filterTabsRef}
          className="filter-tabs"
          id="filterTabs"
          role="tablist"
          aria-label="Filtrar por categoria"
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`filter-tab${activeCategory === cat.id ? ' active' : ''}`}
              data-category={cat.id}
              role="tab"
              aria-selected={activeCategory === cat.id}
              onClick={() => handleCategoryClick(cat.id)}
            >
              <i className={`fa-solid ${cat.icon}`} aria-hidden="true" />
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {showFilterHint && (
          <span className="filter-scroll-hint" aria-hidden="true">
            <i className="fa-solid fa-chevron-right" />
          </span>
        )}
      </div>

      {/* ── Products Grid ── */}
      <div
        className="products-grid"
        id="productsGrid"
        ref={gridRef}
        aria-live="polite"
        aria-label="Grade de produtos"
      >
        {filtered.map((product, i) => (
          <ProductCardItem key={product.id} product={product} index={i} />
        ))}
      </div>

      {/* ── Empty state ── */}
      {filtered.length === 0 && (
        <div className="products-empty" role="status">
          <i className="fa-solid fa-box-open" aria-hidden="true" />
          <p>
            {hasQuery
              ? `Nenhum produto encontrado para "${searchQuery}".`
              : 'Nenhum produto nesta categoria.'}
          </p>
        </div>
      )}
    </>
  );
}

// ── Card individual ─────────────────────────────────────────────

function ProductCardItem({
  product,
  index,
}: {
  product: ProductCard;
  index: number;
}) {
  const delay = `reveal-delay-${(index % 4) + 1}`;
  const mainImage = product.cover_image_url ?? product.images?.[0] ?? null;
  const price = product.min_price ?? product.base_price ?? 0;
  const discountedPrice = calculateDiscountedPrice(price, 'pix');
  const [discountedInt, discountedDec] = discountedPrice.toFixed(2).split('.');

  return (
    <article className={`product-card reveal ${delay}`} data-category={product.category}>
      <div className="product-card__image-wrap">
        <Link
          href={`/produtos/${product.slug}`}
          className="product-card__image-link"
          aria-label={`Ver detalhes: ${product.name}`}
          tabIndex={-1}
        />

        {product.badge && <span className="product-card__badge">{product.badge}</span>}

        {mainImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={assetUrl(mainImage)}
            alt={product.name}
            className="product-card__img"
            loading="lazy"
            onError={(e) => {
              const img = e.currentTarget;
              img.style.display = 'none';
              const placeholder = img.nextElementSibling as HTMLElement | null;
              if (placeholder) placeholder.style.display = 'flex';
            }}
          />
        )}

        <div
          className="product-card__placeholder"
          style={{ display: mainImage ? 'none' : 'flex' }}
        >
          <div
            className="product-card__placeholder-inner"
            style={{
              background: `${product.brand_color}18`,
              border: `2px solid ${product.brand_color}40`,
            }}
          >
            <span style={{ color: product.brand_color }}>{product.brand_initials}</span>
          </div>
        </div>
      </div>

      <div className="product-card__body">
        <div className="product-card__meta">
          <span className="product-card__brand">{product.brand}</span>
        </div>
        <h3 className="product-card__name">{product.name}</h3>
        <p className="product-card__description">{product.description}</p>
      </div>

      <div className="product-card__footer">
        <div className="product-card__pricing product-card__pricing--compact">
          <p className="product-card__price-from-line">
            <span>{product.has_variants ? 'A partir de' : 'De'}</span>
            <del>{formatCurrencyBR(price)}</del>
          </p>

          <p className="product-card__price product-card__price--pix">
            <span className="product-card__price-currency">R$</span>
            <span className="product-card__price-value">{discountedInt},{discountedDec}</span>
            <span className="product-card__price-pix-text">no Pix</span>
          </p>

          <span className="product-card__price-off product-card__price-off--compact">
            {PAYMENT_DISCOUNT_PERCENT}% OFF
          </span>

          {product.has_variants && (
            <p className="product-card__variation-note">
              Menor variação. O preço muda conforme sabor/tamanho.
            </p>
          )}
        </div>

        <div className="product-card__actions">
          <Link
            href={`/produtos/${product.slug}`}
            className="btn btn--details"
            aria-label={`Ver detalhes: ${product.name}`}
          >
            <i className="fa-solid fa-eye" aria-hidden="true" />
            Mais Detalhes
          </Link>
          <Link
            href={`/produtos/${product.slug}`}
            className="btn btn--whatsapp"
            aria-label={`Ver opções e preços de ${product.name}`}
          >
            <i className="fa-solid fa-cart-plus" aria-hidden="true" />
            Ver opções e preços
          </Link>
        </div>
      </div>
    </article>
  );
}
