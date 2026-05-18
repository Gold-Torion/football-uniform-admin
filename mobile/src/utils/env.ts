// Metro substitutes process.env.EXPO_PUBLIC_* at build time only when referenced
// directly. The globalThis workaround bypasses that substitution, so we declare
// process here to satisfy TypeScript (tsconfig excludes @types/node).
declare const process: { env: Record<string, string | undefined> };

export const Env = {
  apiBaseUrl:            process.env.EXPO_PUBLIC_API_BASE_URL            ?? 'http://localhost:3001',
  r2PublicUrl:           process.env.EXPO_PUBLIC_R2_PUBLIC_URL           ?? 'https://pub-6e17da7b716542dca1097f65c90480ac.r2.dev',
  googleClientIdAndroid: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID,
  googleClientIdIos:     process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS,
  googleClientIdWeb:     process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB,
  appleBundleId:         process.env.EXPO_PUBLIC_APPLE_BUNDLE_ID,
} as const;

export function getPhotoUrl(key: string): string | null {
  if (!Env.r2PublicUrl || !key) return null;
  return `${Env.r2PublicUrl}/${key}`;
}
