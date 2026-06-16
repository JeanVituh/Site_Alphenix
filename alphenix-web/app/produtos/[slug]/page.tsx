// ================================================================
//  ALPHENIX — Página de Produto (app/produtos/[slug]/page.tsx)
//
//  Server Component: fetch no servidor, zero JS extra pro cliente.
//  O VariantSelector é o único Client Component nessa página.
// ================================================================

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProductBySlug, getAllProductSlugs } from '@/lib/queries/products';
import { VariantSelector } from '@/components/VariantSelector';

// ── Rotas estáticas no build ─────────────────────────────────────
export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map(slug => ({ slug }));
}

// ── Metadata dinâmica por produto ────────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: 'Produto não encontrado | Alphenix' };
  }

  return {
    title: `${product.name} — ${product.brand} | Alphenix`,
    description: product.description ?? undefined,
    openGraph: {
      title:       `${product.name} — ${product.brand}`,
      description: product.description ?? undefined,
      images:      product.images[0] ? [{ url: product.images[0] }] : [],
    },
  };
}


// ── Componente de Preço (renderizado no servidor) ─────────────────
// Exibe o preço base; o VariantSelector atualiza via estado no client.
function PriceDisplay({ basePrice }: { basePrice: number }) {
  return (
    <div className="pdp-price-wrapper">
      <span className="pdp-price">
        R$ {basePrice.toFixed(2).replace('.', ',')}
      </span>
      <span className="pdp-price-note">Preço pode variar por tamanho</span>
    </div>
  );
}

// ── Galeria de Imagens ────────────────────────────────────────────
// Client Component separado seria ideal; aqui simplificado como Server.
function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const mainImage = images[0];
  if (!mainImage) {
    return (
      <div className="pdp-gallery-placeholder" aria-label={`Imagem de ${name}`}>
        <span>Sem imagem</span>
      </div>
    );
  }
  return (
    <div className="pdp-gallery">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={mainImage}
        alt={name}
        className="pdp-gallery__main"
        width={600}
        height={600}
      />
      {images.length > 1 && (
        <div className="pdp-gallery__thumbs">
          {images.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt={`${name} — imagem ${i + 1}`}
              className="pdp-gallery__thumb"
              width={80}
              height={80}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tabela Nutricional ────────────────────────────────────────────
function NutritionTable({ nutrition }: { nutrition: Record<string, string| undefined> | null }) {
  if (!nutrition) return null;

  const labels: Record<string, string> = {
    porcao:       'Porção',
    calorias:     'Calorias',
    proteinas:    'Proteínas',
    carboidratos: 'Carboidratos',
    gorduras:     'Gorduras',
    sodio:        'Sódio',
    creatina:     'Creatina',
    cafeina:      'Cafeína',
    betaAlanina:  'Beta-Alanina',
    citrulina:    'Citrulina',
    taurina:      'Taurina',
    arginina:     'Arginina',
  };

  return (
    <section className="pdp-nutrition reveal">
      <h3 className="pdp-section-title">Informações Nutricionais</h3>
      <table className="pdp-nutrition__table">
        <tbody>
          {Object.entries(nutrition).map(([key, value]) => (
            <tr key={key} className="pdp-nutrition__row">
              <td className="pdp-nutrition__label">{labels[key] ?? key}</td>
              <td className="pdp-nutrition__value">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

// ── Página Principal (Server Component) ──────────────────────────
export default async function ProductPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Fetch completo no servidor — sem loading spinner, sem waterfall
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const hasVariants = product.option_types.length > 0;

  return (
    <main className="pdp-page">
      <div className="container">
        <div className="pdp-layout">

          {/* ── Coluna esquerda: galeria ── */}
          <div className="pdp-col-media">
            <ProductGallery images={product.images} name={product.name} />
          </div>

          {/* ── Coluna direita: info + variações ── */}
          <div className="pdp-col-info reveal">

            {/* Badge e eyebrow */}
            {product.badge && (
              <span className="badge badge--fire">{product.badge}</span>
            )}
            <p className="pdp-brand">{product.brand}</p>
            <h1 className="pdp-title">{product.name}</h1>
            <p className="pdp-description">{product.description}</p>

            {/* Preço base (server-rendered) */}
            <PriceDisplay basePrice={product.base_price} />

            {/* ⭐ Seletor de variações — Client Component */}
            {hasVariants ? (
              <VariantSelector
                product={product}
                whatsappNumber="5538998926729"
              />
            ) : (
              /* Produto sem variações: botão direto */
              <a
                href={`https://wa.me/5538998926729?text=${encodeURIComponent(
                  `Olá! Tenho interesse no produto:\n\n*${product.name} — ${product.brand}*\nPreço: *R$ ${product.base_price.toFixed(2).replace('.', ',')}*\n\nPoderia me passar mais informações? 🙏`
                )}`}
                className="btn btn--whatsapp"
                target="_blank"
                rel="noopener noreferrer"
              >
                💬 Pedir pelo WhatsApp
              </a>
            )}

            {/* Benefícios */}
            {product.benefits.length > 0 && (
              <section className="pdp-benefits reveal reveal-delay-1">
                <h3 className="pdp-section-title">Benefícios</h3>
                <ul className="pdp-benefits__list">
                  {product.benefits.map((b, i) => (
                    <li key={i} className="pdp-benefits__item">
                      <span aria-hidden>🔥</span> {b}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Modo de uso */}
            {product.how_to_use.length > 0 && (
              <section className="pdp-how-to-use reveal reveal-delay-2">
                <h3 className="pdp-section-title">Como usar</h3>
                <ol className="pdp-steps">
                  {product.how_to_use.map((step, i) => (
                    <li key={i} className="pdp-step">
                      <span className="pdp-step__num">{i + 1}</span>
                      <p>{step}</p>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>
        </div>

        {/* Tabela nutricional (largura total) */}
        <NutritionTable nutrition={product.nutrition} />
      </div>
    </main>
  );
}
