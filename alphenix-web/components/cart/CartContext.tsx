'use client';
// ================================================================
//  ALPHENIX — components/cart/CartContext.tsx
//
//  Estado global do carrinho com localStorage.
//  Salva SKU, quantidade, status de pronta entrega/encomenda e
//  dados suficientes para montar a mensagem final do WhatsApp.
// ================================================================

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { CartAddInput, CartFulfillment, CartItem } from '@/lib/cart';
import {
  getCartQuantity,
  getCartTotal,
  normalizeCartQuantity,
} from '@/lib/cart';

const STORAGE_KEY = 'alphenix-cart-v1';

interface CartConfirmation {
  title: string;
  subtitle: string;
  fulfillment: CartFulfillment;
}

interface CartContextValue {
  items: CartItem[];
  totalQuantity: number;
  estimatedTotal: number;
  hasEncomenda: boolean;
  isCartOpen: boolean;
  confirmation: CartConfirmation | null;
  addItem: (input: CartAddInput) => boolean;
  removeItem: (skuId: string) => void;
  updateQuantity: (skuId: string, quantity: number) => void;
  incrementItem: (skuId: string) => void;
  decrementItem: (skuId: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  closeConfirmation: () => void;
  viewCartFromConfirmation: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function isValidCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== 'object') return false;

  const item = value as Partial<CartItem>;
  return (
    typeof item.skuId === 'string' &&
    typeof item.productId === 'string' &&
    typeof item.productSlug === 'string' &&
    typeof item.productName === 'string' &&
    typeof item.brand === 'string' &&
    typeof item.unitPrice === 'number' &&
    Number.isFinite(item.unitPrice) &&
    typeof item.quantity === 'number' &&
    item.quantity > 0 &&
    typeof item.stock === 'number' &&
    (item.fulfillment === 'pronta_entrega' || item.fulfillment === 'encomenda')
  );
}

function readStoredCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(isValidCartItem)
      .map(item => ({
        ...item,
        quantity: normalizeCartQuantity(item, item.quantity),
      }));
  } catch {
    return [];
  }
}

function writeStoredCart(items: CartItem[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Se o navegador bloquear localStorage, o carrinho continua funcionando
    // na memória da sessão atual.
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<CartConfirmation | null>(null);

  useEffect(() => {
    setItems(readStoredCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeStoredCart(items);
  }, [items, hydrated]);

  const addItem = useCallback((input: CartAddInput) => {
    if (!input.available || !input.skuId) return false;

    const fulfillment: CartFulfillment = input.stock > 0 ? 'pronta_entrega' : 'encomenda';
    const rawQuantity = input.quantity ?? 1;
    const requestedQuantity = Number.isFinite(rawQuantity)
      ? Math.max(1, Math.floor(rawQuantity))
      : 1;

    const itemCandidate: CartItem = {
      skuId: input.skuId,
      productId: input.productId,
      productSlug: input.productSlug,
      productName: input.productName,
      brand: input.brand,
      imageUrl: input.imageUrl,
      sabor: input.sabor,
      tamanho: input.tamanho,
      embalagem: input.embalagem,
      unitPrice: input.unitPrice,
      quantity: requestedQuantity,
      stock: input.stock,
      fulfillment,
      addedAt: new Date().toISOString(),
    };

    const newItem: CartItem = {
      ...itemCandidate,
      quantity: normalizeCartQuantity(itemCandidate, requestedQuantity),
    };

    setItems(prev => {
      const existing = prev.find(item => item.skuId === input.skuId);

      if (!existing) return [...prev, newItem];

      return prev.map(item => {
        if (item.skuId !== input.skuId) return item;

        const updatedItem: CartItem = {
          ...item,
          unitPrice: newItem.unitPrice,
          stock: newItem.stock,
          fulfillment: newItem.fulfillment,
          imageUrl: newItem.imageUrl,
        };

        return {
          ...updatedItem,
          quantity: normalizeCartQuantity(updatedItem, item.quantity + requestedQuantity),
        };
      });
    });

    setConfirmation(
      fulfillment === 'pronta_entrega'
        ? {
            title: 'Produto adicionado ao carrinho ✅',
            subtitle: 'Pronta entrega',
            fulfillment,
          }
        : {
            title: 'Produto adicionado como encomenda 📦',
            subtitle: 'Esse item será separado na mensagem do WhatsApp.',
            fulfillment,
          }
    );

    return true;
  }, []);

  const removeItem = useCallback((skuId: string) => {
    setItems(prev => prev.filter(item => item.skuId !== skuId));
  }, []);

  const updateQuantity = useCallback((skuId: string, quantity: number) => {
    setItems(prev =>
      prev.flatMap(item => {
        if (item.skuId !== skuId) return [item];
        if (quantity <= 0) return [];
        return [{ ...item, quantity: normalizeCartQuantity(item, quantity) }];
      })
    );
  }, []);

  const incrementItem = useCallback((skuId: string) => {
    setItems(prev =>
      prev.map(item =>
        item.skuId === skuId
          ? { ...item, quantity: normalizeCartQuantity(item, item.quantity + 1) }
          : item
      )
    );
  }, []);

  const decrementItem = useCallback((skuId: string) => {
    setItems(prev =>
      prev.flatMap(item => {
        if (item.skuId !== skuId) return [item];
        const nextQuantity = item.quantity - 1;
        if (nextQuantity <= 0) return [];
        return [{ ...item, quantity: normalizeCartQuantity(item, nextQuantity) }];
      })
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const openCart = useCallback(() => {
    setIsCartOpen(true);
  }, []);

  const closeCart = useCallback(() => {
    setIsCartOpen(false);
  }, []);

  const closeConfirmation = useCallback(() => {
    setConfirmation(null);
  }, []);

  const viewCartFromConfirmation = useCallback(() => {
    setConfirmation(null);
    setIsCartOpen(true);
  }, []);

  const value = useMemo<CartContextValue>(() => {
    return {
      items,
      totalQuantity: getCartQuantity(items),
      estimatedTotal: getCartTotal(items),
      hasEncomenda: items.some(item => item.fulfillment === 'encomenda'),
      isCartOpen,
      confirmation,
      addItem,
      removeItem,
      updateQuantity,
      incrementItem,
      decrementItem,
      clearCart,
      openCart,
      closeCart,
      closeConfirmation,
      viewCartFromConfirmation,
    };
  }, [
    items,
    isCartOpen,
    confirmation,
    addItem,
    removeItem,
    updateQuantity,
    incrementItem,
    decrementItem,
    clearCart,
    openCart,
    closeCart,
    closeConfirmation,
    viewCartFromConfirmation,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart precisa ser usado dentro de <CartProvider>.');
  }

  return context;
}
