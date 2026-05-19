# Etapa 1 — Acceptance Criteria

This is what Eduardo will verify on 2026-05-09 to release the 20 % payment (R$ 2,803.70).

## Functional acceptance

| # | Requirement | Demonstrated by |
| --- | --- | --- |
| A1 | A new user can scan a QR code at the Pacaembu event and install the app from Google Play (Internal Testing) | Hand a fresh Android phone the QR; install completes |
| A2 | Sign-in via Google works on Android, iOS, Web | OAuth flow returns access + refresh tokens; profile is created |
| A3 | Sign-in via Apple works on iOS | OAuth flow returns access + refresh tokens; profile is created |
| A4 | Phone verification via SMS OTP completes | Number entered in E.164 → 6-digit code received → backend issues phone-verified flag |
| A5 | CPF entry validates with mod-11 in real time, rejects invalid sequences | Try 11111111111 (rejected), a real CPF (accepted), masked as 000.000.000-00 |
| A6 | LGPD consent modal appears once on first sign-up, must be accepted to proceed | Toggling decline blocks "continuar" button |
| A7 | Privacy Policy URL opens an externally hosted page | Tap the link in the LGPD modal opens the browser |
| A8 | Home screen shows "Minhas camisas" with the 20-listing counter | Empty list + "0 / 20" |
| A9 | Sign out works and returns to the Sign-in screen | Tokens cleared from secure store |
| A10 | New Listing form is reachable from Home and shows the field skeleton | Skeleton-only acceptable for Etapa 1 (full implementation in Etapa 2) |

## Non-functional acceptance

| # | Requirement |
| --- | --- |
| N1 | Backend deployed on Railway, reachable over HTTPS, `/health` returns 200 |
| N2 | DynamoDB table `arena_dos_mantos` created with PK/SK and GSI1/GSI2 |
| N3 | Refresh-token rotation works (old refresh token revoked on each refresh) |
| N4 | API rate-limited on auth endpoints (anti-OTP-spam) |
| N5 | App package signed for Play Store; uploaded to Internal Testing |
| N6 | QR code printed on event collateral and tested on three different devices |

## Out of scope (do NOT promise these in Etapa 1)

- Photo upload (Etapa 2)
- Catalog feed / search (Etapa 2)
- Comments (Etapa 3)
- Ratings (Etapa 3)
- Payment (Etapa 4)
- Apple App Store launch (Etapa 4)

## Branch and PR plan

- `main` — protected
- `etapa-1/scaffold` — this Day 1 work
- `etapa-1/auth-backend` — Days 2–4
- `etapa-1/auth-mobile` — Days 3–5
- `etapa-1/play-store-release` — Days 5–9

Each merge to `main` requires `npm run build` to succeed in both packages.
