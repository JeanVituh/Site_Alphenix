'use client';
// ================================================================
//  ALPHENIX — VariantSelector (components/VariantSelector.tsx)
//
//  Regra:
//  - stock > 0                         → pronta entrega
//  - stock = 0 e available = true      → sob encomenda
//  - available = false                 → indisponível
//  - sem SKU correspondente            → combinação inexistente
// ================================================================

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useCart } from '@/components/cart/CartContext';
import type {
  ProductWithVariants,
  SelectedValues,
  SkuVariacao,
  CtaStatus,
} from '@/lib/types';
import styles from './VariantSelector.module.css';

interface VariantSelectorProps {
  product: ProductWithVariants;
  /** Chamado quando o SKU resolvido tem uma imagem específica. */
  onImageChange?: (imageUrl: string | null) => void;
  /** Informa o preço/status atual para o ProductHero controlar o preço de cima. */
  onVariantChange?: (data: { price: number; status: CtaStatus }) => void;
}

type AvailabilityMode = 'ready' | 'order';
type VariantDimension = keyof SelectedValues;

function getSellableSkus(product: ProductWithVariants): SkuVariacao[] {
  return product.skus_variacoes.filter(sku => sku.available);
}

function isSkuInMode(sku: SkuVariacao, mode: AvailabilityMode): boolean {
  if (!sku.available) return false;
  return mode === 'ready' ? sku.stock > 0 : sku.stock === 0;
}

function getInitialAvailability(product: ProductWithVariants): AvailabilityMode {
  const skus = getSellableSkus(product);
  return skus.some(sku => sku.stock > 0) ? 'ready' : 'order';
}

function getPreferredSku(
  product: ProductWithVariants,
  skus: SkuVariacao[]
): SkuVariacao | null {
  return [...skus].sort((a, b) => {
    const priceA = a.price ?? product.base_price;
    const priceB = b.price ?? product.base_price;
    const priceDiff = priceA - priceB;
    if (priceDiff !== 0) return priceDiff;

    const aIsPote = a.tipos_embalagem?.nome === 'Pote';
    const bIsPote = b.tipos_embalagem?.nome === 'Pote';
    return Number(bIsPote) - Number(aIsPote);
  })[0] ?? null;
}

function selectionFromSku(sku: SkuVariacao | null): SelectedValues {
  if (!sku) return {};

  return {
    saborId: sku.sabor_id ?? undefined,
    tamanhoId: sku.tamanho_id ?? undefined,
    embalagemId: sku.tipo_embalagem_id ?? undefined,
  };
}

function buildInitialSelection(product: ProductWithVariants): SelectedValues {
  const mode = getInitialAvailability(product);
  const skusDoModo = getSellableSkus(product).filter(sku => isSkuInMode(sku, mode));
  return selectionFromSku(getPreferredSku(product, skusDoModo));
}

function skuMatchesSelection(
  sku: SkuVariacao,
  selectedValues: SelectedValues,
  usaSabor: boolean,
  usaTamanho: boolean,
  usaEmbalagem: boolean
): boolean {
  return (
    (!usaSabor || sku.sabor_id === (selectedValues.saborId ?? null)) &&
    (!usaTamanho || sku.tamanho_id === (selectedValues.tamanhoId ?? null)) &&
    (!usaEmbalagem || sku.tipo_embalagem_id === (selectedValues.embalagemId ?? null))
  );
}

/**
 * Entre os candidatos válidos, tenta preservar as escolhas atuais. Isso evita
 * trocar sabor/tamanho sem necessidade quando o usuário muda uma dimensão.
 */
function pickSkuPreservingSelection(
  product: ProductWithVariants,
  candidates: SkuVariacao[],
  selectedValues: SelectedValues
): SkuVariacao | null {
  if (!candidates.length) return null;

  const scored = candidates.map((sku, index) => {
    let score = 0;
    if (selectedValues.embalagemId && sku.tipo_embalagem_id === selectedValues.embalagemId) score += 100;
    if (selectedValues.tamanhoId && sku.tamanho_id === selectedValues.tamanhoId) score += 80;
    if (selectedValues.saborId && sku.sabor_id === selectedValues.saborId) score += 60;
    return { sku, score, index };
  });

  const bestScore = Math.max(...scored.map(item => item.score));
  const bestCandidates = scored
    .filter(item => item.score === bestScore)
    .sort((a, b) => a.index - b.index)
    .map(item => item.sku);

  return getPreferredSku(product, bestCandidates);
}

