'use client';
// ================================================================
//  ALPHENIX — components/cart/CartRoot.tsx
//
//  Envolve o site com o Provider e renderiza Drawer + confirmação
//  visual de produto adicionado.
// ================================================================

import type { ReactNode } from 'react';
import { CartProvider, useCart } from './CartContext';
import { CartDrawer } from './CartDrawer';
import styles from './Cart.module.css';

export function CartRoot({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      {children}
      <CartDrawer />
      <CartConfirmation />
    </CartProvider>
  );
}

function CartConfirmation() {
  const {
    confirmation,
    closeConfirmation,
    viewCartFromConfirmation,
  } = useCart();

  if (!confirmation) return null;

  return (
    <div className={styles.cartConfirmation} role="status" aria-live="polite">
      <div
        className={
          confirmation.fulfillment === 'pronta_entrega'
            ? styles.confirmationIconReady
            : styles.confirmationIconOrder
        }
        aria-hidden="true"
      >
        <i
          className={
            confirmation.fulfillment === 'pronta_entrega'
              ? 'fa-solid fa-check'
              : 'fa-solid fa-box-open'
          }
        />
      </div>

      <div className={styles.confirmationContent}>
        <strong>{confirmation.title}</strong>
        <span>{confirmation.subtitle}</span>
      </div>

      <div className={styles.confirmationActions}>
        <button type="button" onClick={closeConfirmation}>
          Continuar comprando
        </button>
        <button type="button" onClick={viewCartFromConfirmation}>
          Ver carrinho
        </button>
      </div>
    </div>
  );
}
