// ================================================================
//  ALPHENIX — Página de Produto (app/produtos/[slug]/page.tsx)
//
//  Corrigido para usar as classes exatas do produto.css:
//   • Breadcrumb com caminho real (Início > Produtos > Categoria > Nome)
//   • ProductHero (Client Component) — galeria interativa + info
//   • ProductDetailNav (Client Component) — nav sticky com destaque
//   • Seções: Benefícios (grid), Modo de Uso (steps), Tabela Nutricional
//
//  Server Component: dados buscados no servidor, zero JS extra
//  além dos dois Client Components importados.
// ================================================================
export const revalidate = 60;// Revalida a cada 60 segundos para atualizar dados sem rebuildar
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { getProductBySlug, getAllProductSlugs } from '@/lib/queries/products';
import { CATEGORIES } from '@/lib/categories';
import type { NutritionFacts } from '@/lib/types';

import { ProductHero }      from '@/components/ProductHero';
import { ProductDetailNav } from '@/components/ProductDetailNav';
import type { NavItem }     from '@/components/ProductDetailNav';


// ── Rotas estáticas no build ─────────────────────────────────────
export async function generateStaticParams() {
  try {
    const slugs = await getAllProductSlugs();
    return slugs.map(slug => ({ slug }));
  } catch (err) {
    console.warn('[generateStaticParams] Pulando pré-geração de rotas:', err);
    return [];
  }
}


// ── Metadata dinâmica por produto ────────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const product  = await getProductBySlug(slug);

  if (!product) {
    return { title: 'Produto não encontrado | Alphenix' };
  }

  return {
    title:       `${product.name} — ${product.brand} | Alphenix`,
    description: product.description ?? undefined,
    openGraph: {
      title:       `${product.name} — ${product.brand}`,
      description: product.description ?? undefined,
      images:      product.images[0] ? [{ url: product.images[0] }] : [],
    },
  };
}


// ════════════════════════════════════════════════════════════════
//  SUB-COMPONENTES (Server, renderizados estaticamente)
// ════════════════════════════════════════════════════════════════

// ── Seção: Benefícios ─────────────────────────────────────────
function BenefitsSection({ benefits }: { benefits: string[] }) {
  if (!benefits.length) return null;
  return (
    <section
      id="beneficios"
      className="pdp-section reveal"
      // scroll-margin compensa header fixo + nav sticky (~56 px)
      style={{ scrollMarginTop: 'calc(var(--header-h) + 56px)' }}
    >
      <h2 className="pdp-section__title">
        <i className="fa-solid fa-fire-flame-curved" aria-hidden="true" />
        BENEFÍCIOS
      </h2>

      <div className="pdp-benefits-grid">
        {benefits.map((b, i) => (
          <div key={i} className="pdp-benefit-item">
            <div className="pdp-benefit-item__icon" aria-hidden="true">
              <i className="fa-solid fa-check" />
            </div>
            <span>{b}</span>
          </div>
        ))}
      </div>
    </section>
  );
}


