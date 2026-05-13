import { api } from './client';
import type { PublicUser } from '../store/auth.store';

export const UsersApi = {
  updateSellerCep(cep: string): Promise<PublicUser> {
    return api.patch('/users/me/cep', { cep }).then((r) => r.data as PublicUser);
  },
};
