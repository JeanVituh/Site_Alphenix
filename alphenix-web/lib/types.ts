// ================================================================
//  ALPHENIX — lib/types.ts (v2: modelo relacional)
//
//  Substitui os tipos antigos (OptionType, OptionValue, SKU
//  genéricos) pelos tipos nomeados do novo schema:
//  sabores, tamanhos, tipos_embalagem, skus_variacoes.
// ================================================================

// ── Tabela nutricional (campo jsonb em products.nutrition) ───────
export interface NutritionFacts {
  porcao?: string;
  calorias?: string;
  proteinas?: string;
  carboidratos?: string;
  gorduras?: string;
  sodio?: string;
  creatina?: string;
  cafeina?: string;
  betaAlanina?: string;
  citrulina?: string;
  taurina?: string;
  arginina?: string;
}

export type ProductCategory =
  | 'proteinas'
  | 'creatinas'
  | 'pre-treino'
  | 'combos e outros';

// ── Tabela: products (sem alterações de estrutura) ───────────────
export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: ProductCategory;
  description: string | null;
  badge: string | null;
  brand_color: string;
  brand_initials: string | null;
  base_price: number;
  images: string[];
  benefits: string[];
  how_to_use: string[];
  nutrition: NutritionFacts | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// ── Catálogos globais (novas tabelas) ─────────────────────────────
export interface Sabor {
  id: string;
  nome: string;
}

export interface Tamanho {
  id: string;
  nome: string;
}

export interface TipoEmbalagem {
  id: string;
  nome: string;
}

// ── Tabela central: skus_variacoes ────────────────────────────────
// Os campos sabores/tamanhos/tipos_embalagem vêm embutidos pelo
// Supabase quando a query usa o select aninhado
// (ex: "sabores ( id, nome )"). Cada SKU tem no máximo 1 de cada,
// por isso são objetos e não arrays.
export interface SkuVariacao {
  id: string;
  product_id: string;
  sabor_id: string | null;
  tamanho_id: string | null;
  tipo_embalagem_id: string | null;
  sku_code: string | null;
  price: number | null;
  image_url: string | null;
  stock: number;
  available: boolean;
  created_at: string;
  sabores: Sabor | null;
  tamanhos: Tamanho | null;
  tipos_embalagem: TipoEmbalagem | null;
}

// ── Retorno de getProductBySlug ───────────────────────────────────
export interface ProductWithVariants extends Product {
  skus_variacoes: SkuVariacao[];
  // Listas já deduplicadas e ordenadas (montadas em
  // lib/queries/products.ts), prontas para o VariantSelector renderizar.
  // Ficam vazias ([]) quando o produto não usa aquela dimensão.
  sabores_disponiveis: Sabor[];
  tamanhos_disponiveis: Tamanho[];
  tipos_embalagem_disponiveis: TipoEmbalagem[];
}

// ── Card de listagem (home, grade de produtos) ────────────────────
export interface ProductCard extends Product {
  min_price: number;
  has_variants: boolean;
  cover_image_url: string | null;
}

// ── Seleção do usuário no VariantSelector ─────────────────────────
// Cada chave é opcional porque um produto pode não usar as 3 dimensões.
export interface SelectedValues {
  saborId?: string;
  tamanhoId?: string;
  embalagemId?: string;
}

// ── Mapa de disponibilidade por botão de opção ────────────────────
// true = existe ao menos 1 linha em skus_variacoes para essa
// combinação (independente do estoque). false = combinação nunca
// cadastrada → botão não deve ser clicável.
export interface OptionAvailability {
  sabor: Record<string, boolean>;
  tamanho: Record<string, boolean>;
  embalagem: Record<string, boolean>;
}

// ── Status do CTA, calculado a partir do SKU resolvido ────────────
//  'comprar'      → combinação existe e stock > 0
//  'encomenda'    → combinação existe mas stock = 0
//  'indisponivel' → combinação não existe em skus_variacoes
export type CtaStatus = 'comprar' | 'encomenda' | 'indisponivel';
