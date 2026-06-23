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

function normalizeText(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

const DUX_WHEY_CARAMEL_COVER =
  'assets/images/products/Dux/whey-concentrado-dux-caramelo-salgado-450g-pote.jpg';

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

  const allSkus = (data.skus_variacoes ?? []) as unknown as SkuVariacao[];

  // Regra de negócio:
  // - available = true  → variação existe/vende e deve aparecer no site
  // - available = false → variação desativada, cadastrada errada ou não vendida
  // O estoque NÃO decide se a variação aparece. Stock 0 + available true vira encomenda.
  const skus = allSkus.filter(sku => sku.available);

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
      skus_variacoes (
  price,
  stock,
  available,
  image_url,
  sabores ( nome ),
  tipos_embalagem ( nome )
)
    `)
    .eq('active', true)
    .order('created_at', { ascending: true });

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) throw new Error(`[getAllProducts] ${error.message}`);

  return (data ?? []).map(product => {
  type RawSku = {
  price: number | null;
  stock: number;
  available: boolean;
  image_url: string | null;

  // O Supabase/TypeScript pode entender relacionamento como array,
  // então aceitamos os dois formatos.
  sabores: { nome: string }[] | { nome: string } | null;
  tipos_embalagem: { nome: string }[] | { nome: string } | null;
};

const skus = ((product.skus_variacoes ?? []) as unknown) as RawSku[];

// Mostra na home apenas variações vendáveis.
// Stock 0 continua vendável se available=true, pois vira encomenda.
// available=false some do site, porque é variação desativada / inexistente.
const skusAtivos = skus.filter(s => s.available);

const getNomeEmbalagem = (sku: RawSku): string | null => {
  const embalagem = Array.isArray(sku.tipos_embalagem)
    ? sku.tipos_embalagem[0]
    : sku.tipos_embalagem;

  return embalagem?.nome ?? null;
};

const getNomeSabor = (sku: RawSku): string | null => {
  const sabor = Array.isArray(sku.sabores)
    ? sku.sabores[0]
    : sku.sabores;

  return sabor?.nome ?? null;
};

const skusEmEstoque = skusAtivos.filter(s => s.stock > 0);

const prices = skusAtivos.length > 0
  ? skusAtivos.map(s => s.price ?? product.base_price)
  : [product.base_price];

const minPrice = prices.length > 0 ? Math.min(...prices) : product.base_price;

// A capa do card acompanha, sempre que possível, a variação de menor preço.
// Assim o card que mostra “A partir de” não usa uma imagem de uma variação
// muito mais cara como capa principal.
const cheapestSkusWithImage = skusAtivos
  .filter(s => (s.price ?? product.base_price) === minPrice && s.image_url)
  .sort((a, b) => {
    const stockDiff = Number(b.stock > 0) - Number(a.stock > 0);
    if (stockDiff !== 0) return stockDiff;

    const aIsPote = getNomeEmbalagem(a) === 'Pote';
    const bIsPote = getNomeEmbalagem(b) === 'Pote';
    return Number(bIsPote) - Number(aIsPote);
  });

const isDuxWheyConcentrado =
  normalizeText(product.brand).includes('dux') &&
  normalizeText(product.name).includes('whey');

// Ajuste específico de capa: no card da home, o DUX Whey abre com a imagem
// de Caramelo Salgado 450g, que encaixa melhor no card e continua coerente
// com o preço “A partir de” do menor tamanho.
const preferredCoverSku = isDuxWheyConcentrado
  ? skusAtivos.find(s =>
      normalizeText(getNomeSabor(s)).includes('caramelo salgado') &&
      normalizeText(s.image_url).includes('450g') &&
      s.image_url
    ) ??
    skusAtivos.find(s =>
      normalizeText(getNomeSabor(s)).includes('caramelo salgado') &&
      s.image_url
    )
  : null;

const coverSku =
  preferredCoverSku ??
  cheapestSkusWithImage[0] ??
  skusEmEstoque.find(s => getNomeEmbalagem(s) === 'Pote' && s.image_url) ??
  skusAtivos.find(s => getNomeEmbalagem(s) === 'Pote' && s.image_url) ??
  skusEmEstoque.find(s => s.image_url) ??
  skusAtivos.find(s => s.image_url) ??
  null;

return {
  ...product,
  skus_variacoes: undefined,
  min_price: minPrice,
  has_variants: skusAtivos.length > 1,
  cover_image_url: coverSku?.image_url ?? (isDuxWheyConcentrado ? DUX_WHEY_CARAMEL_COVER : product.images?.[0] ?? null),
} as unknown as ProductCard;
});
}
