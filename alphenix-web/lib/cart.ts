// ================================================================
//  ALPHENIX — lib/cart.ts
//
//  Tipos e helpers puros do carrinho. Não acessa localStorage aqui,
//  então pode ser usado tanto por componentes client quanto por testes.
// ================================================================

import { getWaURL } from '@/lib/whatsapp';

export type CartFulfillment = 'pronta_entrega' | 'encomenda';

export interface CartItem {
  skuId: string;
  productId: string;
  productSlug: string;
  productName: string;
  brand: string;
  imageUrl: string | null;
  sabor: string | null;
  tamanho: string | null;
  embalagem: string | null;
  unitPrice: number;
  quantity: number;
  stock: number;
  fulfillment: CartFulfillment;
  addedAt: string;
}

export interface CartAddInput {
  skuId: string;
  productId: string;
  productSlug: string;
  productName: string;
  brand: string;
  imageUrl: string | null;
  sabor: string | null;
  tamanho: string | null;
  embalagem: string | null;
  unitPrice: number;
  stock: number;
  available: boolean;
}

export function formatCurrencyBR(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).replace(/\u00A0/g, ' ');
}

export function getCartItemSubtotal(item: CartItem): number {
  return item.unitPrice * item.quantity;
}

export function getCartTotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + getCartItemSubtotal(item), 0);
}

export function getCartQuantity(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function getFulfillmentLabel(fulfillment: CartFulfillment): string {
  return fulfillment === 'pronta_entrega' ? 'Pronta entrega' : 'Encomenda';
}

export function getVariationLabel(item: Pick<CartItem, 'sabor' | 'tamanho' | 'embalagem'>): string {
  return [item.sabor, item.tamanho, item.embalagem]
    .filter((value): value is string => Boolean(value && value.trim()))
    .join(' - ');
}

function buildWhatsappItemBlock(item: CartItem): string {
  const headerParts = [item.productName, item.brand]
    .filter((value): value is string => Boolean(value && value.trim()));

  const lines = [
    `${item.quantity}x ${headerParts.join(' - ')}`,
    item.sabor ? `Sabor: ${item.sabor}` : null,
    item.tamanho ? `Tamanho: ${item.tamanho}` : null,
    item.embalagem ? `Embalagem: ${item.embalagem}` : null,
    item.quantity > 1
      ? `Valor: ${formatCurrencyBR(item.unitPrice)} cada | Subtotal: ${formatCurrencyBR(getCartItemSubtotal(item))}`
      : `Valor: ${formatCurrencyBR(item.unitPrice)}`,
  ];

  return lines
    .filter((line): line is string => Boolean(line && line.trim()))
    .join('\n');
}

export function buildCartWhatsappMessage(items: CartItem[]): string {
  const prontaEntrega = items.filter(item => item.fulfillment === 'pronta_entrega');
  const encomenda = items.filter(item => item.fulfillment === 'encomenda');

  const message: string[] = [
    'Olá! Quero fazer um pedido na ALPHENIX 🔥',
    '',
  ];

  if (prontaEntrega.length > 0) {
    message.push('🛒 PRODUTOS À PRONTA ENTREGA:', '');
    message.push(prontaEntrega.map(buildWhatsappItemBlock).join('\n\n'));
    message.push('');
  }

  if (encomenda.length > 0) {
    message.push('📦 PRODUTOS PARA ENCOMENDA:', '');
    message.push(encomenda.map(buildWhatsappItemBlock).join('\n\n'));
    message.push('');
  }

  message.push(`Total estimado: ${formatCurrencyBR(getCartTotal(items))}`);
  message.push('');
  message.push('Pode confirmar disponibilidade, prazo e forma de pagamento?');

  return message.join('\n');
}

export function getCartWhatsappUrl(items: CartItem[]): string {
  return getWaURL(buildCartWhatsappMessage(items));
}

export function normalizeCartQuantity(item: CartItem, quantity: number): number {
  const safeQuantity = Math.max(1, Math.floor(quantity || 1));

  if (item.fulfillment === 'pronta_entrega' && item.stock > 0) {
    return Math.min(safeQuantity, item.stock);
  }

  return safeQuantity;
}
