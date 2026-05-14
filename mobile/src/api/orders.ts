import { api } from './client';

export type DeliveryMethod = 'CORREIOS' | 'ENTREGA_EM_MAOS';
export type OrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';

export interface OrderPublic {
  orderId: string; buyerId: string; buyerName: string;
  sellerId: string; sellerName: string; listingId: string;
  teamName: string; supplier: string; season: string;
  size: string; condition: string; priceCents: number; photoKeys: string[];
  deliveryMethod: DeliveryMethod; shippingCents: number; totalCents: number;
  buyerCep?: string; sellerCep?: string;
  status: OrderStatus; createdAt: string; updatedAt: string;
  // Melhor Envio fields
  shippingLabelUrl?:     string;
  shippingTrackingCode?: string;
  shippingCarrier?:      string;
  shippingService?:      string;
  melhorEnvioOrderId?:   string;
}

export interface ShippingOption {
  service: 'PAC' | 'SEDEX';
  priceCents: number;
  days: number;
}

export const OrdersApi = {
  create: (data: { listingId: string; deliveryMethod: DeliveryMethod; buyerCep?: string; couponCode?: string }) =>
    api.post<OrderPublic>('/orders', data).then((r: { data: OrderPublic }) => r.data),
  listMine: () =>
    api.get<OrderPublic[]>('/orders/mine').then((r: { data: OrderPublic[] }) => r.data),
  findOne: (orderId: string) =>
    api.get<OrderPublic>(`/orders/${orderId}`).then((r: { data: OrderPublic }) => r.data),
  confirmReceipt: (orderId: string) =>
    api.patch(`/orders/${orderId}/confirm-receipt`),
  estimateShipping: (fromCep: string, toCep: string) =>
    api.post<ShippingOption[]>('/orders/shipping-estimate', { fromCep, toCep }).then((r: { data: ShippingOption[] }) => r.data),
};
