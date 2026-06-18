'use client';
// ================================================================
//  ALPHENIX — VariantSelector (components/VariantSelector.tsx)
//  v2: modelo relacional (sabores / tamanhos / tipos_embalagem)
//
//  Client Component responsável pela seleção interativa de variações.
//
//  Lógica central:
//  ┌─────────────────────────────────────────────────────────────┐
//  │  selectedValues  → { saborId?, tamanhoId?, embalagemId? }    │
//  │  currentSku      → useMemo: acha a linha de skus_variacoes  │
//  │                     que combina exatamente com a seleção     │
//  │  disponibilidade → useMemo: para cada botão, existe ALGUMA  │
//  │                     linha (independente do estoque) que      │
//  │                     combine com o que já está selecionado?   │
//  │  statusCta       → 'comprar' | 'encomenda' | 'indisponivel'  │
//  └─────────────────────────────────────────────────────────────┘
// ================================================================

import { useState, useMemo, useCallback, useEffect } from 'react';
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
  product:          ProductWithVariants;
  whatsappNumber:   string;
  /** Chamado quando o SKU resolvido tem uma imagem específica. */
  onImageChange?:   (imageUrl: string) => void;
}


// ── Helpers ──────────────────────────────────────────────────────

/**
 * Monta a seleção inicial: primeiro valor disponível de cada
 * dimensão que o produto realmente usa.
 */
