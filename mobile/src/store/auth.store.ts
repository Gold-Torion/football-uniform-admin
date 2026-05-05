import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export interface PublicUser {
  userId: string;
  displayName: string;
  email?: string;
  phoneE164?: string;
  cpf?: string;
  lgpdConsentAt?: string;
  ratingAvgAsSeller?: number;
  ratingCountAsSeller: number;
  ratingAvgAsBuyer?: number;
  ratingCountAsBuyer: number;
  listingsActiveCount: number;
  mpcPurchasesCount: number;
  totpEnabled: boolean;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  createdAt: string;
}

interface Session {
  accessToken: string;
  refreshToken: string;
  user: PublicUser;
}

interface AuthState {
  hydrated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: PublicUser | null;
  totpTempToken: string | null;      // in-memory only, not persisted
  hydrate: () => Promise<void>;
  setSession: (s: Session) => Promise<void>;
  setTotpTempToken: (token: string) => void;
  setTotpEnabled: (enabled: boolean) => void;
  setListingsActiveCount: (count: number) => void;
  clear: () => Promise<void>;
}

const ACCESS_KEY  = 'adm.accessToken';
const REFRESH_KEY = 'adm.refreshToken';
const USER_KEY    = 'adm.user';          // persist user so Activity recreate works

export const useAuthStore = create<AuthState>((set, get) => ({
  hydrated: false,
  accessToken: null,
  refreshToken: null,
  user: null,
  totpTempToken: null,

  async hydrate() {
    if (get().hydrated) return;
    const [accessToken, refreshToken, userJson] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_KEY),
      SecureStore.getItemAsync(REFRESH_KEY),
      SecureStore.getItemAsync(USER_KEY),
    ]);
    const user: PublicUser | null = userJson ? JSON.parse(userJson) : null;
    set({
      hydrated: true,
      accessToken: accessToken ?? null,
      refreshToken: refreshToken ?? null,
      user,
    });
  },

  async setSession(s) {
    // Update in-memory state FIRST so RootNavigator re-renders immediately.
    // SecureStore writes happen in the background for persistence only.
    set({
      accessToken:  s.accessToken,
      refreshToken: s.refreshToken,
      user:         s.user,
    });
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_KEY,  s.accessToken),
      SecureStore.setItemAsync(REFRESH_KEY, s.refreshToken),
      SecureStore.setItemAsync(USER_KEY,    JSON.stringify(s.user)),
    ]);
  },

  setTotpTempToken(token: string) {
    set({ totpTempToken: token });
  },

  setTotpEnabled(enabled: boolean) {
    const user = get().user;
    if (!user) return;
    const updated = { ...user, totpEnabled: enabled };
    set({ user: updated });
    void SecureStore.setItemAsync(USER_KEY, JSON.stringify(updated));
  },

  setListingsActiveCount(count: number) {
    const user = get().user;
    if (!user) return;
    const updated = { ...user, listingsActiveCount: count };
    set({ user: updated });
    void SecureStore.setItemAsync(USER_KEY, JSON.stringify(updated));
  },

  async clear() {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ]);
    set({ accessToken: null, refreshToken: null, user: null, totpTempToken: null });
  },
}));
