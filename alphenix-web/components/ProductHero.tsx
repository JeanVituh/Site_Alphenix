'use client';
// ================================================================
//  ALPHENIX — ProductHero (components/ProductHero.tsx)
//
//  Client Component que agrupa:
//   • Galeria interativa (miniaturas + setas + troca por sabor)
//   • Coluna de info (marca, nome, preço, descrição, VariantSelector)
//   • Botão Compartilhar
//
//  Recebe o produto completo do Server Component (page.tsx) e
//  gerencia localmente o estado de imagem ativa.
// ================================================================

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { VariantSelector } from './VariantSelector';
import type { ProductWithVariants } from '@/lib/types';
import { WHATSAPP_NUMBER, getProductWaURL } from '@/lib/whatsapp';

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
  const images = (product.images ?? []).map(assetUrl);

  // Índice da miniatura selecionada manualmente
  const [activeIdx, setActiveIdx] = useState(0);
  // Imagem injetada pelo VariantSelector quando sabor muda (opcional)
  const [imageOverride, setImageOverride] = useState<string | null>(null);

  const hasVariants  = product.skus_variacoes?.length > 0;
  const hasMultiImg  = images.length > 1;

  // Imagem principal: override (sabor) > miniatura selecionada
  const mainSrc = imageOverride ?? images[activeIdx] ?? null;

  // Qual miniatura fica "ativa": tenta casar o override com uma thumb
  const activeThumbIdx = imageOverride
    ? images.findIndex(s => s === imageOverride)
    : activeIdx;

  // ── Handlers de galeria ──────────────────────────────────────
  const handlePrev = useCallback(() => {
    setImageOverride(null);
    setActiveIdx(i => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const handleNext = useCallback(() => {
    setImageOverride(null);
    setActiveIdx(i => (i + 1) % images.length);
  }, [images.length]);

  const handleThumb = useCallback((idx: number) => {
    setActiveIdx(idx);
    setImageOverride(null);
  }, []);

  // Chamado pelo VariantSelector quando sabor com imagem é selecionado
  const handleImageChange = useCallback((url: string) => {
    setImageOverride(assetUrl(url));
  }, []);

  // ── Share ────────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    try {
      if (navigator?.share) {
        await navigator.share({
          title: `${product.name} — ${product.brand}`,
          text:  product.description ?? undefined,
          url:   window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copiado para a área de transferência!');
      }
    } catch {
      // Usuário cancelou ou API não suportada — silencioso
    }
  }, [product.name, product.brand, product.description]);

  // ── Preço base formatado ─────────────────────────────────────
  const [priceInt, priceDec] = product.base_price.toFixed(2).split('.');

  // WhatsApp direto (sem variações)
  const directWaUrl = getProductWaURL({
    name:  product.name,
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

            {/* Miniaturas */}
            {hasMultiImg && (
              <div className="pdp-thumbs">
                {images.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`pdp-thumb${i === activeThumbIdx ? ' active' : ''}`}
                    onClick={() => handleThumb(i)}
                    aria-label={`Ver imagem ${i + 1}`}
                    aria-pressed={i === activeThumbIdx}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`${product.name} — imagem ${i + 1}`}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ════ INFO ════ */}
          <div className="pdp-info">

            {/* "← Voltar ao catálogo" */}
            <Link href="/#produtos" className="pdp-back-link">
              <i className="fa-solid fa-arrow-left" aria-hidden="true" />
              Voltar ao catálogo
            </Link>

            {/* Cabeçalho: marca, badge, nome, categoria */}
            <div className="pdp-info__header">
              <div className="pdp-info__top-row">
                <span className="pdp-brand">{product.brand}</span>
                {product.badge && (
                  <span className="pdp-badge">⭐ {product.badge}</span>
                )}
              </div>
              <h1 className="pdp-name">{product.name}</h1>
              <span className="pdp-category-tag">
                {product.category.toUpperCase()}
              </span>
            </div>

            {/* Bloco de preço base */}
            <div className="pdp-price-block">
              <div className="pdp-price">
                <span className="pdp-price__curr">R$</span>
                <span className="pdp-price__val">
                  {priceInt},{priceDec}
                </span>
              </div>
              <p className="pdp-price__note">
                Consulte condições de pagamento e entrega pelo WhatsApp
              </p>
            </div>

            {/* Descrição */}
            {product.description && (
              <p className="pdp-description">{product.description}</p>
            )}

            {/* Variações + CTA (VariantSelector já inclui preço dinâmico + botão WA) */}
            {hasVariants ? (
              <VariantSelector
                product={product}
                whatsappNumber={WHATSAPP_NUMBER}
                onImageChange={handleImageChange}
              />
            ) : (
              /* Produto sem variações: CTA direto */
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

            {/* Compartilhar — sempre visível */}
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