function buildInitialSelection(product: ProductWithVariants): SelectedValues {
  const initial: SelectedValues = {};

  if (product.sabores_disponiveis.length > 0) {
    initial.saborId = product.sabores_disponiveis[0].id;
  }
  if (product.tamanhos_disponiveis.length > 0) {
    initial.tamanhoId = product.tamanhos_disponiveis[0].id;
  }
  if (product.tipos_embalagem_disponiveis.length > 0) {
    initial.embalagemId = product.tipos_embalagem_disponiveis[0].id;
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

  // ── Estado: valores selecionados por dimensão ─────────────────
  const [selectedValues, setSelectedValues] = useState<SelectedValues>(
    () => buildInitialSelection(product)
  );


  // ── LÓGICA 1: Encontrar o SKU que combina com a seleção atual ──
  // Dimensões que o produto não usa (lista *_disponiveis vazia) são
  // ignoradas na comparação.
  const currentSku = useMemo<SkuVariacao | null>(() => {
    const usaSabor     = product.sabores_disponiveis.length > 0;
    const usaTamanho    = product.tamanhos_disponiveis.length > 0;
    const usaEmbalagem  = product.tipos_embalagem_disponiveis.length > 0;

    return (
      product.skus_variacoes.find(sku =>
        (!usaSabor      || sku.sabor_id          === (selectedValues.saborId     ?? null)) &&
        (!usaTamanho    || sku.tamanho_id         === (selectedValues.tamanhoId    ?? null)) &&
        (!usaEmbalagem  || sku.tipo_embalagem_id  === (selectedValues.embalagemId  ?? null))
      ) ?? null
    );
  }, [selectedValues, product]);


  // ── LÓGICA 2: Disponibilidade de cada botão de opção ───────────
  // ⭐ Para cada valor de cada dimensão, perguntamos:
  //   "Se eu selecionar ESTE valor, existe ALGUMA linha em
  //    skus_variacoes que combine ele com as outras dimensões
  //    JÁ SELECIONADAS — independente do estoque?"
  //
  // Se a resposta for NÃO → essa combinação nunca foi cadastrada →
  //   botão desabilitado (não clicável).
  // Se a resposta for SIM → botão habilitado, mesmo que o estoque
  //   daquela combinação específica esteja zerado (decidimos
  //   "comprar" vs "encomenda" depois, com base no currentSku).
  const disponibilidade = useMemo<OptionAvailability>(() => {
    const usaSabor     = product.sabores_disponiveis.length > 0;
    const usaTamanho    = product.tamanhos_disponiveis.length > 0;
    const usaEmbalagem  = product.tipos_embalagem_disponiveis.length > 0;

    const sabor: Record<string, boolean> = {};
    for (const s of product.sabores_disponiveis) {
      sabor[s.id] = product.skus_variacoes.some(sku =>
        sku.sabor_id === s.id &&
        (!usaTamanho   || sku.tamanho_id        === (selectedValues.tamanhoId   ?? null)) &&
        (!usaEmbalagem || sku.tipo_embalagem_id === (selectedValues.embalagemId ?? null))
      );
    }

    const tamanho: Record<string, boolean> = {};
    for (const t of product.tamanhos_disponiveis) {
      tamanho[t.id] = product.skus_variacoes.some(sku =>
        sku.tamanho_id === t.id &&
        (!usaSabor     || sku.sabor_id          === (selectedValues.saborId     ?? null)) &&
        (!usaEmbalagem || sku.tipo_embalagem_id === (selectedValues.embalagemId ?? null))
      );
    }

    const embalagem: Record<string, boolean> = {};
    for (const e of product.tipos_embalagem_disponiveis) {
      embalagem[e.id] = product.skus_variacoes.some(sku =>
        sku.tipo_embalagem_id === e.id &&
        (!usaSabor   || sku.sabor_id   === (selectedValues.saborId   ?? null)) &&
        (!usaTamanho || sku.tamanho_id === (selectedValues.tamanhoId ?? null))
      );
    }

    return { sabor, tamanho, embalagem };
  }, [selectedValues, product]);


  // ── LÓGICA 3: Preço e status do CTA ─────────────────────────────
  const currentPrice = currentSku?.price ?? product.base_price;

  const statusCta: CtaStatus = !currentSku
    ? 'indisponivel'              // combinação nunca cadastrada
    : currentSku.stock > 0
      ? 'comprar'                 // existe e tem estoque
      : 'encomenda';               // existe, mas stock = 0


  // ── Handler: ao clicar em uma opção ──────────────────────────
  const handleSelect = useCallback(
    (dimensao: keyof SelectedValues, valueId: string) => {
      setSelectedValues(prev => ({ ...prev, [dimensao]: valueId }));
    },
    []
  );


  // ── Trocar a foto da galeria quando o SKU resolvido tiver uma ──
  // imagem própria (image_url fica em skus_variacoes, não em
  // sabores, porque a mesma "Morango" pode ter fotos diferentes
  // em produtos diferentes).
  useEffect(() => {
    if (currentSku?.image_url && onImageChange) {
      onImageChange(currentSku.image_url);
    }
  }, [currentSku, onImageChange]);


  // ── Montar mensagem do WhatsApp com as seleções ───────────────
  const whatsappUrl = useMemo(() => {
    const linhas: string[] = [];

    if (product.sabores_disponiveis.length > 0) {
      const sabor = product.sabores_disponiveis.find(s => s.id === selectedValues.saborId);
      linhas.push(`Sabor: *${sabor?.nome ?? '—'}*`);
    }
    if (product.tamanhos_disponiveis.length > 0) {
      const tamanho = product.tamanhos_disponiveis.find(t => t.id === selectedValues.tamanhoId);
      linhas.push(`Tamanho: *${tamanho?.nome ?? '—'}*`);
    }
    if (product.tipos_embalagem_disponiveis.length > 0) {
      const embalagem = product.tipos_embalagem_disponiveis.find(e => e.id === selectedValues.embalagemId);
      linhas.push(`Embalagem: *${embalagem?.nome ?? '—'}*`);
    }

    const cabecalho = statusCta === 'encomenda'
      ? 'Olá! Esse item está esgotado agora, mas gostaria de fazer uma encomenda:'
      : 'Olá! Tenho interesse no produto:';

    const mensagem = [
      cabecalho,
      '',
      `*${product.name} — ${product.brand}*`,
      ...linhas,
      `Preço: *${formatPrice(currentPrice)}*`,
      '',
      'Poderia me passar mais informações? 🙏',
    ];

    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(mensagem.join('\n'))}`;
  }, [selectedValues, product, currentPrice, whatsappNumber, statusCta]);


  // ── Render ────────────────────────────────────────────────────
  return (
    <div className={styles.selector}>

      {/* ── Grupo: Sabor ── */}
      {product.sabores_disponiveis.length > 0 && (
        <div className={styles.group}>
          <p className={styles.groupLabel}>
            Sabor:{' '}
            <strong className={styles.groupSelected}>
              {product.sabores_disponiveis.find(s => s.id === selectedValues.saborId)?.nome ?? ''}
            </strong>
          </p>

          <div className={styles.options} role="group" aria-label="Selecionar Sabor">
            {product.sabores_disponiveis.map(sabor => {
              const isSelected  = selectedValues.saborId === sabor.id;
              const isAvailable = disponibilidade.sabor[sabor.id] ?? false;

              return (
                <button
                  key={sabor.id}
                  type="button"
                  className={[
                    styles.optionBtn,
                    isSelected  ? styles.optionBtnActive    : '',
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
                    {isSelected   ? ' (Selecionado)'  : ''}
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
              {product.tamanhos_disponiveis.find(t => t.id === selectedValues.tamanhoId)?.nome ?? ''}
            </strong>
          </p>

          <div className={styles.options} role="group" aria-label="Selecionar Tamanho">
            {product.tamanhos_disponiveis.map(tamanho => {
              const isSelected  = selectedValues.tamanhoId === tamanho.id;
              const isAvailable = disponibilidade.tamanho[tamanho.id] ?? false;

              return (
                <button
                  key={tamanho.id}
                  type="button"
                  className={[
                    styles.optionBtn,
                    isSelected  ? styles.optionBtnActive    : '',
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
                    {isSelected   ? ' (Selecionado)'  : ''}
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
              {product.tipos_embalagem_disponiveis.find(e => e.id === selectedValues.embalagemId)?.nome ?? ''}
            </strong>
          </p>

          <div className={styles.options} role="group" aria-label="Selecionar Embalagem">
            {product.tipos_embalagem_disponiveis.map(embalagem => {
              const isSelected  = selectedValues.embalagemId === embalagem.id;
              const isAvailable = disponibilidade.embalagem[embalagem.id] ?? false;

              return (
                <button
                  key={embalagem.id}
                  type="button"
                  className={[
                    styles.optionBtn,
                    isSelected  ? styles.optionBtnActive    : '',
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
                    {isSelected   ? ' (Selecionado)'  : ''}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}


      {/* ── Preço atual (atualiza conforme seleção) ── */}
      <div className={styles.priceRow}>
        <span className={styles.price}>{formatPrice(currentPrice)}</span>
        {statusCta === 'encomenda' && (
          <span className={styles.badgeSoldOut}>Esgotado</span>
        )}
        {statusCta === 'indisponivel' && (
          <span className={styles.badgeSoldOut}>Combinação Indisponível</span>
        )}
      </div>


      {/* ── CTA WhatsApp ── */}
      <a
        href={statusCta !== 'indisponivel' ? whatsappUrl : undefined}
        className={[
          styles.ctaBtn,
          statusCta === 'indisponivel' ? styles.ctaBtnDisabled : '',
        ].join(' ')}
        target={statusCta !== 'indisponivel' ? '_blank' : undefined}
        rel="noopener noreferrer"
        role="button"
        aria-disabled={statusCta === 'indisponivel'}
        onClick={e => {
          if (statusCta === 'indisponivel') e.preventDefault();
        }}
      >
        {statusCta === 'comprar' && (
          <>
            <WhatsAppIcon />
            Pedir pelo WhatsApp
          </>
        )}
        {statusCta === 'encomenda' && (
          <>
            <WhatsAppIcon />
            Fazer Encomenda
          </>
        )}
        {statusCta === 'indisponivel' && (
          <>❌ Combinação Indisponível</>
        )}
      </a>

      {/* Mensagens de auxílio */}
      {statusCta === 'encomenda' && (
        <p className={styles.helpText}>
          Esse item está esgotado agora, mas você pode encomendar pelo WhatsApp.
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
