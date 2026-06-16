// ================================================================
//  ALPHENIX — Types (lib/types.ts)
//  Tipagem completa do modelo relacional de produtos e SKUs
// ================================================================


// ── Tipos base (espelham as colunas do banco) ────────────────────

export interface NutritionFacts {
  porcao?:       string;
  calorias?:     string;
  proteinas?:    string;
  carboidratos?: string;
  gorduras?:     string;
  sodio?:        string;
  creatina?:     string;
  cafeina?:      string;
  betaAlanina?:  string;
  citrulina?:    string;
  taurina?:      string;
  arginina?:     string;
  [key: string]: string | undefined;
}

export interface ProductRow {
  id:              string;
  slug:            string;
  name:            string;
  brand:           string;
  category:        'proteinas' | 'creatinas' | 'pre-treino' | 'combos e outros';
  description:     string | null;
  badge:           string | null;
  brand_color:     string;
  brand_initials:  string | null;
  base_price:      number;
  images:          string[];
  benefits:        string[];
  how_to_use:      string[];
  nutrition:       NutritionFacts | null;
  active:          boolean;
  created_at:      string;
  updated_at:      string;
}

export interface OptionTypeRow {
  id:         string;
  product_id: string;
  name:       string;   // 'flavor' | 'size' | 'format'
  label:      string;   // 'Sabor'  | 'Tamanho' | 'Embalagem'
  sort_order: number;
}

export interface OptionValueRow {
  id:             string;
  option_type_id: string;
  label:          string;
  image_url:      string | null;
  sort_order:     number;
}

export interface SKUOptionValueRow {
  sku_id:           string;
  option_value_id:  string;
}

export interface SKURow {
  id:         string;
  product_id: string;
  sku_code:   string | null;
  price:      number | null;   // null = herda base_price
  stock:      number;
  available:  boolean;         // coluna gerada: stock > 0
  created_at: string;
}


// ── Tipos compostos (com JOINs do Supabase) ──────────────────────

/** OptionValue com seu tipo pai (usado dentro de OptionType) */
export interface OptionValue extends OptionValueRow {}

/** OptionType com seus valores aninhados */
export interface OptionType extends OptionTypeRow {
  option_values: OptionValue[];
}

/** SKU com os IDs das option_values que o compõem */
export interface SKU extends SKURow {
  sku_option_values: Pick<SKUOptionValueRow, 'option_value_id'>[];
}

/**
 * ⭐ Tipo principal usado nos componentes.
 * Produto completo com option_types, option_values e skus aninhados.
 * Gerado pela query getProductBySlug().
 */
export interface ProductWithVariants extends ProductRow {
  option_types: OptionType[];
  skus:         SKU[];
}

/**
 * Produto resumido para cards do catálogo (listagem).
 * Inclui apenas o SKU mais barato disponível.
 */
export interface ProductCard extends ProductRow {
  min_price: number;          // menor preço disponível entre os SKUs
  has_variants: boolean;      // true se tem mais de um tamanho/sabor
}


// ── Estado da seleção de variações (UI) ──────────────────────────

/**
 * Map de optionTypeId → optionValueId selecionado
 * Ex: { "uuid-flavor": "uuid-morango", "uuid-size": "uuid-900g", ... }
 */
export type SelectedValues = Record<string, string>;

/**
 * Map de optionTypeId → (optionValueId → isAvailable)
 * Calculado via useMemo no VariantSelector.
 * Uma opção é "disponível" se existir ao menos 1 SKU com stock > 0
 * que combine este valor com os demais valores selecionados.
 */
export type OptionAvailabilityMap = Record<string, Record<string, boolean>>;

/** Estado completo do seletor de variações */
export interface VariantSelectionState {
  selectedValues:   SelectedValues;
  currentSku:       SKU | null;
  currentPrice:     number;
  isInStock:        boolean;
  optionAvailability: OptionAvailabilityMap;
}
