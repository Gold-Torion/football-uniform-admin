# External Services Checklist — Day 1

Several of the deadlines on the Pacaembu critical path are not code, they're **vendor approvals and account activations**. Every day Yuri waits to start these is a day shaved off the safety margin.

Status legend: ⏳ in progress · ✅ done · ⚠️ blocker

## Owner: Eduardo

| # | Item | Why it matters | Status |
| --- | --- | --- | --- |
| E1 | Pay USD 25 Google Play Console developer fee | First upload on a new account can take up to 7 days; account activation must precede app submission | ⏳ Eduardo committed for 2026-04-29 |
| E2 | Register Console with DUNS code | Identity verification | ⏳ DUNS received 2026-04-28; register today |
| E3 | Push Pagar.me for approval date this week | Pagar.me approval blocks Pacaembu (need PIX + escrow live) | ⏳ Eduardo expects 3 business days |
| E4 | LGPD privacy text — provide brand-specific clauses (data we collect, retention, contact email) | Yuri drafts the template; Eduardo confirms business-specific items (DPO contact, retention windows, data shared with Pagar.me/Correios) | ☐ |

## Owner: Yuri

| # | Item | Why it matters | Status |
| --- | --- | --- | --- |
| Y1 | Google Cloud project + OAuth Client IDs (Android, iOS, Web) | Required for `expo-auth-session` Google flow | ☐ |
| Y2 | Apple Developer — Sign in with Apple key (`.p8`), Team ID, Key ID, Bundle ID | iOS auth requirement | ☐ Awaits Eduardo's DUNS-tied Apple Developer enrollment |
| Y3 | Twilio account → Verify Service SID | SMS OTP for Brazilian phone numbers (E.164) | ☐ |
| Y4 | Cloudflare account → R2 bucket + API token | Etapa 2 photo upload, but credentials should be ready before Etapa 1 ends | ☐ |
| Y5 | AWS account → IAM user with DynamoDB-only policy + access keys | Database access from NestJS | ☐ |
| Y6 | Railway project → connect repo, set env vars | Production hosting | ☐ |
| Y7 | Privacy Policy webpage hosted (Vercel/Netlify free tier) → URL handed to Eduardo for Play Console | Mandatory field on Play Store listing | ☐ |
| Y8 | Algolia free tier app + Search API keys | Etapa 2 search, but provision now to avoid blocking | ☐ |
| Y9 | Sentry (or equivalent) project for backend + mobile error monitoring | Catch onboarding regressions early in beta | ☐ |

## Environment variables shopping list

This is the union of what `backend/.env` and `mobile/.env` need filled in. Group by source:

**Google Cloud Console** → Y1
- `GOOGLE_CLIENT_ID_ANDROID`
- `GOOGLE_CLIENT_ID_IOS`
- `GOOGLE_CLIENT_ID_WEB`

**Apple Developer Portal** → Y2
- `APPLE_BUNDLE_ID` (chosen by Yuri, e.g., `com.arenadosmantos.app`)
- `APPLE_TEAM_ID`
- `APPLE_KEY_ID`
- `APPLE_PRIVATE_KEY` (contents of `.p8`)

**Twilio Console** → Y3
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_VERIFY_SERVICE_SID`

**Cloudflare R2** → Y4 (Etapa 2, fill ahead of time)
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL`

**AWS IAM** → Y5
- `AWS_REGION` (`sa-east-1` recommended for proximity to Brazilian users)
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `DYNAMODB_TABLE_NAME` (`arena_dos_mantos`)

**Random** (generate locally with `openssl rand -hex 32`) → Yuri
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

## Decisions still pending Eduardo's input

These are open in the meeting doc. They don't block Day 1 scaffolding but should be closed before each appears in code:

1. **Pagar.me commission rate** (8–12 %) — Eduardo will set after his Pagar.me negotiation closes.
2. **Voucher discount mechanic** — Eduardo confirmed the **platform** absorbs the discount. Need the per-coupon discount calculation rule (percent vs fixed BRL).
3. **Comment Report budget** — if the implementation effort exceeds the headroom from chat removal, Eduardo allowed Yuri to bill it into the coupon line item or defer the feature to Phase 2.
4. **Privacy Policy text** — Eduardo's clauses (DPO email, retention windows).
