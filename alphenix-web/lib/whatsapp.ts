// ================================================================
//  ALPHENIX — lib/whatsapp.ts
//
//  Helpers compartilhados para montar links wa.me.
//  Usado pelo Header, Hero, Footer, CTA banner e cards de produto
//  da home — e pode futuramente substituir a lógica duplicada
//  que já existe em app/produtos/[slug]/page.tsx, se quiser.
// ================================================================

export const WHATSAPP_NUMBER = '5538998926729';

export function getWaURL(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function getGeneralWaURL(): string {
  return getWaURL('Olá! Quero saber mais sobre os produtos Alphenix. 🔥');
}

export function getProductWaURL(product: {
  name: string;
  brand: string;
  price: number;
}): string {
  const price = `R$ ${product.price.toFixed(2).replace('.', ',')}`;
  const msg = [
    'Olá! Tenho interesse no produto:',
    '',
    `*${product.name} — ${product.brand}*`,
    `Preço: *${price}*`,
    '',
    'Poderia me passar mais informações? 🙏',
  ].join('\n');
  return getWaURL(msg);
}
