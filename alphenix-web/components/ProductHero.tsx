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

// ── Helper ───────────────────────────────────────────────────────
function assetUrl(path: string): string {
  if (!path) return path;
  if (path.startsWith('http') || path.startsWith('/')) return path;
  return '/' + path;
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

const initialSkuImage = useMemo(() => {
  // Só considera variações vendáveis.
  // available=false = desativada/inexistente; não deve puxar imagem nem entrar na seleção.
  const skusVisiveis = product.skus_variacoes?.filter(sku => sku.available) ?? [];

  const skuPoteComImagem = skusVisiveis.find(
    sku => sku.tipos_embalagem?.nome === 'Pote' && sku.image_url
  );

  const qualquerSkuComImagem = skusVisiveis.find(
    sku => sku.image_url
  );

  return skuPoteComImagem?.image_url ?? qualquerSkuComImagem?.image_url ?? null;
}, [product.skus_variacoes]);

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
  const [variantPrice, setVariantPrice] = useState(product.base_price);

  const [variantStatus, setVariantStatus] = useState<CtaStatus>(() => {
    const skusVisiveis = product.skus_variacoes?.filter(sku => sku.available) ?? [];
    const firstSku = skusVisiveis.find(sku => sku.stock > 0) ?? skusVisiveis[0] ?? null;

    if (!product.skus_variacoes?.length) return 'comprar';
    if (!firstSku) return 'indisponivel';

    return firstSku.stock > 0 ? 'comprar' : 'encomenda';
  });

  const handleVariantChange = useCallback(
    ({ price, status }: { price: number; status: CtaStatus }) => {
      setVariantPrice(price);
      setVariantStatus(status);
    },
    []
  );

  const displayPrice = hasVariants ? variantPrice : product.base_price;
  const shouldShowPrice = hasVariants ? variantStatus === 'comprar' : true;

  // ── Preço base formatado ─────────────────────────────────────
  const [priceInt, priceDec] = displayPrice.toFixed(2).split('.');

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
                <span className="pdp-brand">{product.brand}</span>
                {product.badge && (
                  <span className="pdp-badge">{product.badge}</span>
                )}
              </div>

              <h1 className="pdp-name">{product.name}</h1>

              <span className="pdp-category-tag">
                {product.category.toUpperCase()}
              </span>
            </div>

            {/* Preço: aparece somente quando o SKU selecionado é pronta entrega. */}
            {shouldShowPrice && (
              <div className="pdp-price-block">
                <div className="pdp-price">
                  <span className="pdp-price__curr">R$</span>
                  <span className="pdp-price__val">
                    {priceInt},{priceDec}
                  </span>
                </div>

                <p className="pdp-price__note">
Produto à pronta entrega. Confirme disponibilidade e pagamento no WhatsApp
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

            {/* Compartilhar */}
            <div className="pdp-cta-group">
              <button
                type="button"
                className="pdp-share-btn"
                onClick={handleShare}
              >
                <i className="fa-solid fa-share-nodes" aria-hidden="true" />
                Compartilhar
              </button>
            </div>

          </div>{/* /pdp-info */}

        </div>{/* /pdp-hero__inner */}
      </div>{/* /container */}
    </section>
  );
}