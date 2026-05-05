import { api } from './client';

export interface UserRatingSummary {
  asSeller: { average: number; count: number };
  asBuyer:  { average: number; count: number };
}

export const RatingsApi = {
  getSummary: (userId: string) =>
    api.get<UserRatingSummary>(`/users/${userId}/rating`).then((r) => r.data),
  create: (data: {
    orderId:   string;
    rateeId:   string;
    raterRole: 'BUYER' | 'SELLER';
    scores:    number[];
  }) => api.post('/ratings', data).then((r) => r.data),
};
