'use client';
// ================================================================
//  ALPHENIX — components/cart/CartButton.tsx
//
//  Botão/ícone global do carrinho com contador.
// ================================================================

import { useCart } from './CartContext';
import styles from './Cart.module.css';

interface CartButtonProps {
  variant?: 'icon' | 'menu';
  onClick?: () => void;
}

export function CartButton({ variant = 'icon', onClick }: CartButtonProps) {
  const { totalQuantity, openCart } = useCart();

  function handleClick() {
    onClick?.();
    openCart();
  }

  if (variant === 'menu') {
    return (
      <button
        type="button"
        className={styles.cartMenuButton}
        onClick={handleClick}
        aria-label={`Ver carrinho com ${totalQuantity} item${totalQuantity === 1 ? '' : 's'}`}
      >
        <span className={styles.cartMenuButtonIcon} aria-hidden="true">
          <i className="fa-solid fa-cart-shopping" />
        </span>
        <span>Ver carrinho</span>
        {totalQuantity > 0 && (
          <strong className={styles.cartMenuButtonCount}>{totalQuantity}</strong>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      className={styles.cartIconButton}
      onClick={handleClick}
      aria-label={`Ver carrinho com ${totalQuantity} item${totalQuantity === 1 ? '' : 's'}`}
    >
      <i className="fa-solid fa-cart-shopping" aria-hidden="true" />
      {totalQuantity > 0 && (
        <span className={styles.cartCount} aria-hidden="true">
          {totalQuantity > 99 ? '99+' : totalQuantity}
        </span>
      )}
    </button>
  );
}
