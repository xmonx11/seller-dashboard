import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CART_STORAGE_KEY = 'cart_items';

type CartItem = {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  quantity: number;
  stock: number; // ✅ NEW: track max stock
};

type CartState = {
  items: CartItem[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalAmount: () => number;
};

const persist = async (items: CartItem[]) => {
  try {
    await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Cart persist error:', e);
  }
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(CART_STORAGE_KEY);
      const savedItems: CartItem[] = raw ? JSON.parse(raw) : [];
      set({ items: savedItems, hydrated: true });
    } catch (e) {
      console.error('Cart hydrate error:', e);
      set({ hydrated: true });
    }
  },

  addItem: (product) => {
    const incomingQty = product.quantity ?? 1;
    const existing = get().items.find((i) => i.id === product.id);
    let updatedItems: CartItem[];

    if (existing) {
      // ✅ Cap at available stock when adding more
      const newQty = Math.min(existing.quantity + incomingQty, product.stock);
      updatedItems = get().items.map((i) =>
        i.id === product.id ? { ...i, quantity: newQty } : i
      );
    } else {
      // ✅ Cap initial quantity at stock
      const clampedQty = Math.min(incomingQty, product.stock);
      updatedItems = [...get().items, { ...product, quantity: clampedQty }];
    }

    set({ items: updatedItems });
    persist(updatedItems);
  },

  removeItem: (id) => {
    const updatedItems = get().items.filter((i) => i.id !== id);
    set({ items: updatedItems });
    persist(updatedItems);
  },

  updateQuantity: (id, quantity) => {
    if (quantity <= 0) {
      get().removeItem(id);
      return;
    }
    // ✅ Cap at stock limit
    const item = get().items.find((i) => i.id === id);
    const maxQty = item?.stock ?? quantity;
    const clamped = Math.min(quantity, maxQty);

    const updatedItems = get().items.map((i) =>
      i.id === id ? { ...i, quantity: clamped } : i
    );
    set({ items: updatedItems });
    persist(updatedItems);
  },

  clearCart: () => {
    set({ items: [] });
    persist([]);
  },

  totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
  totalAmount: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
}));