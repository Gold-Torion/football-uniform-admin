/**
 * Type-safe accessor for the EXPO_PUBLIC_* env vars baked into the bundle.
 *
 * We can't rely on `process.env` directly because the project's tsconfig
 * pins `types` to `["nativewind/types"]`, which excludes `@types/node` and
 * therefore strips the `process` global. At runtime Expo still populates
 * `process.env`, so we read it via `globalThis` cast.
 */
type EnvShape = {
  EXPO_PUBLIC_API_BASE_URL?: string;
  EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID?: string;
  EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS?: string;
  EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB?: string;
  EXPO_PUBLIC_APPLE_BUNDLE_ID?: string;
};

interface ProcessLike {
  env?: EnvShape;
}

const proc = (globalThis as unknown as { process?: ProcessLike }).process;
const env: EnvShape = proc?.env ?? {};

export const Env = {
  apiBaseUrl: env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3001',
  googleClientIdAndroid: env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID,
  googleClientIdIos: env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS,
  googleClientIdWeb: env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB,
  appleBundleId: env.EXPO_PUBLIC_APPLE_BUNDLE_ID,
} as const;
