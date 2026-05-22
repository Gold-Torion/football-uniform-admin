import { api } from './client';
import type { PublicUser } from '../store/auth.store';

export const UsersApi = {
  updateSellerCep(cep: string, rua?: string, numero?: string, cidade?: string, estado?: string): Promise<PublicUser> {
    return api.patch('/users/me/cep', { cep, rua, numero, cidade, estado }).then((r) => r.data as PublicUser);
  },
};
