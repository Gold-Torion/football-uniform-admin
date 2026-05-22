import { create } from 'zustand';
import { CartApi, type CartItemEntry } from '../api/cart';
import { useAuthStore } from './auth.store';
import type { ListingPublic } from '../api/listings';

interface CartState {
  items:   CartItemEntry[];
  loading: boolean;
  error:   string | null;

  /** Load cart from backend (no-op for guests — in-memory only). */
  loadCart:   () => Promise<void>;
  /** Add a listing to the cart. Returns { alreadyInCart } flag. */
  addItem:    (listing: ListingPublic) => Promise<{ alreadyInCart: boolean }>;
  /** Remove a single item by listingId. */
  removeItem: (listingId: string) => Promise<void>;
  /** Clear the entire cart. */
  clearCart:  () => Promise<void>;
}

function toEntry(listing: ListingPublic): CartItemEntry {
  return {
    listingId:  listing.listingId,
    sellerId:   listing.sellerId,
    sellerName: listing.sellerName ?? '',
    teamName:   listing.teamName,
    supplier:   listing.supplier,
    season:     listing.season,
    size:       listing.size,
    priceCents: listing.priceCents,
    photoKeys:  listing.photoKeys,
    addedAt:    new Date().toISOString(),
  };
}

function isAuthenticated(): boolean {
  const { accessToken, isGuest } = useAuthStore.getState();
  return !isGuest && accessToken !== null;
}

export const useCartStore = create<CartState>((set, get) => ({
  items:   [],
  loading: false,
  error:   null,

  async loadCart() {
    if (!isAuthenticated()) return; // guests keep in-memory state
    set({ loading: true, error: null });
    try {
      const items = await CartApi.getCart();
      set({ items });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load cart';
      set({ error: msg });
    } finally {
      set({ loading: false });
    }
  },

  async addItem(listing) {
    const alreadyInCart = get().items.some((i) => i.listingId === listing.listingId);
    if (alreadyInCart) return { alreadyInCart: true };

    const entry = toEntry(listing);

    if (!isAuthenticated()) {
      // Guest: in-memory only
      set((s) => ({ items: [...s.items, entry] }));
      return { alreadyInCart: false };
    }

    // Optimistic update
    set((s) => ({ items: [...s.items, entry] }));
    try {
      const items = await CartApi.addItem(entry);
      set({ items });
    } catch (e: unknown) {
      // Roll back optimistic update
      set((s) => ({ items: s.items.filter((i) => i.listingId !== entry.listingId) }));
      const msg = e instanceof Error ? e.message : 'Failed to add item';
      set({ error: msg });
    }
    return { alreadyInCart: false };
  },

  async removeItem(listingId) {
    if (!isAuthenticated()) {
      set((s) => ({ items: s.items.filter((i) => i.listingId !== listingId) }));
      return;
    }

    // Optimistic update
    const previous = get().items;
    set((s) => ({ items: s.items.filter((i) => i.listingId !== listingId) }));
    try {
      const items = await CartApi.removeItem(listingId);
      set({ items });
    } catch (e: unknown) {
      // Roll back
      set({ items: previous });
      const msg = e instanceof Error ? e.message : 'Failed to remove item';
      set({ error: msg });
    }
  },

  async clearCart() {
    if (!isAuthenticated()) {
      set({ items: [] });
      return;
    }

    // Optimistic update
    const previous = get().items;
    set({ items: [] });
    try {
      await CartApi.clearCart();
    } catch (e: unknown) {
      // Roll back
      set({ items: previous });
      const msg = e instanceof Error ? e.message : 'Failed to clear cart';
      set({ error: msg });
    }
  },
}));
