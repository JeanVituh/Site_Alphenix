// ================================================================
//  ALPHENIX — lib/payment.ts
//
//  O preço salvo no banco já é o preço anunciado no Pix.
//  Não existe desconto fixo por forma de pagamento.
//  A porcentagem promocional é calculada entre compare_at_price e price.
// ================================================================

export const PAYMENT_DISCOUNT_PERCENT = 0;

export type PaymentMethod = 'pix' | 'dinheiro' | 'cartao';

export const PAYMENT_METHOD_OPTIONS: Array<{
  value: PaymentMethod;
  label: string;
  description: string;
}> = [
  { value: 'pix', label: 'Pix', description: 'Preço anunciado' },
  { value: 'dinheiro', label: 'Dinheiro', description: 'Preço anunciado' },
  { value: 'cartao', label: 'Cartão', description: 'Consulte condições' },
];

export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function getPaymentMethodLabel(paymentMethod: PaymentMethod): string {
  const option = PAYMENT_METHOD_OPTIONS.find(item => item.value === paymentMethod);
  return option?.label ?? 'Pix';
}

export function getPaymentDiscountPercent(_paymentMethod: PaymentMethod): number {
  return 0;
}

export function calculatePaymentDiscount(
  _value: number,
  _paymentMethod: PaymentMethod
): number {
  return 0;
}

export function calculateDiscountedPrice(
  value: number,
  _paymentMethod: PaymentMethod
): number {
  return roundCurrency(value);
}

/** Calcula o desconto real entre o preço antigo e o preço atual. */
export function calculateCompareAtDiscountPercent(
  currentPrice: number,
  compareAtPrice: number | null | undefined
): number | null {
  if (
    compareAtPrice == null ||
    !Number.isFinite(currentPrice) ||
    !Number.isFinite(compareAtPrice) ||
    currentPrice < 0 ||
    compareAtPrice <= currentPrice ||
    compareAtPrice <= 0
  ) {
    return null;
  }

  return Math.round(((compareAtPrice - currentPrice) / compareAtPrice) * 100);
}
