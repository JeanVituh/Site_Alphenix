// ================================================================
//  ALPHENIX — lib/cart.ts
//
//  Tipos e helpers puros do carrinho. Não acessa localStorage aqui,
//  então pode ser usado tanto por componentes client quanto por testes.
// ================================================================

import { getWaURL } from '@/lib/whatsapp';
import {
  calculatePaymentDiscount,
  getPaymentDiscountPercent,
  getPaymentMethodLabel,
  roundCurrency,
  type PaymentMethod,
} from '@/lib/payment';

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

export interface CartTotals {
  subtotal: number;
  discountPercent: number;
  discount: number;
  total: number;
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

export function getCartTotals(
  items: CartItem[],
  paymentMethod: PaymentMethod
): CartTotals {
  const subtotal = getCartTotal(items);
  const discountPercent = getPaymentDiscountPercent(paymentMethod);
  const discount = calculatePaymentDiscount(subtotal, paymentMethod);

  return {
    subtotal,
    discountPercent,
    discount,
    total: roundCurrency(Math.max(0, subtotal - discount)),
  };
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
    `*${item.quantity}x ${headerParts.join(' - ')}*`,
    item.sabor ? `- Sabor: ${item.sabor}` : null,
    item.tamanho ? `- Tamanho: ${item.tamanho}` : null,
    item.embalagem ? `- Embalagem: ${item.embalagem}` : null,
    `- Status: *${getFulfillmentLabel(item.fulfillment)}*`,
    item.quantity > 1
      ? `- Valor: *${formatCurrencyBR(item.unitPrice)} cada*\n- Subtotal do item: *${formatCurrencyBR(getCartItemSubtotal(item))}*`
      : `- Valor: *${formatCurrencyBR(item.unitPrice)}*`,
  ];

  return lines
    .filter((line): line is string => Boolean(line && line.trim()))
    .join('\n');
}

export function buildCartWhatsappMessage(
  items: CartItem[],
  paymentMethod: PaymentMethod
): string {
  const prontaEntrega = items.filter(item => item.fulfillment === 'pronta_entrega');
  const encomenda = items.filter(item => item.fulfillment === 'encomenda');
  const totals = getCartTotals(items, paymentMethod);
  const paymentLabel = getPaymentMethodLabel(paymentMethod);

  // Evita emojis aqui porque alguns navegadores internos, como o do Instagram,
  // podem corromper esses caracteres ao abrir o WhatsApp.
  const message: string[] = [
    '*Olá! Quero fazer um pedido na ALPHENIX*',
    '',
  ];

  if (prontaEntrega.length > 0) {
    message.push('*PRODUTOS A PRONTA ENTREGA*', '------------------------------');
    message.push(prontaEntrega.map(buildWhatsappItemBlock).join('\n\n'));
    message.push('');
  }

  if (encomenda.length > 0) {
    message.push('*PRODUTOS PARA ENCOMENDA*', '------------------------------');
    message.push(encomenda.map(buildWhatsappItemBlock).join('\n\n'));
    message.push('');
  }

  message.push('*RESUMO DO PEDIDO*');
  message.push('------------------------------');
  message.push(`Forma de pagamento: *${paymentLabel}*`);
  message.push(`Subtotal: *${formatCurrencyBR(totals.subtotal)}*`);

  if (totals.discount > 0) {
    message.push(
      `Desconto Pix/Dinheiro (${totals.discountPercent}%): *-${formatCurrencyBR(totals.discount)}*`
    );
  }

  message.push(`Total: *${formatCurrencyBR(totals.total)}*`);
  message.push('');
  message.push('Pode confirmar disponibilidade, prazo e forma de pagamento?');

  return message.join('\n');
}

export function getCartWhatsappUrl(
  items: CartItem[],
  paymentMethod: PaymentMethod
): string {
  return getWaURL(buildCartWhatsappMessage(items, paymentMethod));
}

export function normalizeCartQuantity(item: CartItem, quantity: number): number {
  const safeQuantity = Math.max(1, Math.floor(quantity || 1));

  if (item.fulfillment === 'pronta_entrega' && item.stock > 0) {
    return Math.min(safeQuantity, item.stock);
  }

  return safeQuantity;
}
