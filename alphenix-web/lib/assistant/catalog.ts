import { getCatalogCategory } from '@/lib/categories';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getDarkWolfCatalogKnowledge } from './darkWolfCatalog';
import type { AssistantProductRecommendation, AssistantVariant } from './types';

interface CatalogSearchArgs {
  query?: string | null;
  // Filtro interno usado pelo assistente para objetivos como imunidade/sono.
  // Diferente de `query`, ele considera apenas nome/descrição/benefícios/badge
  // e não a categoria, evitando falsos positivos como a palavra 'sono' em
  // todos os itens da categoria 'Bem-estar & Sono'.
  evidence_query?: string | null;
  category?: string | null;
  max_price?: number | null;
  in_stock_only?: boolean | null;
  limit?: number | null;
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function relationName(
  relation: { nome: string }[] | { nome: string } | null | undefined,
): string | null {
  const value = Array.isArray(relation) ? relation[0] : relation;
  return value?.nome ?? null;
}

function variantLabel(parts: Array<string | null>): string {
  const label = parts.filter(Boolean).join(' · ');
  return label || 'Padrão';
}

function normalizeImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('/')) return path;
  return `/${path}`;
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value?.trim())).map((value) => value.trim()))];
}

// Alias de busca para tipos comerciais que nem sempre aparecem no nome do produto.
// Isso evita que "whey concentrado" encontre apenas produtos que tenham literalmente
// a palavra "Concentrado" no título.
const PRODUCT_SEARCH_ALIASES: Record<string, string[]> = {
  'whey-100-pure-dark-wolf': [
    'whey concentrado',
    'whey protein concentrado',
    'wpc',
    'proteina concentrada do soro do leite',
  ],
  'whey-100-pure-ramon-dino-max-titanium': [
    'whey concentrado',
    'whey protein concentrado',
    'wpc',
    'proteina concentrada do soro do leite',
  ],
  'whey-100-pure-tradicional-max-titanium': [
    'whey concentrado',
    'whey protein concentrado',
    'wpc',
    'proteina concentrada do soro do leite',
  ],
  'whey-100-pure-probiotica': [
    'whey concentrado',
    'whey protein concentrado',
    'wpc',
    'proteina concentrada do soro do leite',
  ],
  'whey-100-pure-integralmedica': [
    'whey concentrado',
    'whey protein concentrado',
    'wpc',
    'proteina concentrada do soro do leite',
  ],
  'whey-concentrado-dux': [
    'whey concentrado',
    'whey protein concentrado',
    'wpc',
    'proteina concentrada do soro do leite',
  ],
};

function searchTermMatches(blob: string, term: string): boolean {
  // "concentrado", "concentrada" e "concentrados" devem representar a mesma intenção.
  if (term.startsWith('concentrad')) return blob.includes('concentrad');
  return blob.includes(term);
}

function commercialPriority(product: AssistantProductRecommendation): number {
  const slug = normalizeText(product.slug);
  const brand = normalizeText(product.brand);

  // Regra de merchandising da Alphenix:
  // a Creatina Dark Wolf é um produto estratégico da loja e deve aparecer
  // entre as primeiras opções sempre que realmente corresponder à busca.
  if (slug === 'alpha-burn-dark-wolf') return 1200;
  if (slug === 'creatina-dark-wolf') return 1000;

  // Pequeno desempate para a marca Dark Wolf, sem furar filtros de categoria,
  // orçamento ou pronta entrega definidos pelo cliente.
  if (brand.includes('dark wolf')) return 100;

  return 0;
}