// ── Seção: Modo de Uso ────────────────────────────────────────
function HowToUseSection({ steps }: { steps: string[] }) {
  if (!steps.length) return null;
  return (
    <section
      id="modo-de-uso"
      className="pdp-section reveal"
      style={{ scrollMarginTop: 'calc(var(--header-h) + 56px)' }}
    >
      <h2 className="pdp-section__title">
        <i className="fa-solid fa-circle-info" aria-hidden="true" />
        MODO DE USO
      </h2>

      <ol className="pdp-steps">
        {steps.map((step, i) => (
          <li key={i} className="pdp-step">
            <span className="pdp-step__num" aria-hidden="true">{i + 1}</span>
            <p className="pdp-step__text">{step}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}


// ── Seção: Tabela Nutricional ─────────────────────────────────
function NutritionSection({ nutrition }: { nutrition: NutritionFacts }) {
  // Mapeamento de chaves → rótulos PT-BR
  const labels: Record<string, string> = {
    porcao:       'Porção',
    calorias:     'Calorias',
    proteinas:    'Proteínas',
    carboidratos: 'Carboidratos Totais',
    gorduras:     'Gorduras Totais',
    sodio:        'Sódio',
    creatina:     'Creatina',
    cafeina:      'Cafeína',
    betaAlanina:  'Beta-Alanina',
    citrulina:    'Citrulina',
    taurina:      'Taurina',
    arginina:     'Arginina',
  };

  const { porcao, calorias, ...rest } = nutrition;

  const otherEntries = (Object.entries(rest) as [string, string | undefined][])
    .filter((entry): entry is [string, string] => Boolean(entry[1]));

  return (
    <section
      id="tabela-nutricional"
      className="pdp-section reveal"
      style={{ scrollMarginTop: 'calc(var(--header-h) + 56px)' }}
    >
      <h2 className="pdp-section__title">
        <i className="fa-solid fa-table-list" aria-hidden="true" />
        TABELA NUTRICIONAL
      </h2>

      <div className="pdp-nutrition-wrap">
        <div className="nutrition-card">

          {/* Cabeçalho do card */}
          <div className="nutrition-card__header">
            <p className="nutrition-card__title">INFORMAÇÃO NUTRICIONAL</p>
            {porcao && (
              <p className="nutrition-card__serving">Porção: {porcao}</p>
            )}
          </div>

          <table className="nutrition-table">
            <thead>
              <tr>
                <th colSpan={2} style={{ paddingBlock: '10px' }}>
                  QUANTIDADE POR PORÇÃO
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Linha de calorias com destaque especial */}
              {calorias && (
                <tr className="nt-row--calories">
                  <td>Calorias</td>
                  <td>{calorias}</td>
                </tr>
              )}

              {/* Demais nutrientes */}
              {otherEntries.map(([key, value]) => (
                <tr key={key}>
                  <td>{labels[key] ?? key}</td>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="nutrition-card__disclaimer">
            * % VD com base em uma dieta de 2.000 kcal. Seus valores diários
            podem ser maiores ou menores dependendo de suas necessidades calóricas.
          </p>
        </div>
      </div>
    </section>
  );
}


// ════════════════════════════════════════════════════════════════
//  PÁGINA PRINCIPAL (Server Component)
// ════════════════════════════════════════════════════════════════
export default async function ProductPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug }  = await params;
  const product   = await getProductBySlug(slug);
  if (!product) notFound();

  // Rótulo legível da categoria para o breadcrumb
  const categoryObj   = CATEGORIES.find(c => c.id === product.category);
  const categoryLabel = categoryObj?.label ?? product.category;

  // Itens da nav de seções — só adiciona se o conteúdo existir
  const navItems: NavItem[] = [
    ...(product.benefits.length > 0
      ? [{ id: 'beneficios', label: 'Benefícios' }]
      : []),
    ...(product.how_to_use.length > 0
      ? [{ id: 'modo-de-uso', label: 'Modo de Uso' }]
      : []),
    ...(product.nutrition
      ? [{ id: 'tabela-nutricional', label: 'Tabela Nutricional' }]
      : []),
  ];

  const hasDetails =
    product.benefits.length > 0 ||
    product.how_to_use.length > 0 ||
    Boolean(product.nutrition);

  return (
    <main>

      {/* ── Breadcrumb ── */}
      <div className="pdp-breadcrumb">
        <div className="container pdp-breadcrumb__inner">
          <Link href="/">Início</Link>
          <i className="fa-solid fa-chevron-right" aria-hidden="true" />
          <Link href="/#produtos">Produtos</Link>
          <i className="fa-solid fa-chevron-right" aria-hidden="true" />
          <Link href={`/?categoria=${encodeURIComponent(product.category)}#produtos`}>
            {categoryLabel}
          </Link>
          <i className="fa-solid fa-chevron-right" aria-hidden="true" />
          <span className="pdp-breadcrumb__current">{product.name}</span>
        </div>
      </div>

      {/* ── Hero: Galeria + Info (Client Component) ── */}
      <ProductHero product={product} />

      {/* ── Nav sticky de seções (Client Component, só monta se houver itens) ── */}
      {navItems.length > 0 && (
        <ProductDetailNav items={navItems} />
      )}

      {/* ── Seções de detalhe ── */}
      {hasDetails && (
        <div className="pdp-details">
          <div className="container">

            <BenefitsSection  benefits={product.benefits}  />
            <HowToUseSection  steps={product.how_to_use}   />
            {product.nutrition && (
              <NutritionSection nutrition={product.nutrition} />
            )}

          </div>
        </div>
      )}

    </main>
  );
}