export function VariantSelector({
  product,
  onImageChange,
  onVariantChange,
}: VariantSelectorProps) {
  const { addItem } = useCart();
  const skusValidos = useMemo(() => getSellableSkus(product), [product]);

  const readySkus = useMemo(
    () => skusValidos.filter(sku => isSkuInMode(sku, 'ready')),
    [skusValidos]
  );
  const orderSkus = useMemo(
    () => skusValidos.filter(sku => isSkuInMode(sku, 'order')),
    [skusValidos]
  );

  const hasReadySkus = readySkus.length > 0;
  const hasOrderSkus = orderSkus.length > 0;

  const [availabilityMode, setAvailabilityMode] = useState<AvailabilityMode>(
    () => getInitialAvailability(product)
  );
  const [selectedValues, setSelectedValues] = useState<SelectedValues>(
    () => buildInitialSelection(product)
  );
  const [quantity, setQuantity] = useState(1);

  const usaSabor = product.sabores_disponiveis.length > 0;
  const usaTamanho = product.tamanhos_disponiveis.length > 0;
  const usaEmbalagem = product.tipos_embalagem_disponiveis.length > 0;

  const skusDoModo = availabilityMode === 'ready' ? readySkus : orderSkus;

  const currentSku = useMemo<SkuVariacao | null>(() => {
    return skusDoModo.find(sku =>
      skuMatchesSelection(
        sku,
        selectedValues,
        usaSabor,
        usaTamanho,
        usaEmbalagem
      )
    ) ?? null;
  }, [skusDoModo, selectedValues, usaSabor, usaTamanho, usaEmbalagem]);

  // Ordem progressiva: disponibilidade → embalagem → tamanho → sabor.
  const visibleEmbalagens = useMemo(() => {
    return product.tipos_embalagem_disponiveis.filter(embalagem =>
      skusDoModo.some(sku => sku.tipo_embalagem_id === embalagem.id)
    );
  }, [product.tipos_embalagem_disponiveis, skusDoModo]);

  const visibleTamanhos = useMemo(() => {
    return product.tamanhos_disponiveis.filter(tamanho =>
      skusDoModo.some(sku =>
        sku.tamanho_id === tamanho.id &&
        (!usaEmbalagem || sku.tipo_embalagem_id === (selectedValues.embalagemId ?? null))
      )
    );
  }, [
    product.tamanhos_disponiveis,
    skusDoModo,
    usaEmbalagem,
    selectedValues.embalagemId,
  ]);

  const visibleSabores = useMemo(() => {
    return product.sabores_disponiveis.filter(sabor =>
      skusDoModo.some(sku =>
        sku.sabor_id === sabor.id &&
        (!usaEmbalagem || sku.tipo_embalagem_id === (selectedValues.embalagemId ?? null)) &&
        (!usaTamanho || sku.tamanho_id === (selectedValues.tamanhoId ?? null))
      )
    );
  }, [
    product.sabores_disponiveis,
    skusDoModo,
    usaEmbalagem,
    usaTamanho,
    selectedValues.embalagemId,
    selectedValues.tamanhoId,
  ]);

  const currentPrice = currentSku?.price ?? product.base_price;

  const statusCta: CtaStatus = !currentSku || !currentSku.available
    ? 'indisponivel'
    : currentSku.stock > 0
      ? 'comprar'
      : 'encomenda';

  const selectedSabor = product.sabores_disponiveis.find(
    sabor => sabor.id === selectedValues.saborId
  ) ?? null;
  const selectedTamanho = product.tamanhos_disponiveis.find(
    tamanho => tamanho.id === selectedValues.tamanhoId
  ) ?? null;
  const selectedEmbalagem = product.tipos_embalagem_disponiveis.find(
    embalagem => embalagem.id === selectedValues.embalagemId
  ) ?? null;

  const maxQuantity = statusCta === 'comprar' && currentSku?.stock
    ? Math.max(1, currentSku.stock)
    : 99;

  const canDecreaseQuantity = statusCta !== 'indisponivel' && quantity > 1;
  const canIncreaseQuantity = statusCta !== 'indisponivel' && quantity < maxQuantity;

  const clampQuantity = useCallback((value: number) => {
    if (!Number.isFinite(value)) return 1;
    return Math.min(maxQuantity, Math.max(1, Math.floor(value)));
  }, [maxQuantity]);

  const handleAvailabilityChange = useCallback((mode: AvailabilityMode) => {
    if (mode === availabilityMode) return;
    if (mode === 'ready' && !hasReadySkus) return;
    if (mode === 'order' && !hasOrderSkus) return;

    const targetSkus = mode === 'ready' ? readySkus : orderSkus;
    const sameCombination = targetSkus.find(sku =>
      skuMatchesSelection(
        sku,
        selectedValues,
        usaSabor,
        usaTamanho,
        usaEmbalagem
      )
    );
    const nextSku = sameCombination ?? getPreferredSku(product, targetSkus);

    setQuantity(1);
    setAvailabilityMode(mode);
    setSelectedValues(selectionFromSku(nextSku));
  }, [
    availabilityMode,
    hasReadySkus,
    hasOrderSkus,
    readySkus,
    orderSkus,
    selectedValues,
    usaSabor,
    usaTamanho,
    usaEmbalagem,
    product,
  ]);

  const handleSelect = useCallback((dimensao: VariantDimension, valueId: string) => {
    setQuantity(1);
    setSelectedValues(prev => {
      const next = { ...prev, [dimensao]: valueId };

      const candidates = skusDoModo.filter(sku => {
        if (dimensao === 'embalagemId') {
          return sku.tipo_embalagem_id === valueId;
        }

        if (dimensao === 'tamanhoId') {
          return (
            sku.tamanho_id === valueId &&
            (!usaEmbalagem || sku.tipo_embalagem_id === (next.embalagemId ?? null))
          );
        }

        return (
          sku.sabor_id === valueId &&
          (!usaEmbalagem || sku.tipo_embalagem_id === (next.embalagemId ?? null)) &&
          (!usaTamanho || sku.tamanho_id === (next.tamanhoId ?? null))
        );
      });

      const exactSku = candidates.find(sku =>
        skuMatchesSelection(sku, next, usaSabor, usaTamanho, usaEmbalagem)
      );
      const fallbackSku = exactSku ?? pickSkuPreservingSelection(product, candidates, next);

      return fallbackSku ? selectionFromSku(fallbackSku) : prev;
    });
  }, [skusDoModo, usaSabor, usaTamanho, usaEmbalagem, product]);

  // Mantém preço, imagem, SKU e status sincronizados com a combinação resolvida.
  useEffect(() => {
    onImageChange?.(currentSku?.image_url ?? null);
    onVariantChange?.({ price: currentPrice, status: statusCta });
  }, [currentSku, currentPrice, statusCta, onImageChange, onVariantChange]);

  const handleAddToCart = useCallback(() => {
    if (!currentSku || !currentSku.available || statusCta === 'indisponivel') return;

    const added = addItem({
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
      quantity,
    });

    if (added) setQuantity(1);
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
    quantity,
  ]);

  return (
    <div className={styles.selector}>
      {/* ── 1. Disponibilidade ── */}
      <div className={styles.group}>
        <p className={styles.groupLabel}>Disponibilidade</p>

        <div
          className={styles.availabilityOptions}
          role="group"
          aria-label="Selecionar disponibilidade"
        >
          <button
            type="button"
            className={[
              styles.availabilityBtn,
              styles.availabilityBtnReady,
              availabilityMode === 'ready' ? styles.availabilityBtnActive : '',
            ].join(' ')}
            onClick={() => handleAvailabilityChange('ready')}
            disabled={!hasReadySkus}
            aria-pressed={availabilityMode === 'ready'}
            title={hasReadySkus ? 'Ver combinações à pronta entrega' : 'Sem combinações à pronta entrega'}
          >
            Pronta entrega
          </button>

          <button
            type="button"
            className={[
              styles.availabilityBtn,
              styles.availabilityBtnOrder,
              availabilityMode === 'order' ? styles.availabilityBtnActive : '',
            ].join(' ')}
            onClick={() => handleAvailabilityChange('order')}
            disabled={!hasOrderSkus}
            aria-pressed={availabilityMode === 'order'}
            title={hasOrderSkus ? 'Ver combinações sob encomenda' : 'Sem combinações sob encomenda'}
          >
            Sob encomenda
          </button>
        </div>
      </div>

      {/* ── 2. Embalagem ── */}
      {usaEmbalagem && (
        <div className={styles.group}>
          <p className={styles.groupLabel}>
            Embalagem:{' '}
            <strong className={styles.groupSelected}>
              {selectedEmbalagem?.nome ?? ''}
            </strong>
          </p>

          <div className={styles.options} role="group" aria-label="Selecionar Embalagem">
            {visibleEmbalagens.map(embalagem => {
              const isSelected = selectedValues.embalagemId === embalagem.id;

              return (
                <button
                  key={embalagem.id}
                  type="button"
                  className={[
                    styles.optionBtn,
                    isSelected ? styles.optionBtnActive : '',
                  ].join(' ')}
                  onClick={() => handleSelect('embalagemId', embalagem.id)}
                  aria-pressed={isSelected}
                >
                  <span className={styles.optionName}>{embalagem.nome}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 3. Tamanho ── */}
      {usaTamanho && (
        <div className={styles.group}>
          <p className={styles.groupLabel}>
            Tamanho:{' '}
            <strong className={styles.groupSelected}>
              {selectedTamanho?.nome ?? ''}
            </strong>
          </p>

          <div className={styles.options} role="group" aria-label="Selecionar Tamanho">
            {visibleTamanhos.map(tamanho => {
              const isSelected = selectedValues.tamanhoId === tamanho.id;

              return (
                <button
                  key={tamanho.id}
                  type="button"
                  className={[
                    styles.optionBtn,
                    isSelected ? styles.optionBtnActive : '',
                  ].join(' ')}
                  onClick={() => handleSelect('tamanhoId', tamanho.id)}
                  aria-pressed={isSelected}
                >
                  <span className={styles.optionName}>{tamanho.nome}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 4. Sabor ── */}
      {usaSabor && (
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

              return (
                <button
                  key={sabor.id}
                  type="button"
                  className={[
                    styles.optionBtn,
                    isSelected ? styles.optionBtnActive : '',
                  ].join(' ')}
                  onClick={() => handleSelect('saborId', sabor.id)}
                  aria-pressed={isSelected}
                >
                  <span className={styles.optionName}>{sabor.nome}</span>
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

      {/* ── Quantidade ── */}
      <div className={styles.quantitySection}>
        <label className={styles.quantityLabel} htmlFor="product-quantity">
          Quantidade
        </label>

        <div className={styles.quantityControl}>
          <button
            type="button"
            className={styles.quantityButton}
            onClick={() => setQuantity(value => clampQuantity(value - 1))}
            disabled={!canDecreaseQuantity}
            aria-label="Diminuir quantidade"
          >
            <i className="fa-solid fa-minus" aria-hidden="true" />
          </button>

          <input
            id="product-quantity"
            className={styles.quantityInput}
            type="number"
            inputMode="numeric"
            min={1}
            max={maxQuantity}
            value={quantity}
            onChange={(event) => setQuantity(clampQuantity(Number(event.target.value)))}
            disabled={statusCta === 'indisponivel'}
            aria-label="Quantidade do produto"
          />

          <button
            type="button"
            className={styles.quantityButton}
            onClick={() => setQuantity(value => clampQuantity(value + 1))}
            disabled={!canIncreaseQuantity}
            aria-label="Aumentar quantidade"
          >
            <i className="fa-solid fa-plus" aria-hidden="true" />
          </button>
        </div>
      </div>

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
