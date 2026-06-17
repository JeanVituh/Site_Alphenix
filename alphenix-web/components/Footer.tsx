// ================================================================
//  ALPHENIX — Footer (components/Footer.tsx)
//
//  Server Component (não precisa de interatividade) renderizado
//  globalmente em app/layout.tsx — aparece em todas as páginas.
//  Categorias vêm de lib/categories.ts (mesma lista usada nas
//  abas de filtro da home), e o link de cada categoria já leva
//  para a home com a aba certa pré-selecionada via ?categoria=.
// ================================================================

import Link from 'next/link';
import { CATEGORIES } from '@/lib/categories';
import { getGeneralWaURL } from '@/lib/whatsapp';

export function Footer() {
  const waUrl = getGeneralWaURL();

  return (
    <footer className="footer" id="contato">
      <div className="footer__body">
        <div className="container footer__inner">

          {/* Brand */}
          <div className="footer__brand">
            <Link href="/" className="footer__logo-link" aria-label="Alphenix — Topo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/images/logo_oficial.png"
                alt="Alphenix"
                className="footer__logo"
                height={56}
              />
            </Link>
            <p className="footer__tagline">
              Desperte o seu potencial.<br />
              Treine como um campeão.
            </p>
            <div className="footer__social" aria-label="Redes sociais">
              <a
                href="#"
                className="footer__social-link"
                aria-label="Instagram"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fa-brands fa-instagram" aria-hidden="true" />
              </a>
              <a
                href={waUrl}
                className="footer__social-link footer__social-link--wa"
                aria-label="WhatsApp"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fa-brands fa-whatsapp" aria-hidden="true" />
              </a>
              <a
                href="#"
                className="footer__social-link"
                aria-label="TikTok"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fa-brands fa-tiktok" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div className="footer__nav-col">
            <h3 className="footer__col-title">Navegação</h3>
            <ul className="footer__nav-list">
              <li><Link href="/#inicio">Início</Link></li>
              <li><Link href="/#produtos">Produtos</Link></li>
              <li><Link href="/#sobre">Diferenciais</Link></li>
              <li><Link href="/#contato">Contato</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div className="footer__nav-col">
            <h3 className="footer__col-title">Categorias</h3>
            <ul className="footer__nav-list">
              {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                <li key={cat.id}>
                  <Link href={`/?categoria=${encodeURIComponent(cat.id)}#produtos`}>{cat.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="footer__nav-col">
            <h3 className="footer__col-title">Contato</h3>
            <a
              href={waUrl}
              className="footer__wa-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fa-brands fa-whatsapp" aria-hidden="true" />
              Fale conosco pelo WhatsApp
            </a>
            <p className="footer__contact-note">
              Atendimento via WhatsApp<br />
              Segunda a Sábado · 8h às 18h
            </p>
          </div>

        </div>
      </div>

      <div className="divider" />

      <div className="footer__bottom">
        <div className="container footer__bottom-inner">
          <p className="footer__copy">© 2026 Alphenix Suplementos · Todos os direitos reservados.</p>
          <p className="footer__made">
            Feito com <span className="text-gradient" aria-label="fogo">🔥</span> para campeões
          </p>
        </div>
      </div>
    </footer>
  );
}
