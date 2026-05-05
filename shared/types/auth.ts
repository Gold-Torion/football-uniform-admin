/**
 * Wire format for the auth endpoints. The backend emits these and the mobile
 * client consumes them. Keep this file dependency-free so it can be imported
 * from either side without bundling problems.
 */

export type GooglePlatform = 'android' | 'ios' | 'web';

export interface PublicUser {
  userId: string;
  displayName: string;
  email?: string;
  phoneE164?: string;
  cpf?: string;
  ratingAvgAsSeller?: number;
  ratingCountAsSeller: number;
  ratingAvgAsBuyer?: number;
  ratingCountAsBuyer: number;
  listingsActiveCount: number;
  mpcPurchasesCount: number;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  createdAt: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: PublicUser;
}

export interface LgpdPrompt {
  version: string;
  privacyPolicyUrl: string;
}
