import { api } from './client';
import type { PublicUser } from '../store/auth.store';

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: PublicUser;
}

export interface TotpChallenge {
  totpRequired: true;
  tempToken: string;
}

export type GooglePlatform = 'android' | 'ios' | 'web';

export const AuthApi = {
  register(displayName: string, email: string, password: string): Promise<AuthSession> {
    return api.post('/auth/register', { displayName, email, password }).then((r) => r.data);
  },
  emailLogin(email: string, password: string): Promise<AuthSession | TotpChallenge> {
    return api.post('/auth/login', { email, password }).then((r) => r.data);
  },
  getLgpdPrompt(): Promise<{ version: string; privacyPolicyUrl: string }> {
    return api.get('/auth/lgpd/current').then((r) => r.data);
  },
  google(idToken: string, platform: GooglePlatform): Promise<AuthSession | TotpChallenge> {
    return api.post('/auth/google', { idToken, platform }).then((r) => r.data);
  },
  apple(identityToken: string, fullName?: string): Promise<AuthSession | TotpChallenge> {
    return api.post('/auth/apple', { identityToken, fullName }).then((r) => r.data);
  },
  totpAuthenticate(tempToken: string, code: string): Promise<AuthSession> {
    return api.post('/auth/totp/authenticate', { tempToken, code }).then((r) => r.data);
  },
  totpSetup(): Promise<{ qrCodeDataUrl: string; secret: string }> {
    return api.post('/auth/totp/setup').then((r) => r.data);
  },
  totpActivate(code: string): Promise<void> {
    return api.post('/auth/totp/activate', { code }).then(() => undefined);
  },
  totpDisable(code: string): Promise<void> {
    return api.post('/auth/totp/disable', { code }).then(() => undefined);
  },
  startPhoneVerification(phoneE164: string): Promise<void> {
    return api.post('/auth/phone/start', { phoneE164 }).then(() => undefined);
  },
  verifyPhone(phoneE164: string, code: string): Promise<AuthSession> {
    return api.post('/auth/phone/verify', { phoneE164, code }).then((r) => r.data);
  },
  verifyCpf(cpf: string): Promise<AuthSession> {
    return api.post('/auth/cpf/verify', { cpf }).then((r) => r.data);
  },
  recordLgpdConsent(accepted: boolean, version: string): Promise<AuthSession> {
    return api.post('/auth/lgpd/consent', { accepted, version }).then((r) => r.data);
  },
};
