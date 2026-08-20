'use client';
// ================================================================
//  ALPHENIX — HomeProducts
//
//  Busca + filtros + destaques comerciais da home.
//  A reorganização de categorias usa fallback por slug para funcionar
//  mesmo antes da migração SQL ser executada no Supabase.
// ================================================================

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ProductCard } from '@/lib/types';
import {
  CATEGORIES,
  getCatalogBadge,
  getCatalogCategory,
} from '@/lib/categories';
import { formatCurrencyBR } from '@/lib/cart';
import { calculateDiscountedPrice } from '@/lib/payment';

const BEST_SELLER_SLUGS = [
  'whey-100-pure-dark-wolf',
  'combo-dark-wolf',
  'alcateia-pre-workout-dark-wolf',
  'creatina-dark-wolf',
  
] as const;

const PRODUCT_SEARCH_EVENT = 'alphenix:product-search';

type ProductSearchEventDetail = {
  query: string;
  scrollToResults?: boolean;
};

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
  const contentRef = useRef<HTMLDivElement>(null);

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [browseAll, setBrowseAll] = useState(false);

  // Deep-link: /?categoria=X e /?busca=Y pré-selecionam os filtros.
  useEffect(() => {
    const cat = searchParams.get('categoria');
    const query = searchParams.get('busca');

    if (cat) {
      setActiveCategory(cat);
      setBrowseAll(cat === 'all');
    }

    if (query !== null) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  // Recebe a busca fixa do cabeçalho. Digitar já filtra o catálogo;
  // Enter/seta leva o cliente diretamente aos resultados.
  useEffect(() => {
    function onProductSearch(event: Event) {
      const detail = (event as CustomEvent<ProductSearchEventDetail>).detail;
      if (!detail || typeof detail.query !== 'string') return;

      setSearchQuery(detail.query);

      if (detail.scrollToResults) {
        window.setTimeout(() => {
          const target = document.getElementById('catalogo-completo')
            ?? document.getElementById('produtos');
          target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 60);
      }
    }

    window.addEventListener(PRODUCT_SEARCH_EVENT, onProductSearch as EventListener);
    return () => window.removeEventListener(PRODUCT_SEARCH_EVENT, onProductSearch as EventListener);
  }, []);

  const featuredProducts = useMemo(() => {
    const bySlug = new Map(products.map((product) => [product.slug, product]));
    return BEST_SELLER_SLUGS
      .map((slug) => bySlug.get(slug))
      .filter((product): product is ProductCard => Boolean(product));
  }, [products]);

  const featuredCombo = useMemo(
    () => products.find((product) => product.slug === 'combo-dark-wolf') ?? null,
    [products],
  );

  const featuredComboGift = useMemo(
    () => products.find((product) => product.slug === 'coqueteleira-dark-wolf') ?? null,
    [products],
  );

  const filtered = useMemo(() => {
    const q = normalizeStr(searchQuery.trim());

    return products.filter((product) => {
      const displayCategory = getCatalogCategory(product);
      const matchCat = activeCategory === 'all' || displayCategory === activeCategory;
      if (!matchCat) return false;
      if (!q) return true;

      return (
        normalizeStr(product.name).includes(q) ||
        normalizeStr(product.brand).includes(q) ||
        normalizeStr(product.description ?? '').includes(q)
      );
    });
  }, [products, activeCategory, searchQuery]);

  // Reaplica o scroll-reveal nos cards sempre que as listas mudam.
  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;

    const items = root.querySelectorAll<HTMLElement>('.reveal:not(.visible)');
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
      { threshold: 0.08, rootMargin: '0px 0px -32px 0px' },
    );

    items.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [filtered, featuredProducts, featuredCombo]);

  const hasQuery = searchQuery.trim().length > 0;
  const isFiltering = hasQuery || activeCategory !== 'all' || browseAll;
  const activeCategoryLabel =
    CATEGORIES.find((category) => category.id === activeCategory)?.label ?? 'Produtos';

  function syncSearch(query: string) {
    setSearchQuery(query);
    window.dispatchEvent(
      new CustomEvent<ProductSearchEventDetail>(PRODUCT_SEARCH_EVENT, {
        detail: { query, scrollToResults: false },
      }),
    );
  }

  function handleCategorySelect(id: string) {
    setActiveCategory(id);
    setBrowseAll(id === 'all');
  }

  function handleClearFilters() {
    syncSearch('');
    setActiveCategory('all');
    setBrowseAll(false);
  }

  return (
    <div className="home-products" ref={contentRef}>
      {/* ══ BUSCA + CATEGORIAS: PRIMEIRO PASSO DO CATÁLOGO ═════ */}
      <section className="catalog-discovery" aria-labelledby="catalog-discovery-title">
        <div className="catalog-discovery__heading">
          <div>
            <p className="home-highlight-eyebrow">
              <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
              Ache rápido o que você procura
            </p>
            <h3 id="catalog-discovery-title">ENCONTRE SEU <span>SUPLEMENTO</span></h3>
          </div>
          <p className="catalog-discovery__helper">
            Pesquise pelo nome ou toque em uma categoria. No celular, todas ficam visíveis sem arrastar para o lado.
          </p>
        </div>

        <div className="search-bar-wrapper search-bar-wrapper--top">
          <div className="search-bar">
            <i className="fa-solid fa-magnifying-glass search-bar__icon" aria-hidden="true" />
            <input
              type="search"
              className="search-bar__input"
              placeholder="Buscar whey, creatina, pré-treino, marca..."
              aria-label="Buscar produtos"
              autoComplete="off"
              spellCheck={false}
              value={searchQuery}
              onChange={(e) => syncSearch(e.target.value)}
            />
            {hasQuery && (
              <button
                type="button"
                className="search-bar__clear"
                aria-label="Limpar busca"
                onClick={() => syncSearch('')}
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <div className="catalog-category-grid" role="tablist" aria-label="Filtrar por categoria">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`catalog-category-btn${activeCategory === cat.id ? ' active' : ''}`}
              data-category={cat.id}
              role="tab"
              aria-selected={activeCategory === cat.id}
              onClick={() => handleCategorySelect(cat.id)}
            >
              <i className={`fa-solid ${cat.icon}`} aria-hidden="true" />
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {isFiltering && (
          <div className="catalog-discovery__status" aria-live="polite">
            <p>
              <strong>{filtered.length}</strong> produto{filtered.length !== 1 ? 's' : ''}
              {hasQuery ? <> para <strong>“{searchQuery}”</strong></> : null}
              {activeCategory !== 'all' ? <> em <strong>{activeCategoryLabel}</strong></> : null}
            </p>
            <button type="button" className="catalog-clear-filters" onClick={handleClearFilters}>
              <i className="fa-solid fa-rotate-left" aria-hidden="true" />
              Limpar filtros
            </button>
          </div>
        )}
      </section>

      {/* Quando há busca/filtro, o cliente vê os resultados imediatamente. */}
      {isFiltering ? (
        <section className="catalog-complete catalog-complete--filtered" id="catalogo-completo" aria-labelledby="catalogo-completo-title">
          <div className="catalog-complete__heading catalog-complete__heading--compact">
            <p className="home-highlight-eyebrow">
              <i className="fa-solid fa-filter" aria-hidden="true" />
              Resultado da sua seleção
            </p>
            <h3 id="catalogo-completo-title">{browseAll && !hasQuery ? <>TODOS OS <span>PRODUTOS</span></> : <>PRODUTOS <span>ENCONTRADOS</span></>}</h3>
          </div>

          <div className="products-grid" id="productsGrid" aria-live="polite" aria-label="Grade de produtos">
            {filtered.map((product, index) => (
              <ProductCardItem key={product.id} product={product} index={index} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="products-empty" role="status">
              <i className="fa-solid fa-box-open" aria-hidden="true" />
              <p>Nenhum produto corresponde a essa busca. Tente outro termo ou limpe os filtros.</p>
              <button type="button" className="btn btn--outline" onClick={handleClearFilters}>
                Ver todos os produtos
              </button>
            </div>
          )}
        </section>
      ) : (
        <>
          {/* ══ MAIS VENDIDOS ═══════════════════════════════════ */}
          {featuredProducts.length > 0 && (
            <section className="home-highlight-section" aria-labelledby="mais-vendidos-title">
              <div className="home-highlight-heading reveal">
                <div>
                  <p className="home-highlight-eyebrow">
                    <i className="fa-solid fa-fire" aria-hidden="true" />
                    Favoritos dos clientes
                  </p>
                  <h3 id="mais-vendidos-title">MAIS <span>VENDIDOS</span></h3>
                </div>
                <a href="#catalogo-completo" className="home-highlight-link">
                  Ver todos os produtos
                  <i className="fa-solid fa-arrow-down" aria-hidden="true" />
                </a>
              </div>

              <div className="products-grid products-grid--featured">
                {featuredProducts.map((product, index) => (
                  <ProductCardItem
                    key={`featured-${product.id}`}
                    product={product}
                    index={index}
                    featured
                  />
                ))}
              </div>
            </section>
          )}

          {/* ══ COMBO EM DESTAQUE ══════════════════════════════ */}
          {featuredCombo && (
            <ComboSpotlight product={featuredCombo} giftProduct={featuredComboGift} />
          )}

          {/* ══ CATÁLOGO COMPLETO ══════════════════════════════ */}
          <section className="catalog-complete" id="catalogo-completo" aria-labelledby="catalogo-completo-title">
            <div className="catalog-complete__heading reveal">
              <p className="home-highlight-eyebrow">
                <i className="fa-solid fa-bag-shopping" aria-hidden="true" />
                Todas as opções em um só lugar
              </p>
              <h3 id="catalogo-completo-title">TODOS OS <span>PRODUTOS</span></h3>
            </div>

            <div className="products-grid" id="productsGrid" aria-live="polite" aria-label="Grade de produtos">
              {products.map((product, index) => (
                <ProductCardItem key={product.id} product={product} index={index} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

// ── Destaque de combo ───────────────────────────────────────────

function ComboSpotlight({
  product,
  giftProduct,
}: {
  product: ProductCard;
  giftProduct: ProductCard | null;
}) {
  const mainImage = product.cover_image_url ?? product.images?.[0] ?? null;
  const giftImage = giftProduct?.cover_image_url ?? giftProduct?.images?.[0] ?? null;
  const comboPrice = product.min_price ?? product.base_price ?? 0;
  const comboPix = calculateDiscountedPrice(comboPrice, 'pix');
  const compareAt = product.compare_at_price;
  const comparePix = compareAt !== null
    ? calculateDiscountedPrice(compareAt, 'pix')
    : null;
  const savings = comparePix !== null
    ? Math.max(comparePix - comboPix, 0)
    : null;

  return (
    <section className="combo-spotlight reveal" aria-labelledby="combo-destaque-title">
      <div className="combo-spotlight__content">
        <p className="combo-spotlight__eyebrow">
          <i className="fa-solid fa-gift" aria-hidden="true" />
          Oferta em destaque
        </p>

        <h3 id="combo-destaque-title">
          COMBO DARK WOLF <span>+ COQUETELEIRA GRÁTIS</span>
        </h3>

        <p className="combo-spotlight__text">
          Whey Pure 900g + Creatina Dark Wolf 500g com laudo e uma coqueteleira
          tradicional de brinde. Um kit completo para força, recuperação e praticidade.
        </p>

        <div className="combo-spotlight__benefits" aria-label="Vantagens do combo">
          <span><i className="fa-solid fa-check" aria-hidden="true" /> Whey 900g</span>
          <span><i className="fa-solid fa-check" aria-hidden="true" /> Creatina 500g</span>
          <span><i className="fa-solid fa-gift" aria-hidden="true" /> Coqueteleira de brinde</span>
        </div>

        <div className="combo-spotlight__price-row">
          <div>
            {comparePix !== null && comparePix > comboPix && (
              <p className="combo-spotlight__compare">
                Separados no Pix: <del>{formatCurrencyBR(comparePix)}</del>
              </p>
            )}
            <p className="combo-spotlight__price">
              <small>Combo no Pix</small>
              <strong>{formatCurrencyBR(comboPix)}</strong>
            </p>
          </div>

          {savings !== null && savings >= 0.01 && (
            <span className="combo-spotlight__saving">
              Economize {formatCurrencyBR(savings)}
            </span>
          )}
        </div>

        <Link href={`/produtos/${product.slug}`} className="btn btn--primary combo-spotlight__cta">
          <i className="fa-solid fa-cart-plus" aria-hidden="true" />
          Ver combo e garantir brinde
        </Link>
      </div>

      <div className="combo-spotlight__visual" aria-hidden="true">
        <div className="combo-spotlight__glow" />
        {mainImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={assetUrl(mainImage)} alt="" className="combo-spotlight__image" />
        ) : (
          <div className="combo-spotlight__placeholder">DW</div>
        )}

        {giftImage && (
          <div className="combo-spotlight__gift-product">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={assetUrl(giftImage)} alt="" />
            <span>GRÁTIS</span>
          </div>
        )}

        <span className="combo-spotlight__gift-badge">
          <i className="fa-solid fa-gift" /> BRINDE
        </span>
      </div>
    </section>
  );
}

// ── Card individual ─────────────────────────────────────────────

function ProductCardItem({
  product,
  index,
  featured = false,
}: {
  product: ProductCard;
  index: number;
  featured?: boolean;
}) {
  const delay = `reveal-delay-${(index % 4) + 1}`;
  const mainImage = product.cover_image_url ?? product.images?.[0] ?? null;
  const price = product.min_price ?? product.base_price ?? 0;
  const discountedPrice = calculateDiscountedPrice(price, 'pix');
  const [discountedInt, discountedDec] = discountedPrice.toFixed(2).split('.');
  const compareAtPrice = product.compare_at_price;
  const shouldShowCompareAt = compareAtPrice !== null && compareAtPrice > price;
  const displayCategory = getCatalogCategory(product);
  const displayBadge = getCatalogBadge(product);

  return (
    <article
      className={`product-card reveal ${delay}${featured ? ' product-card--featured' : ''}`}
      data-category={displayCategory}
    >
      <div className="product-card__image-wrap">
        <Link
          href={`/produtos/${product.slug}`}
          className="product-card__image-link"
          aria-label={`Ver detalhes: ${product.name}`}
          tabIndex={-1}
        />

        {displayBadge && <span className="product-card__badge">{displayBadge}</span>}

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
          {shouldShowCompareAt && (
            <p className="product-card__price-from-line">
              <span>De</span>
              <del>{formatCurrencyBR(compareAtPrice!)}</del>
            </p>
          )}

          {product.has_variants && (
            <p className="product-card__price-starting">A partir de</p>
          )}

          <p className="product-card__price product-card__price--pix">
            <span className="product-card__price-currency">R$</span>
            <span className="product-card__price-value">{discountedInt},{discountedDec}</span>
            <span className="product-card__price-pix-text">no Pix</span>
          </p>


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
