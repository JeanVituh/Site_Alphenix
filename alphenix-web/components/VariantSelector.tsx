'use client';
// ================================================================
//  ALPHENIX — VariantSelector (components/VariantSelector.tsx)
//  v3: seleção de SKU + adicionar ao carrinho
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

  const firstSku =
    skusValidos.find(sku => sku.stock > 0) ??
    skusValidos[0] ??
    null;

  if (firstSku) {
    return {
      saborId: firstSku.sabor_id ?? undefined,
      tamanhoId: firstSku.tamanho_id ?? undefined,
      embalagemId: firstSku.tipo_embalagem_id ?? undefined,
    };
  }

  return {};
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

  // ── LÓGICA 2: Disponibilidade de cada botão de opção ───────────
  // Botão habilitado = existe SKU vendável para aquela combinação.
  // Isso independe do estoque: stock=0 continua habilitado e vira encomenda.
  const disponibilidade = useMemo<OptionAvailability>(() => {
    const sabor: Record<string, boolean> = {};
    const tamanho: Record<string, boolean> = {};
    const embalagem: Record<string, boolean> = {};

    for (const s of product.sabores_disponiveis) {
      sabor[s.id] = skusValidos.some(sku =>
        sku.sabor_id === s.id &&
        (!usaTamanho || !selectedValues.tamanhoId || sku.tamanho_id === selectedValues.tamanhoId) &&
        (!usaEmbalagem || !selectedValues.embalagemId || sku.tipo_embalagem_id === selectedValues.embalagemId)
      );
    }

    for (const t of product.tamanhos_disponiveis) {
      tamanho[t.id] = skusValidos.some(sku =>
        sku.tamanho_id === t.id &&
        (!usaSabor || !selectedValues.saborId || sku.sabor_id === selectedValues.saborId) &&
        (!usaEmbalagem || !selectedValues.embalagemId || sku.tipo_embalagem_id === selectedValues.embalagemId)
      );
    }

    for (const e of product.tipos_embalagem_disponiveis) {
      embalagem[e.id] = skusValidos.some(sku =>
        sku.tipo_embalagem_id === e.id &&
        (!usaSabor || !selectedValues.saborId || sku.sabor_id === selectedValues.saborId) &&
        (!usaTamanho || !selectedValues.tamanhoId || sku.tamanho_id === selectedValues.tamanhoId)
      );
    }

    return { sabor, tamanho, embalagem };
  }, [
    product.sabores_disponiveis,
    product.tamanhos_disponiveis,
    product.tipos_embalagem_disponiveis,
    skusValidos,
    selectedValues.saborId,
    selectedValues.tamanhoId,
    selectedValues.embalagemId,
    usaSabor,
    usaTamanho,
    usaEmbalagem,
  ]);

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

    setSelectedValues(prev => ({
      ...prev,
      saborId: primeiroSaborVisivel.id,
    }));
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
    (dimensao: keyof SelectedValues, valueId: string) => {
      setSelectedValues(prev => {
        const next = { ...prev, [dimensao]: valueId };

        const exactSku = skusValidos.find(sku =>
          (!usaSabor || sku.sabor_id === (next.saborId ?? null)) &&
          (!usaTamanho || sku.tamanho_id === (next.tamanhoId ?? null)) &&
          (!usaEmbalagem || sku.tipo_embalagem_id === (next.embalagemId ?? null))
        );

        if (exactSku) return next;

        // Fallback: se a nova combinação exata não existir, cai para um SKU
        // vendável que tenha o valor clicado. Isso evita seleção quebrada.
        const fallbackSku = skusValidos.find(sku => {
          if (dimensao === 'saborId') return sku.sabor_id === valueId;
          if (dimensao === 'tamanhoId') return sku.tamanho_id === valueId;
          if (dimensao === 'embalagemId') return sku.tipo_embalagem_id === valueId;
          return false;
        });

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
              const isAvailable = disponibilidade.sabor[sabor.id] ?? false;

              return (
                <button
                  key={sabor.id}
                  type="button"
                  className={[
                    styles.optionBtn,
                    isSelected ? styles.optionBtnActive : '',
                    !isAvailable ? styles.optionBtnDisabled : '',
                  ].join(' ')}
                  onClick={() => isAvailable && handleSelect('saborId', sabor.id)}
                  disabled={!isAvailable}
                  aria-pressed={isSelected}
                  aria-disabled={!isAvailable}
                  title={!isAvailable ? `${sabor.nome} — Combinação indisponível` : sabor.nome}
                >
                  {sabor.nome}
                  {!isAvailable && <span className={styles.soldOutLine} aria-hidden="true" />}
                  <span className="sr-only">
                    {!isAvailable ? ' (Indisponível)' : ''}
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
              const isAvailable = disponibilidade.tamanho[tamanho.id] ?? false;

              return (
                <button
                  key={tamanho.id}
                  type="button"
                  className={[
                    styles.optionBtn,
                    isSelected ? styles.optionBtnActive : '',
                    !isAvailable ? styles.optionBtnDisabled : '',
                  ].join(' ')}
                  onClick={() => isAvailable && handleSelect('tamanhoId', tamanho.id)}
                  disabled={!isAvailable}
                  aria-pressed={isSelected}
                  aria-disabled={!isAvailable}
                  title={!isAvailable ? `${tamanho.nome} — Combinação indisponível` : tamanho.nome}
                >
                  {tamanho.nome}
                  {!isAvailable && <span className={styles.soldOutLine} aria-hidden="true" />}
                  <span className="sr-only">
                    {!isAvailable ? ' (Indisponível)' : ''}
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
              const isAvailable = disponibilidade.embalagem[embalagem.id] ?? false;

              return (
                <button
                  key={embalagem.id}
                  type="button"
                  className={[
                    styles.optionBtn,
                    isSelected ? styles.optionBtnActive : '',
                    !isAvailable ? styles.optionBtnDisabled : '',
                  ].join(' ')}
                  onClick={() => isAvailable && handleSelect('embalagemId', embalagem.id)}
                  disabled={!isAvailable}
                  aria-pressed={isSelected}
                  aria-disabled={!isAvailable}
                  title={!isAvailable ? `${embalagem.nome} — Combinação indisponível` : embalagem.nome}
                >
                  {embalagem.nome}
                  {!isAvailable && <span className={styles.soldOutLine} aria-hidden="true" />}
                  <span className="sr-only">
                    {!isAvailable ? ' (Indisponível)' : ''}
                    {isSelected ? ' (Selecionado)' : ''}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {statusCta !== 'indisponivel' && (
        <div className={styles.priceRow}>
          <span className={statusCta === 'comprar' ? styles.badgeReady : styles.badgeOrder}>
            {statusCta === 'comprar' ? 'Pronta entrega' : 'Encomenda'}
          </span>
          <span className={styles.priceHint}>{formatPrice(currentPrice)}</span>
        </div>
      )}

      {statusCta === 'indisponivel' && (
        <div className={styles.priceRow}>
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
          Esse item entra no carrinho como pronta entrega. Você finaliza tudo pelo WhatsApp no carrinho.
        </p>
      )}
      {statusCta === 'encomenda' && (
        <p className={styles.helpText}>
          Esse item está sem estoque agora, mas pode entrar como encomenda e será separado na mensagem do WhatsApp.
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
