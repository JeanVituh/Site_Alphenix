'use client';
// ================================================================
//  ALPHENIX — components/cart/CartDrawer.tsx
//
//  Drawer lateral do carrinho, com alteração de quantidade,
//  remoção de item, total estimado e finalização pelo WhatsApp.
// ================================================================

import { useEffect } from 'react';
import Link from 'next/link';
import { useCart } from './CartContext';
import {
  formatCurrencyBR,
  getCartItemSubtotal,
  getCartWhatsappUrl,
  getFulfillmentLabel,
  getVariationLabel,
} from '@/lib/cart';
import styles from './Cart.module.css';

function assetUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('/')) return path;
  return '/' + path;
}

export function CartDrawer() {
  const {
    items,
    isCartOpen,
    closeCart,
    removeItem,
    updateQuantity,
    incrementItem,
    decrementItem,
    clearCart,
    estimatedTotal,
    totalQuantity,
    hasEncomenda,
  } = useCart();

  useEffect(() => {
    if (!isCartOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') closeCart();
    }

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isCartOpen, closeCart]);

  const prontaEntrega = items.filter(item => item.fulfillment === 'pronta_entrega');
  const encomenda = items.filter(item => item.fulfillment === 'encomenda');
  const whatsappUrl = items.length > 0 ? getCartWhatsappUrl(items) : '#';

  return (
    <>
      <button
        type="button"
        className={`${styles.cartOverlay}${isCartOpen ? ` ${styles.cartOverlayOpen}` : ''}`}
        aria-label="Fechar carrinho"
        onClick={closeCart}
      />

      <aside
        className={`${styles.cartDrawer}${isCartOpen ? ` ${styles.cartDrawerOpen}` : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Carrinho de compras"
      >
        <div className={styles.cartHeader}>
          <div>
            <p className={styles.cartEyebrow}>Pedido ALPHENIX</p>
            <h2 className={styles.cartTitle}>Carrinho</h2>
          </div>

          <button
            type="button"
            className={styles.cartClose}
            onClick={closeCart}
            aria-label="Fechar carrinho"
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className={styles.cartEmpty}>
            <div className={styles.cartEmptyIcon} aria-hidden="true">
              <i className="fa-solid fa-cart-shopping" />
            </div>
            <h3>Seu carrinho está vazio</h3>
            <p>Escolha um produto, selecione a variação e adicione ao carrinho.</p>
            <button type="button" className={styles.cartPrimaryButton} onClick={closeCart}>
              Continuar comprando
            </button>
          </div>
        ) : (
          <>
            <div className={styles.cartSummaryBar}>
              <span>
               {totalQuantity} {totalQuantity === 1 ? 'item' : 'itens'} no carrinho
              </span>
              <strong>{formatCurrencyBR(estimatedTotal)}</strong>
            </div>

            <div className={styles.cartItems}>
              {hasEncomenda && (
                <div className={styles.cartNotice}>
                  <i className="fa-solid fa-box-open" aria-hidden="true" />
                  <p>
                    Itens de encomenda serão separados no WhatsApp para confirmar prazo e disponibilidade.
                  </p>
                </div>
              )}

              {prontaEntrega.length > 0 && (
                <section className={styles.cartGroup}>
                  <h3 className={styles.cartGroupTitle}>
                    <i className="fa-solid fa-bolt" aria-hidden="true" />
                    Produtos à pronta entrega
                  </h3>
                  {prontaEntrega.map(item => (
                    <CartDrawerItem
                      key={item.skuId}
                      item={item}
                      onRemove={() => removeItem(item.skuId)}
                      onIncrement={() => incrementItem(item.skuId)}
                      onDecrement={() => decrementItem(item.skuId)}
                      onQuantityChange={(quantity) => updateQuantity(item.skuId, quantity)}
                    />
                  ))}
                </section>
              )}

              {encomenda.length > 0 && (
                <section className={styles.cartGroup}>
                  <h3 className={styles.cartGroupTitle}>
                    <i className="fa-solid fa-box-open" aria-hidden="true" />
                    Produtos para encomenda
                  </h3>
                  {encomenda.map(item => (
                    <CartDrawerItem
                      key={item.skuId}
                      item={item}
                      onRemove={() => removeItem(item.skuId)}
                      onIncrement={() => incrementItem(item.skuId)}
                      onDecrement={() => decrementItem(item.skuId)}
                      onQuantityChange={(quantity) => updateQuantity(item.skuId, quantity)}
                    />
                  ))}
                </section>
              )}
            </div>

            <div className={styles.cartFooter}>
              <div className={styles.cartTotalRow}>
                <span>Total estimado</span>
                <strong>{formatCurrencyBR(estimatedTotal)}</strong>
              </div>

              <a
                href={whatsappUrl}
                className={styles.whatsappCheckout}
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fa-brands fa-whatsapp" aria-hidden="true" />
                Finalizar no WhatsApp
              </a>

              <div className={styles.cartFooterActions}>
                <button type="button" onClick={closeCart}>
                  Continuar comprando
                </button>
                <button type="button" onClick={clearCart}>
                  Limpar carrinho
                </button>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

interface CartDrawerItemProps {
  item: import('@/lib/cart').CartItem;
  onRemove: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onQuantityChange: (quantity: number) => void;
}

function CartDrawerItem({
  item,
  onRemove,
  onIncrement,
  onDecrement,
  onQuantityChange,
}: CartDrawerItemProps) {
  const imageUrl = assetUrl(item.imageUrl);
  const variationLabel = getVariationLabel(item);
  const maxReached = item.fulfillment === 'pronta_entrega' && item.stock > 0 && item.quantity >= item.stock;

  return (
    <article className={styles.cartItem}>
      <Link
        href={`/produtos/${item.productSlug}`}
        className={styles.cartItemImage}
        onClick={(event) => {
          // Mantém o link funcional, mas deixa o drawer fechar naturalmente pelo usuário
          // se preferir continuar olhando o carrinho.
          if (event.metaKey || event.ctrlKey) return;
        }}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={item.productName} />
        ) : (
          <span>{item.brand.slice(0, 2)}</span>
        )}
      </Link>

      <div className={styles.cartItemInfo}>
        <div className={styles.cartItemTop}>
          <div>
            <span className={styles.cartItemBrand}>{item.brand}</span>
            <h4 className={styles.cartItemName}>{item.productName}</h4>
          </div>

          <button type="button" className={styles.cartRemove} onClick={onRemove} aria-label="Remover item">
            <i className="fa-solid fa-trash" aria-hidden="true" />
          </button>
        </div>

        {variationLabel && <p className={styles.cartItemVariation}>{variationLabel}</p>}

        <div className={styles.cartItemBadges}>
          <span className={item.fulfillment === 'pronta_entrega' ? styles.badgeReady : styles.badgeOrder}>
            {getFulfillmentLabel(item.fulfillment)}
          </span>
        </div>

        <div className={styles.cartItemBottom}>
          <div className={styles.quantityControl}>
            <button type="button" onClick={onDecrement} aria-label="Diminuir quantidade">
              <i className="fa-solid fa-minus" aria-hidden="true" />
            </button>
            <input
              type="number"
              min={1}
              max={item.fulfillment === 'pronta_entrega' && item.stock > 0 ? item.stock : undefined}
              value={item.quantity}
              onChange={(event) => onQuantityChange(Number(event.target.value))}
              aria-label="Quantidade"
            />
            <button
              type="button"
              onClick={onIncrement}
              aria-label="Aumentar quantidade"
              disabled={maxReached}
            >
              <i className="fa-solid fa-plus" aria-hidden="true" />
            </button>
          </div>

          <div className={styles.cartItemPrice}>
            <span>{formatCurrencyBR(item.unitPrice)}</span>
            <strong>{formatCurrencyBR(getCartItemSubtotal(item))}</strong>
          </div>
        </div>
      </div>
    </article>
  );
}
