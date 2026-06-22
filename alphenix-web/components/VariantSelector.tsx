'use client';
// ================================================================
//  ALPHENIX — VariantSelector (components/VariantSelector.tsx)
//  v5: seleção de SKU + indicação visual minimalista de encomenda
//
//  Regra:
//  - available=true  → a variação existe/vende e pode aparecer no site
//  - available=false → a variação fica escondida/desativada
//  - stock > 0      → adiciona ao carrinho como pronta entrega
//  - stock = 0      → adiciona ao carrinho como encomenda, desde que available=true
// ================================================================

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useCart } from '@/components/cart/CartContext';
import type {
  ProductWithVariants,
  SelectedValues,
  OptionAvailability,
  SkuVariacao,
  CtaStatus,
} from '@/lib/types';
import styles from './VariantSelector.module.css';

// ── Props ────────────────────────────────────────────────────────
interface VariantSelectorProps {
  product: ProductWithVariants;
  /** Chamado quando o SKU resolvido tem uma imagem específica. */
  onImageChange?: (imageUrl: string | null) => void;
  /** Informa o preço/status atual para o ProductHero controlar o preço de cima. */
  onVariantChange?: (data: { price: number; status: CtaStatus }) => void;
}

type VariantDimension = keyof SelectedValues;
type VariantOptionStatus = 'ready' | 'order' | 'unavailable';
type OptionStatusMap = Record<'sabor' | 'tamanho' | 'embalagem', Record<string, VariantOptionStatus>>;

// ── Helpers ──────────────────────────────────────────────────────
function getSellableSkus(product: ProductWithVariants): SkuVariacao[] {
  return product.skus_variacoes.filter(sku => sku.available);
}

/**
 * Monta a seleção inicial usando somente SKUs vendáveis.
 * Prioriza pronta entrega, mas aceita SKU sem estoque para encomenda.
 */
function buildInitialSelection(product: ProductWithVariants): SelectedValues {
  const skusValidos = getSellableSkus(product);

  // Seleção inicial = menor preço vendável.
  // Isso evita a sensação de propaganda enganosa: o card mostra “A partir de”
  // e a página abre exatamente na variação que gera aquele preço.
  const firstSku = [...skusValidos].sort((a, b) => {
    const priceA = a.price ?? product.base_price;
    const priceB = b.price ?? product.base_price;
    const priceDiff = priceA - priceB;
    if (priceDiff !== 0) return priceDiff;

    // Em empate, prioriza pronta entrega.
    return Number(b.stock > 0) - Number(a.stock > 0);
  })[0] ?? null;

  if (firstSku) {
    return {
      saborId: firstSku.sabor_id ?? undefined,
      tamanhoId: firstSku.tamanho_id ?? undefined,
      embalagemId: firstSku.tipo_embalagem_id ?? undefined,
    };
  }

  return {};
}

function getSkuStatus(sku: SkuVariacao | null): VariantOptionStatus {
  if (!sku || !sku.available) return 'unavailable';
  return sku.stock > 0 ? 'ready' : 'order';
}

function getOptionStatusLabel(status: VariantOptionStatus): string {
  if (status === 'ready') return 'Pronta entrega';
  if (status === 'order') return 'Encomenda';
  return 'Indisponível';
}

function mapStatusToAvailability(
  statusMap: Record<string, VariantOptionStatus>
): Record<string, boolean> {
  return Object.fromEntries(
    Object.entries(statusMap).map(([id, status]) => [id, status !== 'unavailable'])
  );
}

/**
 * Mesmo critério usado no fallback de seleção: tenta preservar sabor, tamanho e
 * embalagem atuais e dá uma pequena prioridade para pronta entrega.
 */
function scoreSkuForSelection(
  sku: SkuVariacao,
  index: number,
  dimensao: VariantDimension,
  prev: SelectedValues
): { sku: SkuVariacao; score: number; index: number } {
  let score = 0;

  if (dimensao !== 'saborId' && prev.saborId && sku.sabor_id === prev.saborId) {
    score += 100;
  }
  if (dimensao !== 'tamanhoId' && prev.tamanhoId && sku.tamanho_id === prev.tamanhoId) {
    score += 80;
  }
  if (dimensao !== 'embalagemId' && prev.embalagemId && sku.tipo_embalagem_id === prev.embalagemId) {
    score += 60;
  }
  if (sku.stock > 0) {
    score += 5;
  }

  return { sku, score, index };
}

