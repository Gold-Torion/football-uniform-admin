# Arena dos Mantos — Mobile

React Native + Expo + NativeWind (Tailwind) app distributed via Google Play
(Internal Testing) for the 2026-05-09 Pacaembu event.

## Run locally

```bash
cp .env.example .env
npm install
# Align native dep versions to the installed Expo SDK
npx expo install --check
npx expo start
```

Then scan the QR code with Expo Go (iOS) or run `expo run:android` for a full
development build (required for `expo-secure-store` and Apple Sign In).

## Source layout

```
App.tsx                              Entry — providers and root navigator
global.css                           Tailwind base/components/utilities
src/
├── navigation/
│   ├── RootNavigator.tsx            Auth ↔ Main switch driven by auth store
│   ├── AuthStack.tsx                Sign-in → Phone → CPF → LGPD
│   ├── MainTabs.tsx                 Home (Minhas camisas) + New Listing
│   └── types.ts                     Strongly-typed param lists
├── screens/
│   ├── auth/SignInScreen.tsx
│   ├── auth/VerifyPhoneScreen.tsx   Two-step: phone → 6-digit OTP
│   ├── auth/VerifyCpfScreen.tsx     Realtime mod-11 validation
│   ├── auth/LgpdConsentScreen.tsx   Required to enter the app
│   ├── home/HomeScreen.tsx          Listings counter + sign out
│   └── listing/NewListingScreen.tsx Skeleton (full form is Etapa 2)
├── api/
│   ├── client.ts                    axios + JWT refresh interceptor
│   └── auth.ts                      Typed endpoint wrappers
├── store/auth.store.ts              zustand state, secure-store persisted
├── utils/cpf.ts                     mask, strip, mod-11
├── utils/phone.ts                   E.164 + Brazilian local mask
└── theme/colors.ts                  Brand palette (mirrors tailwind.config.js)
```

## Why these choices

- **NativeWind v4** for Tailwind ergonomics inside RN. Matches the demo's
  utility-first styling so the visual language survives the migration.
- **React Navigation v7 native stack** — better gesture handling than the JS
  stack and full TypeScript inference for `navigation.navigate`.
- **expo-secure-store** for token persistence (Keychain / EncryptedSharedPrefs).
- **zustand** for ephemeral session state — small, no boilerplate, plays
  nicely with selectors that prevent re-renders.
- **axios refresh interceptor** with single-flight: only one refresh request
  is in flight at any time, so a screen with five parallel requests doesn't
  fire five refreshes after a token expires.

## What this scaffold ships

Complete:
- Project boots with `expo start`.
- Navigation graph (Sign-in → Phone → CPF → LGPD → Home/NewListing tabs).
- CPF and Brazilian phone utilities, identical algorithm to the backend.
- Token persistence and refresh logic.
- LGPD consent screen with backend-driven version + privacy URL.

Pending (filled in over Days 2–9):
- expo-auth-session Google flow + native Apple Sign In.
- Upload assets (icon.png, splash.png, adaptive-icon.png).
- Internal Testing AAB upload to Play Console.

## Common Tailwind classes used in this codebase

| Token | Maps to |
| --- | --- |
| `bg-primary-900` | `#06080F` (sign-in deep navy) |
| `bg-primary` | `#0D1B2A` (header navy) |
| `bg-brand` | `#22C55E` (CTA green) |
| `bg-brand-dark` | `#16A34A` |
| `text-ink-1` | `#0F172A` (primary text) |
| `text-ink-2` | `#475569` (secondary text) |
| `text-ink-3` | `#94A3B8` (muted) |
| `bg-surface-subtle` | `#F1F5F9` |
| `border-surface-border` | `#E2E8F0` |
