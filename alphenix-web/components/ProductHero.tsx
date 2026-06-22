'use client';
// ================================================================
//  ALPHENIX — ProductHero (components/ProductHero.tsx)
//
//  Galeria com:
//   • imagem principal dinâmica via skus_variacoes.image_url
//   • imagens fixas/genéricas via products.images
//   • troca de sabor sem recarregar página
// ================================================================

import { useState, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { VariantSelector } from './VariantSelector';
import type { ProductWithVariants, CtaStatus } from '@/lib/types';
import { getProductWaURL } from '@/lib/whatsapp';
import { formatCurrencyBR } from '@/lib/cart';
import {
  PAYMENT_DISCOUNT_PERCENT,
  calculateDiscountedPrice,
  calculatePaymentDiscount,
} from '@/lib/payment';

// ── Helper ───────────────────────────────────────────────────────
function assetUrl(path: string): string {
  if (!path) return path;
  if (path.startsWith('http') || path.startsWith('/')) return path;
  return '/' + path;
}

function getSkuPrice(sku: ProductWithVariants['skus_variacoes'][number], basePrice: number): number {
  return sku.price ?? basePrice;
}

/**
 * SKU inicial = menor variação vendável.
 * Isso mantém a página do produto coerente com o card do catálogo, que mostra
 * “A partir de”. Assim o cliente não clica vendo um preço e cai direto em
 * outra variação mais cara.
 */
function getInitialDisplaySku(product: ProductWithVariants) {
  const skusVisiveis = product.skus_variacoes?.filter(sku => sku.available) ?? [];

  return [...skusVisiveis].sort((a, b) => {
    const priceDiff = getSkuPrice(a, product.base_price) - getSkuPrice(b, product.base_price);
    if (priceDiff !== 0) return priceDiff;

    // Em empate, prioriza pronta entrega.
    const stockDiff = Number(b.stock > 0) - Number(a.stock > 0);
    if (stockDiff !== 0) return stockDiff;

    // Em novo empate, prioriza Pote apenas para manter capa mais comercial.
    const aIsPote = a.tipos_embalagem?.nome === 'Pote';
    const bIsPote = b.tipos_embalagem?.nome === 'Pote';
    return Number(bIsPote) - Number(aIsPote);
  })[0] ?? null;
}

// ── Props ────────────────────────────────────────────────────────
interface Props {
  product: ProductWithVariants;
}

// ── Componente ───────────────────────────────────────────────────
export function ProductHero({ product }: Props) {
  // Agora product.images guarda APENAS imagens fixas/genéricas:
  // exemplo: -2.jpg, -3.jpg, -4.jpg
  const fixedImages = useMemo(
    () => (product.images ?? []).map(assetUrl),
    [product.images]
  );

  // Pega a primeira imagem principal disponível em skus_variacoes.image_url
  // Isso serve como imagem inicial da página.

const initialDisplaySku = useMemo(() => getInitialDisplaySku(product), [product]);

const initialSkuImage = useMemo(() => {
  // A imagem inicial acompanha a menor variação vendável, mantendo coerência
  // com o preço “A partir de” exibido no catálogo.
  if (initialDisplaySku?.image_url) return initialDisplaySku.image_url;

  const skusVisiveis = product.skus_variacoes?.filter(sku => sku.available) ?? [];
  return skusVisiveis.find(sku => sku.image_url)?.image_url ?? null;
}, [initialDisplaySku, product.skus_variacoes]);

  const [skuMainImage, setSkuMainImage] = useState<string | null>(
    () => initialSkuImage ? assetUrl(initialSkuImage) : null
  );

  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const thumbsRef = useRef<HTMLDivElement>(null);

  const scrollThumbs = useCallback((direction: 'left' | 'right') => {
    const el = thumbsRef.current;
    if (!el) return;

    el.scrollBy({
      left: direction === 'left' ? -180 : 180,
      behavior: 'smooth',
    });
  }, []);

  const galleryImages = useMemo(() => {
    const imgs = [
      skuMainImage,
      ...fixedImages,
    ].filter((src): src is string => Boolean(src));

    return Array.from(new Set(imgs));
  }, [skuMainImage, fixedImages]);

  const hasVariants = product.skus_variacoes?.length > 0;
  const hasMultiImg = galleryImages.length > 1;

  const mainSrc = galleryImages[activeImageIdx] ?? null;

  const handlePrev = useCallback(() => {
    if (!galleryImages.length) return;
    setActiveImageIdx(i => (i - 1 + galleryImages.length) % galleryImages.length);
  }, [galleryImages.length]);

  const handleNext = useCallback(() => {
    if (!galleryImages.length) return;
    setActiveImageIdx(i => (i + 1) % galleryImages.length);
  }, [galleryImages.length]);

  const handleThumb = useCallback((idx: number) => {
    setActiveImageIdx(idx);
  }, []);

  const handleImageChange = useCallback((url: string | null) => {
    if (url) {
      setSkuMainImage(assetUrl(url));
      setActiveImageIdx(0);
      return;
    }

    setSkuMainImage(null);
    setActiveImageIdx(0);
  }, []);

  // ── Share ────────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    try {
      if (navigator?.share) {
        await navigator.share({
          title: `${product.name} — ${product.brand}`,
          text: product.description ?? undefined,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copiado para a área de transferência!');
      }
    } catch {
      // Usuário cancelou ou API não suportada — silencioso
    }
  }, [product.name, product.brand, product.description]);

  // ── Estado do preço/status da variação selecionada ─────────────
  const [variantPrice, setVariantPrice] = useState(() =>
    initialDisplaySku ? getSkuPrice(initialDisplaySku, product.base_price) : product.base_price
  );

  const [variantStatus, setVariantStatus] = useState<CtaStatus>(() => {
    if (!product.skus_variacoes?.length) return 'comprar';
    if (!initialDisplaySku) return 'indisponivel';

    return initialDisplaySku.stock > 0 ? 'comprar' : 'encomenda';
  });

  const handleVariantChange = useCallback(
    ({ price, status }: { price: number; status: CtaStatus }) => {
      setVariantPrice(price);
      setVariantStatus(status);
    },
    []
  );

  const displayPrice = hasVariants ? variantPrice : product.base_price;
  const shouldShowPrice = hasVariants ? variantStatus !== 'indisponivel' : true;
  const isOrderVariant = hasVariants && variantStatus === 'encomenda';
  const priceStatusLabel = isOrderVariant ? 'Encomenda' : 'Pronta entrega';
  const priceNote = isOrderVariant
    ? 'Produto sob encomenda. Confirme prazo e disponibilidade no WhatsApp.'
    : 'Produto à pronta entrega. Confirme disponibilidade e pagamento no WhatsApp.';

  // ── Preço com desconto Pix/Dinheiro ──────────────────────────
  const pixOrCashDiscount = calculatePaymentDiscount(displayPrice, 'pix');
  const pixOrCashPrice = calculateDiscountedPrice(displayPrice, 'pix');
  const shouldShowPaymentDiscount = pixOrCashDiscount > 0;
  const priceToHighlight = shouldShowPaymentDiscount ? pixOrCashPrice : displayPrice;
  const [priceInt, priceDec] = priceToHighlight.toFixed(2).split('.');

  // WhatsApp direto para produto sem variações
  const directWaUrl = getProductWaURL({
    name: product.name,
    brand: product.brand,
    price: product.base_price,
  });

  // ── Render ───────────────────────────────────────────────────
  return (
    <section className="pdp-hero">
      <div className="container">
        <div className="pdp-hero__inner">

          {/* ════ GALERIA ════ */}
          <div className="pdp-gallery">
            <div className="pdp-gallery__stage">

              {/* Seta anterior */}
              {hasMultiImg && (
                <button
                  type="button"
                  className="pdp-arrow pdp-arrow--prev"
                  onClick={handlePrev}
                  aria-label="Imagem anterior"
                >
                  <i className="fa-solid fa-chevron-left" aria-hidden="true" />
                </button>
              )}

              {/* Imagem principal */}
              {mainSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={mainSrc}
                  src={mainSrc}
                  alt={product.name}
                  className="pdp-main-img"
                  width={600}
                  height={600}
                />
              ) : (
                <div className="pdp-gallery__placeholder">
                  <span style={{ color: product.brand_color }}>
                    {product.brand_initials ?? product.brand.slice(0, 2)}
                  </span>
                </div>
              )}

              {/* Seta próxima */}
              {hasMultiImg && (
                <button
                  type="button"
                  className="pdp-arrow pdp-arrow--next"
                  onClick={handleNext}
                  aria-label="Próxima imagem"
                >
                  <i className="fa-solid fa-chevron-right" aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Miniaturas: APENAS imagens fixas de products.images */}
            {hasMultiImg && (
              <div className="pdp-thumbs-wrap">
                <button
                  type="button"
                  className="pdp-thumbs-arrow pdp-thumbs-arrow--left"
                  onClick={() => scrollThumbs('left')}
                  aria-label="Ver imagens anteriores"
                >
                  <i className="fa-solid fa-chevron-left" aria-hidden="true" />
                </button>

                <div className="pdp-thumbs" ref={thumbsRef}>
                  {galleryImages.map((src, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`pdp-thumb${i === activeImageIdx ? ' active' : ''}`}
                      onClick={() => handleThumb(i)}
                      aria-label={`Ver imagem ${i + 1}`}
                      aria-pressed={i === activeImageIdx}
                    >
                      <img
                        src={src}
                        alt={`${product.name} — imagem ${i + 1}`}
                      />
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="pdp-thumbs-arrow pdp-thumbs-arrow--right"
                  onClick={() => scrollThumbs('right')}
                  aria-label="Ver próximas imagens"
                >
                  <i className="fa-solid fa-chevron-right" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>

          {/* ════ INFO ════ */}
          <div className="pdp-info">

            {/* Voltar ao catálogo */}
            <Link href="/#produtos" className="pdp-back-link">
              <i className="fa-solid fa-arrow-left" aria-hidden="true" />
              Voltar ao catálogo
            </Link>

            {/* Cabeçalho */}
            <div className="pdp-info__header">
              <div className="pdp-info__top-row">
                <div className="pdp-info__badges">
                  <span className="pdp-brand">{product.brand}</span>
                  {product.badge && (
                    <span className="pdp-badge">{product.badge}</span>
                  )}
                </div>

                <button
                  type="button"
                  className="pdp-share-btn pdp-share-btn--icon"
                  onClick={handleShare}
                  aria-label={`Compartilhar ${product.name}`}
                >
                  <i className="fa-solid fa-share-nodes" aria-hidden="true" />
                  <span>Compartilhar</span>
                </button>
              </div>

              <h1 className="pdp-name">{product.name}</h1>

              <span className="pdp-category-tag">
                {product.category.toUpperCase()}
              </span>
            </div>

            {/* Preço compacto: mantém Pix/desconto, sem alterar carrinho, SKU ou WhatsApp. */}
            {shouldShowPrice && (
              <div className={`pdp-price-block pdp-price-block--compact${isOrderVariant ? ' pdp-price-block--order' : ''}`}>
                <div className="pdp-price-block__top pdp-price-block__top--compact">
                  <span className={`pdp-price-status${isOrderVariant ? ' pdp-price-status--order' : ''}`}>
                    {priceStatusLabel}
                  </span>
                </div>

                {shouldShowPaymentDiscount ? (
                  <div className="pdp-price-compact">
                    <p className="pdp-price-compact__old">
                      <span>De</span>
                      <del>{formatCurrencyBR(displayPrice)}</del>
                    </p>

                    <p className="pdp-price pdp-price--compact">
                      <span className="pdp-price__curr">R$</span>
                      <span className="pdp-price__val">
                        {priceInt},{priceDec}
                      </span>
                      <span className="pdp-price__pix-text">no Pix</span>
                    </p>

                    <span className="pdp-price__discount-badge pdp-price__discount-badge--compact">
                      {PAYMENT_DISCOUNT_PERCENT}% OFF
                    </span>
                  </div>
                ) : (
                  <div className="pdp-price pdp-price--compact">
                    <span className="pdp-price__curr">R$</span>
                    <span className="pdp-price__val">
                      {priceInt},{priceDec}
                    </span>
                  </div>
                )}

                <p className="pdp-price__note">
                  {priceNote}
                </p>
              </div>
            )}

            {/* Descrição */}
            {product.description && (
              <p className="pdp-description">{product.description}</p>
            )}

            {/* Variações */}
            {hasVariants ? (
              <VariantSelector
                product={product}
                onImageChange={handleImageChange}
                onVariantChange={handleVariantChange}
              />
            ) : (
              <div className="pdp-cta-group">
                <a
                  href={directWaUrl}
                  className="btn btn--whatsapp pdp-cta-main"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="fa-brands fa-whatsapp" aria-hidden="true" />
                  COMPRAR PELO WHATSAPP
                </a>
              </div>
            )}


          </div>{/* /pdp-info */}

        </div>{/* /pdp-hero__inner */}
      </div>{/* /container */}
    </section>
  );
}