function pickBestSkuForOption(
  candidates: SkuVariacao[],
  dimensao: VariantDimension,
  selectedValues: SelectedValues
): SkuVariacao | null {
  if (!candidates.length) return null;

  return candidates
    .map((sku, index) => scoreSkuForSelection(sku, index, dimensao, selectedValues))
    .sort((a, b) => b.score - a.score || a.index - b.index)[0].sku;
}

// ── Componente Principal ─────────────────────────────────────────
export function VariantSelector({
  product,
  onImageChange,
  onVariantChange,
}: VariantSelectorProps) {
  const { addItem } = useCart();
  const skusValidos = useMemo(() => getSellableSkus(product), [product]);

  // ── Estado: valores selecionados por dimensão ─────────────────
  const [selectedValues, setSelectedValues] = useState<SelectedValues>(
    () => buildInitialSelection(product)
  );

  // ── Quais dimensões o produto realmente usa ───────────────────
  const usaSabor = product.sabores_disponiveis.length > 0;
  const usaTamanho = product.tamanhos_disponiveis.length > 0;
  const usaEmbalagem = product.tipos_embalagem_disponiveis.length > 0;

  // ── LÓGICA 1: Encontrar o SKU que combina com a seleção atual ──
  const currentSku = useMemo<SkuVariacao | null>(() => {
    return (
      skusValidos.find(sku =>
        (!usaSabor || sku.sabor_id === (selectedValues.saborId ?? null)) &&
        (!usaTamanho || sku.tamanho_id === (selectedValues.tamanhoId ?? null)) &&
        (!usaEmbalagem || sku.tipo_embalagem_id === (selectedValues.embalagemId ?? null))
      ) ?? null
    );
  }, [selectedValues, skusValidos, usaSabor, usaTamanho, usaEmbalagem]);

  // ── LÓGICA 2: status de cada botão de opção ────────────────────
  // Status do botão = resultado mais provável ao clicar naquela opção.
  // Importante: encomenda continua clicável; indisponível/inexistente não.
  const optionStatuses = useMemo<OptionStatusMap>(() => {
    const sabor: Record<string, VariantOptionStatus> = {};
    const tamanho: Record<string, VariantOptionStatus> = {};
    const embalagem: Record<string, VariantOptionStatus> = {};

    for (const s of product.sabores_disponiveis) {
      const candidates = skusValidos.filter(sku =>
        sku.sabor_id === s.id &&
        (!usaTamanho || !selectedValues.tamanhoId || sku.tamanho_id === selectedValues.tamanhoId) &&
        (!usaEmbalagem || !selectedValues.embalagemId || sku.tipo_embalagem_id === selectedValues.embalagemId)
      );

      sabor[s.id] = getSkuStatus(
        pickBestSkuForOption(candidates, 'saborId', selectedValues)
      );
    }

    // Tamanho precisa ser livre: se existe qualquer SKU vendável daquele tamanho,
    // deixa clicar. O handleSelect abaixo resolve sabor/embalagem automaticamente.
    for (const t of product.tamanhos_disponiveis) {
      const candidates = skusValidos.filter(sku => sku.tamanho_id === t.id);

      tamanho[t.id] = getSkuStatus(
        pickBestSkuForOption(candidates, 'tamanhoId', selectedValues)
      );
    }

    // Embalagem respeita o tamanho atual, mas não prende no sabor atual.
    for (const e of product.tipos_embalagem_disponiveis) {
      const candidates = skusValidos.filter(sku =>
        sku.tipo_embalagem_id === e.id &&
        (!usaTamanho || !selectedValues.tamanhoId || sku.tamanho_id === selectedValues.tamanhoId)
      );

      embalagem[e.id] = getSkuStatus(
        pickBestSkuForOption(candidates, 'embalagemId', selectedValues)
      );
    }

    return { sabor, tamanho, embalagem };
  }, [
    product.sabores_disponiveis,
    product.tamanhos_disponiveis,
    product.tipos_embalagem_disponiveis,
    skusValidos,
    selectedValues,
    usaTamanho,
    usaEmbalagem,
  ]);

  const disponibilidade = useMemo<OptionAvailability>(() => {
    return {
      sabor: mapStatusToAvailability(optionStatuses.sabor),
      tamanho: mapStatusToAvailability(optionStatuses.tamanho),
      embalagem: mapStatusToAvailability(optionStatuses.embalagem),
    };
  }, [optionStatuses]);

  const visibleSabores = useMemo(() => {
    return product.sabores_disponiveis.filter(
      sabor => disponibilidade.sabor[sabor.id] ?? false
    );
  }, [product.sabores_disponiveis, disponibilidade.sabor]);

  // Se o sabor selecionado deixar de existir ao trocar tamanho/embalagem,
  // seleciona o primeiro sabor válido para a nova combinação.
  useEffect(() => {
    if (product.sabores_disponiveis.length === 0) return;

    const saborAtualAindaExiste = visibleSabores.some(
      sabor => sabor.id === selectedValues.saborId
    );

    if (saborAtualAindaExiste) return;

    const primeiroSaborVisivel = visibleSabores[0];
    if (!primeiroSaborVisivel) return;

    const timeoutId = window.setTimeout(() => {
      setSelectedValues(prev => ({
        ...prev,
        saborId: primeiroSaborVisivel.id,
      }));
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [
    product.sabores_disponiveis.length,
    selectedValues.saborId,
    visibleSabores,
  ]);

  // ── LÓGICA 3: Preço e status do CTA ─────────────────────────────
  const currentPrice = currentSku?.price ?? product.base_price;

  const statusCta: CtaStatus = !currentSku || !currentSku.available
    ? 'indisponivel'
    : currentSku.stock > 0
      ? 'comprar'
      : 'encomenda';

  const selectedSabor = product.sabores_disponiveis.find(s => s.id === selectedValues.saborId) ?? null;
  const selectedTamanho = product.tamanhos_disponiveis.find(t => t.id === selectedValues.tamanhoId) ?? null;
  const selectedEmbalagem = product.tipos_embalagem_disponiveis.find(e => e.id === selectedValues.embalagemId) ?? null;

  // ── Handler: ao clicar em uma opção ──────────────────────────
  const handleSelect = useCallback(
    (dimensao: VariantDimension, valueId: string) => {
      setSelectedValues(prev => {
        const next = { ...prev, [dimensao]: valueId };

        const exactSku = skusValidos.find(sku =>
          (!usaSabor || sku.sabor_id === (next.saborId ?? null)) &&
          (!usaTamanho || sku.tamanho_id === (next.tamanhoId ?? null)) &&
          (!usaEmbalagem || sku.tipo_embalagem_id === (next.embalagemId ?? null))
        );

        if (exactSku) return next;

        // Fallback inteligente:
        // Se a combinação exata não existir, pega um SKU vendável que tenha
        // a opção clicada e tenta preservar o máximo possível da seleção anterior.
        // Exemplo: clicar em 1,8kg mantendo sabor Neutro deve virar
        // 1,8kg + Refil + Neutro, e não bloquear porque antes estava em Pote.
        const candidates = skusValidos.filter(sku => {
          if (dimensao === 'saborId') return sku.sabor_id === valueId;
          if (dimensao === 'tamanhoId') return sku.tamanho_id === valueId;
          if (dimensao === 'embalagemId') return sku.tipo_embalagem_id === valueId;
          return false;
        });

        const fallbackSku = pickBestSkuForOption(candidates, dimensao, prev);
        if (!fallbackSku) return prev;

        return {
          saborId: fallbackSku.sabor_id ?? undefined,
          tamanhoId: fallbackSku.tamanho_id ?? undefined,
          embalagemId: fallbackSku.tipo_embalagem_id ?? undefined,
        };
      });
    },
    [skusValidos, usaSabor, usaTamanho, usaEmbalagem]
  );

  // ── Trocar a foto da galeria quando o SKU resolvido tiver imagem ──
  useEffect(() => {
    onImageChange?.(currentSku?.image_url ?? null);
    onVariantChange?.({ price: currentPrice, status: statusCta });
  }, [currentSku, currentPrice, statusCta, onImageChange, onVariantChange]);

  // ── Adicionar ao carrinho ──────────────────────────────────────
  const handleAddToCart = useCallback(() => {
    if (!currentSku || !currentSku.available || statusCta === 'indisponivel') return;

    addItem({
      skuId: currentSku.id,
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      brand: product.brand,
      imageUrl: currentSku.image_url,
      sabor: currentSku.sabores?.nome ?? selectedSabor?.nome ?? null,
      tamanho: currentSku.tamanhos?.nome ?? selectedTamanho?.nome ?? null,
      embalagem: currentSku.tipos_embalagem?.nome ?? selectedEmbalagem?.nome ?? null,
      unitPrice: currentPrice,
      stock: currentSku.stock,
      available: currentSku.available,
    });
  }, [
    addItem,
    currentSku,
    statusCta,
    product.id,
    product.slug,
    product.name,
    product.brand,
    selectedSabor?.nome,
    selectedTamanho?.nome,
    selectedEmbalagem?.nome,
    currentPrice,
  ]);

  const renderUnavailableLine = (isAvailable: boolean) => {
    if (isAvailable) return null;
    return <span className={styles.soldOutLine} aria-hidden="true" />;
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className={styles.selector}>

      {/* ── Grupo: Sabor ── */}
      {product.sabores_disponiveis.length > 0 && (
        <div className={styles.group}>
          <p className={styles.groupLabel}>
            Sabor:{' '}
            <strong className={styles.groupSelected}>
              {selectedSabor?.nome ?? ''}
            </strong>
          </p>

          <div className={styles.options} role="group" aria-label="Selecionar Sabor">
            {visibleSabores.map(sabor => {
              const isSelected = selectedValues.saborId === sabor.id;
              const status = optionStatuses.sabor[sabor.id] ?? 'unavailable';
              const isAvailable = disponibilidade.sabor[sabor.id] ?? false;
              const statusLabel = getOptionStatusLabel(status);

              return (
                <button
                  key={sabor.id}
                  type="button"
                  className={[
                    styles.optionBtn,
                    isAvailable && status === 'order' ? styles.optionBtnOrder : '',
                    isSelected ? styles.optionBtnActive : '',
                    !isAvailable ? styles.optionBtnDisabled : '',
                  ].join(' ')}
                  onClick={() => isAvailable && handleSelect('saborId', sabor.id)}
                  disabled={!isAvailable}
                  aria-pressed={isSelected}
                  aria-disabled={!isAvailable}
                  title={!isAvailable ? `${sabor.nome} — Combinação indisponível` : `${sabor.nome} — ${statusLabel}`}
                >
                  <span className={styles.optionName}>{sabor.nome}</span>
                  {renderUnavailableLine(isAvailable)}
                  <span className="sr-only">
                    {' '}({statusLabel})
                    {isSelected ? ' (Selecionado)' : ''}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Grupo: Tamanho ── */}
      {product.tamanhos_disponiveis.length > 0 && (
        <div className={styles.group}>
          <p className={styles.groupLabel}>
            Tamanho:{' '}
            <strong className={styles.groupSelected}>
              {selectedTamanho?.nome ?? ''}
            </strong>
          </p>

          <div className={styles.options} role="group" aria-label="Selecionar Tamanho">
            {product.tamanhos_disponiveis.map(tamanho => {
              const isSelected = selectedValues.tamanhoId === tamanho.id;
              const status = optionStatuses.tamanho[tamanho.id] ?? 'unavailable';
              const isAvailable = disponibilidade.tamanho[tamanho.id] ?? false;
              const statusLabel = getOptionStatusLabel(status);

              return (
                <button
                  key={tamanho.id}
                  type="button"
                  className={[
                    styles.optionBtn,
                    isAvailable && status === 'order' ? styles.optionBtnOrder : '',
                    isSelected ? styles.optionBtnActive : '',
                    !isAvailable ? styles.optionBtnDisabled : '',
                  ].join(' ')}
                  onClick={() => isAvailable && handleSelect('tamanhoId', tamanho.id)}
                  disabled={!isAvailable}
                  aria-pressed={isSelected}
                  aria-disabled={!isAvailable}
                  title={!isAvailable ? `${tamanho.nome} — Combinação indisponível` : `${tamanho.nome} — ${statusLabel}`}
                >
                  <span className={styles.optionName}>{tamanho.nome}</span>
                  {renderUnavailableLine(isAvailable)}
                  <span className="sr-only">
                    {' '}({statusLabel})
                    {isSelected ? ' (Selecionado)' : ''}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Grupo: Embalagem ── */}
      {product.tipos_embalagem_disponiveis.length > 0 && (
        <div className={styles.group}>
          <p className={styles.groupLabel}>
            Embalagem:{' '}
            <strong className={styles.groupSelected}>
              {selectedEmbalagem?.nome ?? ''}
            </strong>
          </p>

          <div className={styles.options} role="group" aria-label="Selecionar Embalagem">
            {product.tipos_embalagem_disponiveis.map(embalagem => {
              const isSelected = selectedValues.embalagemId === embalagem.id;
              const status = optionStatuses.embalagem[embalagem.id] ?? 'unavailable';
              const isAvailable = disponibilidade.embalagem[embalagem.id] ?? false;
              const statusLabel = getOptionStatusLabel(status);

              return (
                <button
                  key={embalagem.id}
                  type="button"
                  className={[
                    styles.optionBtn,
                    isAvailable && status === 'order' ? styles.optionBtnOrder : '',
                    isSelected ? styles.optionBtnActive : '',
                    !isAvailable ? styles.optionBtnDisabled : '',
                  ].join(' ')}
                  onClick={() => isAvailable && handleSelect('embalagemId', embalagem.id)}
                  disabled={!isAvailable}
                  aria-pressed={isSelected}
                  aria-disabled={!isAvailable}
                  title={!isAvailable ? `${embalagem.nome} — Combinação indisponível` : `${embalagem.nome} — ${statusLabel}`}
                >
                  <span className={styles.optionName}>{embalagem.nome}</span>
                  {renderUnavailableLine(isAvailable)}
                  <span className="sr-only">
                    {' '}({statusLabel})
                    {isSelected ? ' (Selecionado)' : ''}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {statusCta === 'indisponivel' && (
        <div className={styles.selectionSummary}>
          <span className={styles.badgeSoldOut}>Combinação Indisponível</span>
        </div>
      )}

      {/* ── CTA Carrinho ── */}
      <button
        type="button"
        className={[
          styles.ctaBtn,
          statusCta === 'encomenda' ? styles.ctaBtnOrder : '',
          statusCta === 'indisponivel' ? styles.ctaBtnDisabled : '',
        ].join(' ')}
        aria-disabled={statusCta === 'indisponivel'}
        disabled={statusCta === 'indisponivel'}
        onClick={handleAddToCart}
      >
        {statusCta === 'comprar' && (
          <>
            <i className="fa-solid fa-cart-plus" aria-hidden="true" />
            Adicionar ao carrinho
          </>
        )}
        {statusCta === 'encomenda' && (
          <>
            <i className="fa-solid fa-box-open" aria-hidden="true" />
            Adicionar como encomenda
          </>
        )}
        {statusCta === 'indisponivel' && (
          <>❌ Combinação Indisponível</>
        )}
      </button>

      {/* Mensagens de auxílio */}
      {statusCta === 'comprar' && (
        <p className={styles.helpText}>
          Esse item será adicionado ao carrinho como pronta entrega.
        </p>
      )}
      {statusCta === 'encomenda' && (
        <p className={styles.helpText}>
          Esse item será adicionado ao carrinho como encomenda.
        </p>
      )}
      {statusCta === 'indisponivel' && (
        <p className={styles.helpText}>
          Tente outra combinação de sabor / tamanho / embalagem.
        </p>
      )}
    </div>
  );
}
