import { api } from './client';

export interface CreateListingPayload {
  kind: 'TIME' | 'SELECAO';
  teamName: string;
  continent: 'AMERICA' | 'EUROPA' | 'ASIA' | 'AFRICA' | 'OCEANIA';
  country: string;
  season: string;
  supplier: string;
  model: string;
  garmentType: 'LOJA' | 'JOGO';
  size: string;
  condition: string;
  gender: 'MASCULINO' | 'FEMININO';
  priceCents: number;
  description?: string;
  nonVerifiedSupplierAck: boolean;
}

export interface ListingPublic {
  listingId: string;
  sellerId: string;
  sellerName?: string;
  kind: string;
  teamName: string;
  continent: string;
  country: string;
  season: string;
  supplier: string;
  model: string;
  garmentType: string;
  size: string;
  condition: string;
  gender: string;
  priceCents: number;
  description?: string;
  photoKeys: string[];
  isMpc: boolean;
  status: string;
  createdAt: string;
}

export const ListingsApi = {
  create(payload: CreateListingPayload): Promise<{ listing: ListingPublic; listingsActiveCount: number }> {
    return api.post('/listings', payload).then((r) => r.data);
  },
  mine(): Promise<ListingPublic[]> {
    return api.get('/listings/mine').then((r) => r.data);
  },
  updatePrice(listingId: string, priceCents: number): Promise<ListingPublic> {
    return api.patch(`/listings/${listingId}/price`, { priceCents }).then((r) => r.data);
  },
  feed(limit = 40): Promise<ListingPublic[]> {
    return api.get(`/listings/feed?limit=${limit}`).then((r) => r.data);
  },
  remove(listingId: string): Promise<void> {
    return api.patch(`/listings/${listingId}/remove`).then(() => undefined);
  },
  listBySeller(sellerId: string): Promise<ListingPublic[]> {
    return api.get<ListingPublic[]>(`/listings/seller/${sellerId}`).then((r) => r.data);
  },
};
