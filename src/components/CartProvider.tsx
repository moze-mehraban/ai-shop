"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

export type CartItem = {
  productId: string;
  variantId?: string | null;
  variantName?: string | null;
  title: string;
  price: number;
  imageUrl: string | null;
  stock: number;
  quantity: number;
};

type AddCartItem = Omit<CartItem, "quantity">;

// هر ردیف سبد با «محصول + تنوع» شناخته می‌شود
export function getCartKey(item: Pick<CartItem, "productId" | "variantId">) {
  return item.variantId ? `${item.productId}::${item.variantId}` : item.productId;
}

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  totalPrice: number;
  addItem: (item: AddCartItem, quantity?: number) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
};

const STORAGE_KEY = "ai-shop-cart";
const CART_EVENT = "ai-shop-cart-updated";
const EMPTY_CART: CartItem[] = [];

let cartCache: CartItem[] | null = null;

const CartContext = createContext<CartContextValue | null>(null);

function readCart(): CartItem[] {
  if (typeof window === "undefined") {
    return EMPTY_CART;
  }

  if (cartCache) {
    return cartCache;
  }

  try {
    const storedCart = window.localStorage.getItem(STORAGE_KEY);
    const parsedCart = storedCart ? (JSON.parse(storedCart) as CartItem[]) : [];

    cartCache = parsedCart.filter(
      (item) =>
        typeof item.productId === "string" &&
        typeof item.title === "string" &&
        typeof item.price === "number" &&
        typeof item.stock === "number" &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0,
    );
  } catch {
    cartCache = [];
  }

  return cartCache;
}

function saveCart(items: CartItem[]) {
  cartCache = items;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CART_EVENT));
}

function subscribeToCart(callback: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      cartCache = null;
      callback();
    }
  };

  window.addEventListener(CART_EVENT, callback);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(CART_EVENT, callback);
    window.removeEventListener("storage", handleStorage);
  };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(subscribeToCart, readCart, () => EMPTY_CART);

  const addItem = useCallback((item: AddCartItem, quantity = 1) => {
    const currentItems = readCart();
    const key = getCartKey(item);
    const existingItem = currentItems.find(
      (cartItem) => getCartKey(cartItem) === key,
    );
    const safeQuantity = Math.max(1, Math.min(quantity, item.stock));

    if (existingItem) {
      saveCart(
        currentItems.map((cartItem) =>
          getCartKey(cartItem) === key
            ? {
                ...cartItem,
                ...item,
                quantity: Math.min(
                  cartItem.quantity + safeQuantity,
                  item.stock,
                ),
              }
            : cartItem,
        ),
      );
      return;
    }

    saveCart([...currentItems, { ...item, quantity: safeQuantity }]);
  }, []);

  const updateQuantity = useCallback(
    (key: string, quantity: number) => {
      const currentItems = readCart();

      saveCart(
        currentItems
          .map((item) =>
            getCartKey(item) === key
              ? {
                  ...item,
                  quantity: Math.max(0, Math.min(quantity, item.stock)),
                }
              : item,
          )
          .filter((item) => item.quantity > 0),
      );
    },
    [],
  );

  const removeItem = useCallback((key: string) => {
    saveCart(readCart().filter((cartItem) => getCartKey(cartItem) !== key));
  }, []);

  const clearCart = useCallback(() => {
    saveCart([]);
  }, []);

  const value = useMemo(
    () => ({
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      ),
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [addItem, clearCart, items, removeItem, updateQuantity],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}
