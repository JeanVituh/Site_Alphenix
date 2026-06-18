// ================================================================
//  ALPHENIX — lib/queries/products.ts (v2: modelo relacional)
// ================================================================

import { createSupabaseServerClient, createSupabaseStaticClient } from '@/lib/supabase/server';
import type {
  ProductWithVariants,
  ProductCard,
  SkuVariacao,
  Sabor,
  Tamanho,
  TipoEmbalagem,
} from '@/lib/types';

// ── Helpers: deduplicar + ordenar os catálogos presentes no produto ──
// Cada SKU traz sabores/tamanhos/tipos_embalagem embutidos (ou null,
// se o produto não usa aquela dimensão). Aqui extraímos só os valores
// distintos que realmente aparecem nas combinações deste produto.

function dedupSabores(skus: SkuVariacao[]): Sabor[] {
  const mapa = new Map<string, Sabor>();
  for (const sku of skus) {
    if (sku.sabores) mapa.set(sku.sabores.id, sku.sabores);
  }
  return [...mapa.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

function dedupTamanhos(skus: SkuVariacao[]): Tamanho[] {
  const mapa = new Map<string, Tamanho>();
  for (const sku of skus) {
    if (sku.tamanhos) mapa.set(sku.tamanhos.id, sku.tamanhos);
  }
  return [...mapa.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

function dedupEmbalagens(skus: SkuVariacao[]): TipoEmbalagem[] {
  const mapa = new Map<string, TipoEmbalagem>();
  for (const sku of skus) {
    if (sku.tipos_embalagem) mapa.set(sku.tipos_embalagem.id, sku.tipos_embalagem);
  }
  return [...mapa.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

// ── Query principal ────────────────────────────────────────────────

export async function getProductBySlug(slug: string): Promise<ProductWithVariants | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('products')
    .select(`
      id, slug, name, brand, category,
      description, badge, brand_color, brand_initials,
      base_price, images, benefits, how_to_use, nutrition, active,
      created_at, updated_at,

      skus_variacoes (
        id, product_id, sabor_id, tamanho_id, tipo_embalagem_id,
        sku_code, price, image_url, stock, available, created_at,
        sabores ( id, nome ),
        tamanhos ( id, nome ),
        tipos_embalagem ( id, nome )
      )
    `)
    .eq('slug', slug)
    .eq('active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // nenhuma linha encontrada
    throw new Error(`[getProductBySlug] ${error.message}`);
  }

  if (!data) return null;

  const skus = (data.skus_variacoes ?? []) as unknown as SkuVariacao[];

  return {
    ...data,
    skus_variacoes: skus,
    sabores_disponiveis: dedupSabores(skus),
    tamanhos_disponiveis: dedupTamanhos(skus),
    tipos_embalagem_disponiveis: dedupEmbalagens(skus),
  } as ProductWithVariants;
}

// ── getAllProductSlugs — usa cliente SEM cookies (roda no build) ────
// Sem alterações: continua consultando só a tabela "products",
// que não foi tocada pela migração.

export async function getAllProductSlugs(): Promise<string[]> {
  try {
    const supabase = createSupabaseStaticClient();

    const { data, error } = await supabase
      .from('products')
      .select('slug')
      .eq('active', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn(`[getAllProductSlugs] ${error.message}`);
      return [];
    }

    return (data ?? []).map(p => p.slug);
  } catch (err) {
    console.warn('[getAllProductSlugs] Falha ao buscar slugs, rotas serão dinâmicas:', err);
    return [];
  }
}

// ── getAllProducts ─────────────────────────────────────────────────

export async function getAllProducts(category?: string): Promise<ProductCard[]> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from('products')
    .select(`
      id, slug, name, brand, category,
      description, badge, brand_color, brand_initials,
      base_price, images, benefits, how_to_use, nutrition, active,
      created_at, updated_at,
      skus_variacoes ( price, stock, available )
    `)
    .eq('active', true)
    .order('created_at', { ascending: true });

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) throw new Error(`[getAllProducts] ${error.message}`);

  return (data ?? []).map(product => {
    type RawSku = { price: number | null; stock: number; available: boolean };
    const skus = (product.skus_variacoes as RawSku[]) ?? [];

    const availableSkus = skus.filter(s => s.available);
    const prices = availableSkus.map(s => s.price ?? product.base_price);

    return {
      ...product,
      skus_variacoes: undefined,
      min_price: prices.length > 0 ? Math.min(...prices) : product.base_price,
      has_variants: skus.length > 1,
    } as unknown as ProductCard;
  });
}
