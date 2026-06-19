// ================================================================
//  ALPHENIX — lib/payment.ts
//
//  Configuração central de pagamento/desconto.
//  Para mudar o desconto de Pix/Dinheiro, altere APENAS a constante
//  PAYMENT_DISCOUNT_PERCENT abaixo.
// ================================================================

export const PAYMENT_DISCOUNT_PERCENT = 2;

export type PaymentMethod = 'pix' | 'dinheiro' | 'cartao';

export const PAYMENT_METHOD_OPTIONS: Array<{
  value: PaymentMethod;
  label: string;
  description: string;
}> = [
  {
    value: 'pix',
    label: 'Pix',
    description: `${PAYMENT_DISCOUNT_PERCENT}% de desconto`,
  },
  {
    value: 'dinheiro',
    label: 'Dinheiro',
    description: `${PAYMENT_DISCOUNT_PERCENT}% de desconto`,
  },
  {
    value: 'cartao',
    label: 'Cartão',
    description: 'Preço normal',
  },
];

export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function getPaymentMethodLabel(paymentMethod: PaymentMethod): string {
  const option = PAYMENT_METHOD_OPTIONS.find(item => item.value === paymentMethod);
  return option?.label ?? 'Pix';
}

export function getPaymentDiscountPercent(paymentMethod: PaymentMethod): number {
  return paymentMethod === 'pix' || paymentMethod === 'dinheiro'
    ? PAYMENT_DISCOUNT_PERCENT
    : 0;
}

export function calculatePaymentDiscount(
  value: number,
  paymentMethod: PaymentMethod
): number {
  const discountPercent = getPaymentDiscountPercent(paymentMethod);
  if (discountPercent <= 0) return 0;

  return roundCurrency(value * (discountPercent / 100));
}

export function calculateDiscountedPrice(
  value: number,
  paymentMethod: PaymentMethod
): number {
  return roundCurrency(value - calculatePaymentDiscount(value, paymentMethod));
}
