'use client';
// ================================================================
//  ALPHENIX — VariantSelector (components/VariantSelector.tsx)
//
//  Client Component responsável pela seleção interativa de variações.
//
//  Lógica central:
//  ┌─────────────────────────────────────────────────────────────┐
//  │  selectedValues  → Record<optionTypeId, optionValueId>      │
//  │  currentSku      → useMemo: acha o SKU da seleção atual     │
//  │  optionAvailability → useMemo: calcula quais botões ficam   │
//  │                     desabilitados com base na MATRIZ        │
//  └─────────────────────────────────────────────────────────────┘
// ================================================================

import { useState, useMemo, useCallback } from 'react';
import type {
  ProductWithVariants,
  SelectedValues,
  OptionAvailabilityMap,
  SKU,
} from '@/lib/types';
import styles from './VariantSelector.module.css';

// ── Props ────────────────────────────────────────────────────────
interface VariantSelectorProps {
  product:          ProductWithVariants;
  whatsappNumber:   string;
  /** Chamado quando um sabor com imagem é selecionado. */
  onImageChange?:   (imageUrl: string) => void;
}


// ── Helpers ──────────────────────────────────────────────────────

/**
 * Monta a seleção inicial: primeiro option_value de cada option_type.
 */
function buildInitialSelection(product: ProductWithVariants): SelectedValues {
  const initial: SelectedValues = {};
  for (const optionType of product.option_types) {
    if (optionType.option_values.length > 0) {
      initial[optionType.id] = optionType.option_values[0].id;
    }
  }
  return initial;
}

/**
 * Formata preço no padrão brasileiro.
 */
function formatPrice(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}


