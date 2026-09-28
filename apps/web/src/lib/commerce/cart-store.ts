// apps/web/src/lib/commerce/cart-store.ts — Client Cart Store & LocalStorage Persistence

import {
  type CartLine,
  MAX_QUANTITY_PER_LINE,
} from '@caribbean/marketplace';
import React, { useState, useEffect } from 'react';

export const CART_STORAGE_KEY = 'tukubi_cart';
export const CART_CHANGE_EVENT = 'tukubi:cart:change';
export const CART_ADD_EVENT = 'tukubi:cart:add';

type CartListener = (lines: CartLine[]) => void;
const memoryListeners = new Set<CartListener>();

/**
 * In-memory fallback for SSR and environments without localStorage.
 */
let inMemoryCart: CartLine[] = [];

/**
 * Safe helper to obtain localStorage whether from window or globalThis.
 */
function getStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // Ignore window access errors
  }

  try {
    if (typeof localStorage !== 'undefined' && localStorage) {
      return localStorage;
    }
  } catch {
    // Ignore global localStorage access errors
  }

  return null;
}

/**
 * Dispatches a custom event on window for cross-component and tab reactive synchronization.
 */
function dispatchCartEvent<T>(eventName: string, detail: T): void {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    try {
      const event = new CustomEvent(eventName, { detail });
      window.dispatchEvent(event);
    } catch {
      // In non-standard or restricted environments, swallow dispatch error
    }
  }
}

/**
 * Notifies all in-memory subscribers.
 */
function notifyListeners(lines: CartLine[]): void {
  memoryListeners.forEach((listener) => {
    try {
      listener(lines);
    } catch {
      // Ignore listener error
    }
  });
}

/**
 * Reads the current cart lines from storage or in-memory fallback.
 */
export function getCartLines(): CartLine[] {
  const storage = getStorage();
  if (!storage) {
    return [...inMemoryCart];
  }

  try {
    const raw = storage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      inMemoryCart = parsed;
      return parsed;
    }
    return [];
  } catch {
    return [...inMemoryCart];
  }
}

/**
 * Persists cart lines to storage, memory, and notifies listeners.
 */
function persistCartLines(lines: CartLine[]): void {
  inMemoryCart = [...lines];
  const storage = getStorage();
  if (storage) {
    try {
      storage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Quota exceeded or storage restricted
    }
  }
  notifyListeners(lines);
}

/**
 * Adds an item to the cart or increments its quantity if it already exists with identical variant.
 */
export function addCartLine(newLine: CartLine): CartLine[] {
  const currentLines = getCartLines();
  const index = currentLines.findIndex(
    (l) => l.productId === newLine.productId && (l.variantId || null) === (newLine.variantId || null)
  );

  let updatedLines: CartLine[];

  if (index >= 0) {
    const existing = currentLines[index];
    const newQty = Math.min(existing.quantity + (newLine.quantity || 1), MAX_QUANTITY_PER_LINE);
    updatedLines = [
      ...currentLines.slice(0, index),
      { ...existing, quantity: newQty },
      ...currentLines.slice(index + 1),
    ];
  } else {
    const clampedQty = Math.min(Math.max(1, newLine.quantity || 1), MAX_QUANTITY_PER_LINE);
    updatedLines = [...currentLines, { ...newLine, quantity: clampedQty }];
  }

  persistCartLines(updatedLines);
  dispatchCartEvent(CART_ADD_EVENT, { line: newLine, lines: updatedLines });
  dispatchCartEvent(CART_CHANGE_EVENT, { lines: updatedLines });

  return updatedLines;
}

/**
 * Updates the quantity for a specific line item. Removes item if quantity is <= 0.
 */
export function updateCartQuantity(
  productId: string,
  variantId: string | undefined,
  quantity: number
): CartLine[] {
  const currentLines = getCartLines();

  if (quantity <= 0) {
    return removeCartLine(productId, variantId);
  }

  const clampedQty = Math.min(Math.max(1, quantity), MAX_QUANTITY_PER_LINE);
  const updatedLines = currentLines.map((line) => {
    if (line.productId === productId && (line.variantId || null) === (variantId || null)) {
      return { ...line, quantity: clampedQty };
    }
    return line;
  });

  persistCartLines(updatedLines);
  dispatchCartEvent(CART_CHANGE_EVENT, { lines: updatedLines });

  return updatedLines;
}

/**
 * Removes a line item from the cart matching productId and optional variantId.
 */
export function removeCartLine(productId: string, variantId: string | undefined): CartLine[] {
  const currentLines = getCartLines();
  const updatedLines = currentLines.filter(
    (line) => !(line.productId === productId && (line.variantId || null) === (variantId || null))
  );

  persistCartLines(updatedLines);
  dispatchCartEvent(CART_CHANGE_EVENT, { lines: updatedLines });

  return updatedLines;
}

/**
 * Clears all items from the cart.
 */
export function clearCart(): void {
  inMemoryCart = [];
  const storage = getStorage();
  if (storage) {
    try {
      storage.removeItem(CART_STORAGE_KEY);
    } catch {
      // Storage restricted
    }
  }
  notifyListeners([]);
  dispatchCartEvent(CART_CHANGE_EVENT, { lines: [] });
}

/**
 * Subscribes a listener to cart changes across components and storage events.
 * Returns an unsubscribe callback.
 */
export function subscribeCart(listener: (lines: CartLine[]) => void): () => void {
  memoryListeners.add(listener);

  if (typeof window === 'undefined') {
    return () => {
      memoryListeners.delete(listener);
    };
  }

  const handleCustomEvent = (e: Event) => {
    const customEvent = e as CustomEvent<{ lines?: CartLine[] }>;
    if (customEvent.detail && Array.isArray(customEvent.detail.lines)) {
      listener(customEvent.detail.lines);
    } else {
      listener(getCartLines());
    }
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === CART_STORAGE_KEY) {
      listener(getCartLines());
    }
  };

  window.addEventListener(CART_CHANGE_EVENT, handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    memoryListeners.delete(listener);
    window.removeEventListener(CART_CHANGE_EVENT, handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
  };
}

/**
 * React hook for consuming and updating cart state reactively.
 */
export function useCartStore() {
  const [lines, setLines] = useState<CartLine[]>(() => {
    return getCartLines();
  });

  useEffect(() => {
    setLines(getCartLines());
    const unsubscribe = subscribeCart((updated) => {
      setLines(updated);
    });
    return unsubscribe;
  }, []);

  return {
    lines,
    addCartLine,
    updateCartQuantity,
    removeCartLine,
    clearCart,
    count: lines.reduce((acc, curr) => acc + curr.quantity, 0),
  };
}
