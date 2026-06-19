// ================================================================
//  ALPHENIX — Home Page (app/page.tsx)
//
//  Server Component: busca os produtos no Supabase (getAllProducts)
//  e monta a home recriando o index.html original — Hero, seção de
//  Produtos (busca + filtros + grid via HomeProducts, Client
//  Component), Diferenciais e CTA Banner. Header e Footer já vêm
//  do app/layout.tsx, então não são repetidos aqui.
// ================================================================

import { Suspense } from 'react';
import { getAllProducts } from '@/lib/queries/products';
import { HomeProducts } from '@/components/HomeProducts';
import { EmberParticles } from '@/components/EmberParticles';
import { getGeneralWaURL } from '@/lib/whatsapp';

export default async function HomePage() {
  const products = await getAllProducts();
  const waUrl = getGeneralWaURL();

  return (
    <main>
      {/* ══════════════════════════════════════════════ */}
      {/*  HERO                                          */}
      {/* ══════════════════════════════════════════════ */}
      <section className="hero" id="inicio" aria-label="Bem-vindo à Alphenix">
        <div className="hero__bg" aria-hidden="true">
          <div className="hero__glow hero__glow--main" />
          <div className="hero__glow hero__glow--secondary" />
          <div className="hero__grid-overlay" />
        </div>

        <EmberParticles />

        <div className="container hero__inner">
          {/* Left: Content */}
          <div className="hero__content">
            <p className="section-eyebrow reveal">Desperte o seu potencial</p>

            <h1 className="hero__title reveal reveal-delay-1">
              TREINE COM<br />
              <span className="text-gradient">QUALIDADE</span>
            </h1>

            <p className="hero__subtitle reveal reveal-delay-2">
              Suplementos das marcas mais confiáveis do mercado, com atendimento direto e entrega rápida em Montes Claros.
            </p>

            <div className="hero__actions reveal reveal-delay-3">
              <a href="#produtos" className="btn btn--primary">
                <i className="fa-solid fa-bolt" aria-hidden="true" />
                Ver Produtos
              </a>
              <a href={waUrl} className="btn btn--outline" target="_blank" rel="noopener noreferrer">
                <i className="fa-brands fa-whatsapp" aria-hidden="true" />
                Falar no WhatsApp
              </a>
            </div>

            <div className="hero__stats reveal reveal-delay-4" aria-label="Números da Alphenix">
              <div className="hero__stat">
                <span className="hero__stat-value text-gradient">Melhor Preço</span>
                <span className="hero__stat-label">Da Região</span>
              </div>
              <div className="hero__stat-sep" aria-hidden="true" />
              <div className="hero__stat">
                <span className="hero__stat-value text-gradient">Marcas Premium</span>
                <span className="hero__stat-label">Selecionadas</span>
              </div>
              <div className="hero__stat-sep" aria-hidden="true" />
              <div className="hero__stat">
                <span className="hero__stat-value text-gradient">Produtos 100%</span>
                <span className="hero__stat-label">Originais</span>
              </div>
            </div>
          </div>

          {/* Right: Logo Visual */}
          <div className="hero__visual reveal reveal-delay-2" aria-hidden="true">
            <div className="hero__phoenix-wrap">
              <div className="hero__phoenix-ring hero__phoenix-ring--outer" />
              <div className="hero__phoenix-ring hero__phoenix-ring--inner" />
              <div className="hero__phoenix-glow" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/images/logo_oficial.png"
                alt=""
                className="hero__phoenix-img"
                draggable={false}
              />
            </div>
          </div>
        </div>

        <a href="#produtos" className="hero__scroll" aria-label="Ir para produtos">
          <i className="fa-solid fa-chevron-down" aria-hidden="true" />
        </a>
      </section>

      <div className="divider" />

      {/* ══════════════════════════════════════════════ */}
      {/*  PRODUTOS                                      */}
      {/* ══════════════════════════════════════════════ */}
      <section className="section products-section" id="produtos">
        <div className="container">
          <div className="section-header reveal">
            <p className="section-eyebrow">Catálogo Alphenix</p>
            <h2 className="section-title">NOSSOS <span>PRODUTOS</span></h2>
            <p className="section-subtitle">
              Escolha o suplemento ideal para o seu objetivo e finalize seu pedido direto pelo WhatsApp.
            </p>
          </div>

          {/* useSearchParams (dentro de HomeProducts) exige Suspense */}
          <Suspense fallback={null}>
            <HomeProducts products={products} />
          </Suspense>
        </div>
      </section>

      <div className="divider" />

      {/* ══════════════════════════════════════════════ */}
      {/*  DIFERENCIAIS                                  */}
      {/* ══════════════════════════════════════════════ */}
      <section className="section features-section" id="sobre" aria-label="Por que escolher a Alphenix">
        <div className="container">
          <div className="section-header reveal">
            <p className="section-eyebrow">Por que Alphenix</p>
            <h2 className="section-title">A MARCA QUE <span>TRANSFORMA</span></h2>
            <p className="section-subtitle">
              Não vendemos apenas suplementos. Entregamos qualidade, confiança e resultados reais.
            </p>
          </div>

          <div className="features-grid">
            <article className="feature-card reveal reveal-delay-1">
              <div className="feature-card__icon-wrap" aria-hidden="true">
                <i className="fa-solid fa-shield-halved" />
              </div>
              <h3 className="feature-card__title">100% Original</h3>
              <p className="feature-card__text">
                Todos os produtos com nota fiscal e procedência garantida.
                Sem risco de falsificados — só o que há de melhor no mercado.
              </p>
            </article>

            <article className="feature-card reveal reveal-delay-2">
              <div className="feature-card__icon-wrap" aria-hidden="true">
                <i className="fa-brands fa-whatsapp" />
              </div>
              <h3 className="feature-card__title">Atendimento Direto</h3>
              <p className="feature-card__text">
                Compre direto pelo WhatsApp, sem intermediários. Atendimento
                personalizado, rápido e sem burocracia.
              </p>
            </article>

            <article className="feature-card reveal reveal-delay-3">
              <div className="feature-card__icon-wrap" aria-hidden="true">
                <i className="fa-solid fa-truck-fast" />
              </div>
              <h3 className="feature-card__title">Entrega Garantida</h3>
              <p className="feature-card__text">
                Seus suplementos chegam com segurança e rapidez.
                Para você não perder nenhum dia de treino por falta de suporte.
              </p>
            </article>

            <article className="feature-card reveal reveal-delay-4">
              <div className="feature-card__icon-wrap" aria-hidden="true">
                <i className="fa-solid fa-award" />
              </div>
              <h3 className="feature-card__title">Marcas Top</h3>
              <p className="feature-card__text">
                Dark Wolf, DUX, Max Titanium, IntegralMédica, Probiótica e mais.
                Só trabalhamos com marcas que comprovam resultado.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════ */}
      {/*  CTA BANNER                                    */}
      {/* ══════════════════════════════════════════════ */}
      <section className="cta-banner reveal" aria-label="Chamada para ação">
        <div className="cta-banner__bg" aria-hidden="true" />
        <div className="container cta-banner__inner">
          <div className="cta-banner__content">
            <h2 className="cta-banner__title">
              PRONTO PARA <span className="text-gradient">EVOLUIR?</span>
            </h2>
            <p className="cta-banner__subtitle">
              Entre em contato agora e garanta seus suplementos com atendimento personalizado.
            </p>
          </div>
          <a
            href={waUrl}
            className="btn btn--whatsapp cta-banner__btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            <i className="fa-brands fa-whatsapp" aria-hidden="true" />
            CHAMAR NO WHATSAPP
          </a>
        </div>
      </section>
    </main>
  );
}