export async function searchCatalog(
  args: CatalogSearchArgs,
): Promise<AssistantProductRecommendation[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('products')
    .select(`
      id, slug, name, brand, category, description, badge,
      base_price, compare_at_price, images, benefits, active,
      skus_variacoes (
        id, product_id, sku_code, price, compare_at_price, image_url,
        stock, available,
        sabores ( nome ),
        tamanhos ( nome ),
        tipos_embalagem ( nome ),
        cores ( nome )
      )
    `)
    .eq('active', true);

  if (error) {
    throw new Error(`[assistant catalog] ${error.message}`);
  }

  type RawSku = {
    id: string;
    product_id: string;
    sku_code: string | null;
    price: number | null;
    compare_at_price: number | null;
    image_url: string | null;
    stock: number;
    available: boolean;
    sabores: { nome: string }[] | { nome: string } | null;
    tamanhos: { nome: string }[] | { nome: string } | null;
    tipos_embalagem: { nome: string }[] | { nome: string } | null;
    cores: { nome: string }[] | { nome: string } | null;
  };

  type RawProduct = {
    id: string;
    slug: string;
    name: string;
    brand: string;
    category: string;
    description: string | null;
    badge: string | null;
    base_price: number;
    compare_at_price: number | null;
    images: string[] | null;
    benefits: string[] | null;
    active: boolean;
    skus_variacoes?: RawSku[] | null;
  };

  const q = normalizeText(args.query);
  const evidenceQuery = normalizeText(args.evidence_query);
  const category = normalizeText(args.category);
  const maxPrice =
    typeof args.max_price === 'number' && Number.isFinite(args.max_price)
      ? Math.max(0, args.max_price)
      : null;
  const inStockOnly = Boolean(args.in_stock_only);
  const limit = Math.min(24, Math.max(1, Math.floor(args.limit ?? 3)));

  const products = ((data ?? []) as unknown as RawProduct[])
    .map((product) => {
      const displayCategory = getCatalogCategory(product);
      const officialKnowledge = getDarkWolfCatalogKnowledge(product.slug);
      const effectiveDescription = officialKnowledge?.description ?? product.description;
      const effectiveBenefits = officialKnowledge
        ? uniqueStrings(officialKnowledge.benefits)
        : uniqueStrings(product.benefits ?? []);
      const catalogFacts = uniqueStrings(officialKnowledge?.facts ?? []);
      const catalogTags = uniqueStrings(officialKnowledge?.tags ?? []);
      const rawSkus = product.skus_variacoes ?? [];
      const activeSkus = rawSkus.filter((sku) => sku.available);
      const eligibleSkus = inStockOnly
        ? activeSkus.filter((sku) => sku.stock > 0)
        : activeSkus;

      // Se o produto possui SKUs cadastrados, mas todos estão desativados,
      // ele não deve ser oferecido pelo Nix. Produtos sem SKU (ex.: acessório
      // simples com preço-base) continuam podendo aparecer.
      if (rawSkus.length > 0 && activeSkus.length === 0) return null;
      if (activeSkus.length > 0 && eligibleSkus.length === 0) return null;

      const allPrices = (eligibleSkus.length ? eligibleSkus : activeSkus).map(
        (sku) => sku.price ?? product.base_price,
      );
      const minPrice = allPrices.length ? Math.min(...allPrices) : product.base_price;

      if (maxPrice !== null && minPrice > maxPrice) return null;

      if (category && normalizeText(displayCategory) !== category) return null;

      const evidenceBlob = normalizeText([
        product.slug,
        product.name,
        product.brand,
        effectiveDescription,
        product.badge,
        ...effectiveBenefits,
        ...catalogFacts,
        ...catalogTags,
      ].filter(Boolean).join(' '));

      const searchAliases = PRODUCT_SEARCH_ALIASES[product.slug] ?? [];

      const searchBlob = normalizeText([
        evidenceBlob,
        displayCategory,
        ...searchAliases,
        ...activeSkus.flatMap((sku) => [
          relationName(sku.sabores),
          relationName(sku.tamanhos),
          relationName(sku.tipos_embalagem),
          relationName(sku.cores),
          sku.sku_code,
        ]),
      ].filter(Boolean).join(' '));

      if (q) {
        const terms = q.split(/\s+/).filter(Boolean);
        if (!terms.every((term) => searchTermMatches(searchBlob, term))) return null;
      }

      if (evidenceQuery) {
        const evidenceTerms = evidenceQuery.split(/\s+/).filter(Boolean);
        if (!evidenceTerms.every((term) => searchTermMatches(evidenceBlob, term))) return null;
      }

      const sortedSkus = [...activeSkus].sort((a, b) => {
        const stockDiff = Number(b.stock > 0) - Number(a.stock > 0);
        if (stockDiff !== 0) return stockDiff;
        return (a.price ?? product.base_price) - (b.price ?? product.base_price);
      });

      const variants: AssistantVariant[] = sortedSkus.slice(0, 16).map((sku) => {
        const sabor = relationName(sku.sabores);
        const tamanho = relationName(sku.tamanhos);
        const embalagem = relationName(sku.tipos_embalagem);
        const cor = relationName(sku.cores);
        const price = sku.price ?? product.base_price;
        const compare = sku.compare_at_price ?? product.compare_at_price ?? null;

        return {
          skuId: sku.id,
          label: variantLabel([sabor, tamanho, embalagem, cor]),
          price,
          compareAtPrice: compare && compare > price ? compare : null,
          stock: sku.stock,
          available: sku.available,
          imageUrl: normalizeImageUrl(sku.image_url),
          sabor,
          tamanho,
          embalagem,
          cor,
        };
      });

      const minSku = sortedSkus.find((sku) => (sku.price ?? product.base_price) === minPrice);
      const compareAtPrice = minSku?.compare_at_price ?? product.compare_at_price ?? null;
      const imageUrl =
        normalizeImageUrl(minSku?.image_url) ??
        normalizeImageUrl(sortedSkus.find((sku) => sku.image_url)?.image_url) ??
        normalizeImageUrl(product.images?.[0]);

      const result: AssistantProductRecommendation = {
        id: product.id,
        slug: product.slug,
        name: product.name,
        brand: product.brand,
        category: displayCategory,
        badge: product.badge,
        description: effectiveDescription,
        imageUrl,
        minPrice,
        compareAtPrice:
          compareAtPrice && compareAtPrice > minPrice ? compareAtPrice : null,
        benefits: effectiveBenefits.slice(0, 8),
        catalogFacts: catalogFacts.slice(0, 8),
        catalogSourcePage: officialKnowledge?.sourcePage ?? null,
        variants,
      };

      return result;
    })
    .filter((product): product is AssistantProductRecommendation => product !== null)
    .sort((a, b) => {
      const priorityDiff = commercialPriority(b) - commercialPriority(a);
      if (priorityDiff !== 0) return priorityDiff;

      const aStock = a.variants.some((variant) => variant.stock > 0);
      const bStock = b.variants.some((variant) => variant.stock > 0);
      const stockDiff = Number(bStock) - Number(aStock);
      if (stockDiff !== 0) return stockDiff;

      return a.minPrice - b.minPrice;
    });

  return products.slice(0, limit);
}

export async function getCatalogProduct(
  slug: string,
): Promise<AssistantProductRecommendation | null> {
  const products = await searchCatalog({ query: slug, limit: 6 });
  return products.find((product) => product.slug === slug) ?? null;
}