// ── Componente Principal ─────────────────────────────────────────
export function VariantSelector({
  product,
  whatsappNumber,
  onImageChange,
}: VariantSelectorProps) {

  // ── Estado: valores selecionados por optionTypeId ────────────
  const [selectedValues, setSelectedValues] = useState<SelectedValues>(
    () => buildInitialSelection(product)
  );


  // ── LÓGICA 1: Encontrar o SKU atual ──────────────────────────
  // useMemo só recalcula quando selectedValues ou skus mudam.
  const currentSku = useMemo<SKU | null>(() => {
    const selectedIds = Object.values(selectedValues);

    // Precisa ter uma seleção para cada dimensão
    if (selectedIds.length !== product.option_types.length) return null;

    return (
      product.skus.find(sku => {
        const skuValueIds = new Set(
          sku.sku_option_values.map(sov => sov.option_value_id)
        );
        // O SKU precisa conter TODOS os valores selecionados
        return selectedIds.every(id => skuValueIds.has(id));
      }) ?? null
    );
  }, [selectedValues, product.skus, product.option_types.length]);


  // ── LÓGICA 2: Calcular disponibilidade por opção ─────────────
  // ⭐ Esta é a lógica central da Matriz de SKUs.
  //
  // Para cada option_value de cada option_type, verificamos:
  //   "Se eu selecionar ESTE valor, existe algum SKU disponível
  //    que combine ELE com os demais valores JÁ SELECIONADOS?"
  //
  // Se a resposta for NÃO → botão desabilitado (sem estoque naquela combo)
  // Se a resposta for SIM → botão habilitado
  const optionAvailability = useMemo<OptionAvailabilityMap>(() => {
    const result: OptionAvailabilityMap = {};

    for (const optionType of product.option_types) {
      result[optionType.id] = {};

      for (const value of optionType.option_values) {
        // Simular: "e se eu clicar neste valor?"
        const testSelection: SelectedValues = {
          ...selectedValues,
          [optionType.id]: value.id,
        };
        const testIds = Object.values(testSelection);

        // Existe ao menos 1 SKU com stock > 0 que contém todos os testIds?
        const hasAvailableSku = product.skus.some(sku => {
          if (!sku.available) return false; // stock = 0
          const skuValueIds = new Set(
            sku.sku_option_values.map(sov => sov.option_value_id)
          );
          return testIds.every(id => skuValueIds.has(id));
        });

        result[optionType.id][value.id] = hasAvailableSku;
      }
    }

    return result;
  }, [selectedValues, product.skus, product.option_types]);


  // ── LÓGICA 3: Preço e status de estoque ──────────────────────
  const currentPrice   = currentSku?.price ?? product.base_price;
  const isInStock      = (currentSku?.stock ?? 0) > 0;
  const noneAvailable  = !product.skus.some(s => s.available);


  // ── Handler: ao clicar em uma opção ──────────────────────────
  const handleSelect = useCallback(
    (optionTypeId: string, valueId: string, imageUrl?: string | null) => {
      setSelectedValues(prev => ({ ...prev, [optionTypeId]: valueId }));

      // Notificar o pai sobre mudança de imagem (ex: trocar foto do sabor)
      if (imageUrl && onImageChange) {
        onImageChange(imageUrl);
      }
    },
    [onImageChange]
  );


  // ── Montar mensagem do WhatsApp com as seleções ───────────────
  const whatsappUrl = useMemo(() => {
    const selectionLines = product.option_types.map(ot => {
      const valueId = selectedValues[ot.id];
      const value   = ot.option_values.find(v => v.id === valueId);
      return `${ot.label}: *${value?.label ?? '—'}*`;
    });

    const lines = [
      'Olá! Tenho interesse no produto:',
      '',
      `*${product.name} — ${product.brand}*`,
      ...selectionLines,
      `Preço: *${formatPrice(currentPrice)}*`,
      '',
      'Poderia me passar mais informações? 🙏',
    ];

    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
      lines.join('\n')
    )}`;
  }, [selectedValues, product, currentPrice, whatsappNumber]);


  // ── Render ────────────────────────────────────────────────────
  return (
    <div className={styles.selector}>

      {/* ── Grupos de variações ── */}
      {product.option_types.map(optionType => {
        const selectedValueId    = selectedValues[optionType.id];
        const selectedValueLabel = optionType.option_values.find(
          v => v.id === selectedValueId
        )?.label ?? '';

        return (
          <div key={optionType.id} className={styles.group}>
            <p className={styles.groupLabel}>
              {optionType.label}:{' '}
              <strong className={styles.groupSelected}>
                {selectedValueLabel}
              </strong>
            </p>

            <div
              className={styles.options}
              role="group"
              aria-label={`Selecionar ${optionType.label}`}
            >
              {optionType.option_values.map(value => {
                const isSelected  = selectedValues[optionType.id] === value.id;
                const isAvailable = optionAvailability[optionType.id]?.[value.id] ?? false;

                return (
                  <button
                    key={value.id}
                    type="button"
                    className={[
                      styles.optionBtn,
                      isSelected  ? styles.optionBtnActive    : '',
                      !isAvailable ? styles.optionBtnDisabled : '',
                    ].join(' ')}
                    onClick={() =>
                      isAvailable &&
                      handleSelect(optionType.id, value.id, value.image_url)
                    }
                    disabled={!isAvailable}
                    aria-pressed={isSelected}
                    aria-disabled={!isAvailable}
                    title={!isAvailable ? `${value.label} — Esgotado` : value.label}
                  >
                    {value.label}
                    {/* Linha diagonal para indicar esgotado */}
                    {!isAvailable && (
                      <span className={styles.soldOutLine} aria-hidden="true" />
                    )}
                    <span className="sr-only">
                      {!isAvailable ? ' (Esgotado)' : ''}
                      {isSelected   ? ' (Selecionado)' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}


      {/* ── Preço atual (atualiza conforme seleção) ── */}
      <div className={styles.priceRow}>
        <span className={styles.price}>{formatPrice(currentPrice)}</span>
        {!isInStock && !noneAvailable && (
          <span className={styles.badgeSoldOut}>Esgotado</span>
        )}
        {noneAvailable && (
          <span className={styles.badgeSoldOut}>Produto Esgotado</span>
        )}
      </div>


      {/* ── CTA WhatsApp ── */}
      <a
        href={isInStock ? whatsappUrl : undefined}
        className={[
          styles.ctaBtn,
          !isInStock ? styles.ctaBtnDisabled : '',
        ].join(' ')}
        target={isInStock ? '_blank' : undefined}
        rel="noopener noreferrer"
        role="button"
        aria-disabled={!isInStock}
        onClick={e => {
          if (!isInStock) e.preventDefault();
        }}
      >
        {isInStock ? (
          <>
            <WhatsAppIcon />
            Pedir pelo WhatsApp
          </>
        ) : (
          <>❌ Combinação Esgotada</>
        )}
      </a>

      {/* Mensagem de auxílio quando esgotado */}
      {!isInStock && !noneAvailable && (
        <p className={styles.helpText}>
          Tente outra combinação de sabor / tamanho / embalagem.
        </p>
      )}
    </div>
  );
}


// ── Ícone WhatsApp inline (sem dependência externa) ──────────────
function WhatsAppIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.558 4.121 1.533 5.849L.053 23.63a.749.749 0 0 0 .918.918l5.782-1.48A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.851 0-3.587-.5-5.082-1.373l-.362-.214-3.754.96.976-3.67-.233-.378A9.953 9.953 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
    </svg>
  );
}
