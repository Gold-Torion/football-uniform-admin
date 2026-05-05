import { api } from './client';

export interface RedeemResult {
  code: string;
  discountPct: number;
  description: string;
}

export const CouponsApi = {
  redeem(code: string): Promise<RedeemResult> {
    return api.post('/coupons/redeem', { code }).then((r) => r.data);
  },
};
