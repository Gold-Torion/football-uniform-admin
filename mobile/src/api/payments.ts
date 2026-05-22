import { api } from './client';

export interface PixPaymentResult {
  orderId: string;
  pagarmeOrderId: string;
  pagarmeChargeId: string;
  pixQrCode: string;       // copy-paste PIX code
  pixQrCodeUrl: string;    // URL to QR image (optional fallback)
  pixExpiresAt: string;
  totalCents: number;
}

export interface PaymentStatusResult {
  orderId: string;
  status: string;
  pagarmeStatus: string | null;
}

export interface CardPaymentData {
  orderId:       string;
  installments:  number;
  cardNumber:    string;
  cardHolderName: string;
  cardExpMonth:  number;
  cardExpYear:   number;
  cardCvv:       string;
}

export interface CardPaymentResult {
  status:   'authorized' | 'refused' | 'pending';
  orderId:  string;
  chargeId: string;
}

export const PaymentsApi = {
  initiatePixPayment: (orderId: string): Promise<PixPaymentResult> =>
    api.post<PixPaymentResult>(`/payments/pix/${orderId}`).then((r) => r.data),

  initiateCardPayment: (data: CardPaymentData): Promise<CardPaymentResult> =>
    api.post<CardPaymentResult>('/payments/card', data).then((r) => r.data),

  getPaymentStatus: (orderId: string): Promise<PaymentStatusResult> =>
    api.get<PaymentStatusResult>(`/payments/status/${orderId}`).then((r) => r.data),
};
