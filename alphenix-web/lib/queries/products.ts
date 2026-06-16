// ================================================================
//  ALPHENIX — lib/queries/products.ts
// ================================================================

import { createSupabaseServerClient, createSupabaseStaticClient } from '@/lib/supabase/server';
import type { ProductWithVariants, ProductCard, OptionType, SKU } from '@/lib/types';

// ── Query principal ──────────────────────────────────────────────

export async function getProductBySlug(
  slug: string
): Promise<ProductWithVariants | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('products')
    .select(`
      id, slug, name, brand, category,
      description, badge, brand_color, brand_initials,
      base_price, images, benefits, how_to_use, nutrition, active,
      created_at, updated_at,

      option_types (
        id, product_id, name, label, sort_order,
        option_values (
          id, option_type_id, label, image_url, sort_order
        )
      ),

      skus (
        id, product_id, sku_code, price, stock, available, created_at,
        sku_option_values (
          option_value_id
        )
      )
    `)
    .eq('slug', slug)
    .eq('active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`[getProductBySlug] ${error.message}`);
  }

  if (!data) return null;

  const sorted = {
    ...data,
    option_types: (data.option_types as OptionType[])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(ot => ({
        ...ot,
        option_values: [...ot.option_values].sort(
          (a, b) => a.sort_order - b.sort_order
        ),
      })),
    skus: data.skus as SKU[],
  };

  return sorted as ProductWithVariants;
}

// ── getAllProductSlugs — usa cliente SEM cookies (roda no build) ──

/**
 * ⚠️ Usa createSupabaseStaticClient (sem cookies) porque é chamada
 * dentro de generateStaticParams, que roda em build-time.
 */
export async function getAllProductSlugs(): Promise<string[]> {
  try {
    const supabase = createSupabaseStaticClient();

    const { data, error } = await supabase
      .from('products')
      .select('slug')
      .eq('active', true)
      .order('created_at', { ascending: true });

    if (error) {
      // Loga mas não explode o build — páginas serão renderizadas dinamicamente
      console.warn(`[getAllProductSlugs] ${error.message}`);
      return [];
    }

    return (data ?? []).map(p => p.slug);
  } catch (err) {
    console.warn('[getAllProductSlugs] Falha ao buscar slugs, rotas serão dinâmicas:', err);
    return [];
  }
}

// ── getAllProducts ────────────────────────────────────────────────

export async function getAllProducts(
  category?: string
): Promise<ProductCard[]> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from('products')
    .select(`
      id, slug, name, brand, category,
      description, badge, brand_color, brand_initials,
      base_price, images, benefits, how_to_use, nutrition, active,
      created_at, updated_at,
      skus ( price, stock, available )
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
    const skus = (product.skus as RawSku[]) ?? [];

    const availableSkus = skus.filter(s => s.available);
    const prices = availableSkus.map(s => s.price ?? product.base_price);

    return {
      ...product,
      skus: undefined,
      min_price: prices.length > 0 ? Math.min(...prices) : product.base_price,
      has_variants: skus.length > 1,
    } as ProductCard;
  });
}
