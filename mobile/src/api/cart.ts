import { api } from './client';

export interface CartItemEntry {
  listingId:  string;
  sellerId:   string;
  sellerName: string;
  teamName:   string;
  supplier:   string;
  season:     string;
  size:       string;
  priceCents: number;
  photoKeys:  string[];
  addedAt:    string;
}

interface CartResponse {
  items: CartItemEntry[];
}

export const CartApi = {
  getCart(): Promise<CartItemEntry[]> {
    return api.get<CartResponse>('/cart').then((r) => r.data.items);
  },

  addItem(item: CartItemEntry): Promise<CartItemEntry[]> {
    return api.post<CartResponse>('/cart/items', { item }).then((r) => r.data.items);
  },

  removeItem(listingId: string): Promise<CartItemEntry[]> {
    return api
      .delete<CartResponse>(`/cart/items/${listingId}`)
      .then((r) => r.data.items);
  },

  clearCart(): Promise<void> {
    return api.delete('/cart').then(() => undefined);
  },
};
