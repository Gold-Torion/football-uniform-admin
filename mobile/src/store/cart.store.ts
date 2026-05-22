import { create } from 'zustand';
import type { ListingPublic } from '../api/listings';

interface CartItem {
  listing: ListingPublic;
  addedAt: string;
}

interface CartState {
  items: CartItem[];
  addItem:    (listing: ListingPublic) => { alreadyInCart: boolean };
  removeItem: (listingId: string) => void;
  clearCart:  () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (listing) => {
    const exists = get().items.some((i) => i.listing.listingId === listing.listingId);
    if (exists) return { alreadyInCart: true };
    set((s) => ({ items: [...s.items, { listing, addedAt: new Date().toISOString() }] }));
    return { alreadyInCart: false };
  },

  removeItem: (listingId) =>
    set((s) => ({ items: s.items.filter((i) => i.listing.listingId !== listingId) })),

  clearCart: () => set({ items: [] }),
}));
