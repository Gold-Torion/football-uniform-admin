# Arena dos Mantos

Brazilian football jersey peer-to-peer marketplace mobile app.

- **Client / Product Owner**: Eduardo Candido da Cruz
- **Developer**: Yuri Silva
- **Contract signed**: 2026-04-28
- **MVP deadline (Pacaembu event)**: 2026-05-09

## Repository layout

```
football_uniform/
├── backend/         NestJS + TypeScript API on Railway, DynamoDB single-table
├── mobile/          React Native + Expo + NativeWind (TypeScript)
├── shared/          TypeScript types shared across mobile and backend
├── docs/            Design documents and operational checklists
│
├── Final(English).pdf                            Approved screen list (Eduardo signed)
├── 260427_meeting_arena_dos_mantos_v2 (1).docx   Signed meeting decisions (binding)
└── arena-dos-mantos-demo.html                    Eduardo's original visual mockup (reference only)
```

## Milestones (signed contract)

| Etapa | % | Amount (BRL) | Scope |
| --- | --- | --- | --- |
| 1. Foundation & Onboarding | 20 | 2,803.70 | Auth (Google/Apple/Phone/CPF), LGPD modal, Play Store beta |
| 2. Catalog & Registration | 35 | 3,364.44 | Photos (R2), filters, listing form, Minha Primeira Camisa |
| 3. Community & Curation | 30 | 2,803.70 | Public comments, mutual ratings, comment reports |
| 4. Payment & Logistics | 15 | 2,242.95 | Pagar.me (PIX, card, escrow), Correios tracking, in-person handoff |

Optional: Coupon system at USD 200–300.

## Quick start

### Backend
```bash
cd backend
npm install
cp .env.example .env   # fill in secrets
npm run start:dev      # http://localhost:3000
```

### Mobile
```bash
cd mobile
npm install
cp .env.example .env
npx expo install --check   # align native dependency versions to current Expo SDK
npx expo start
```

## Day 1 checklist

See `docs/external-services-checklist.md` for the manual steps Eduardo and Yuri must complete today (Google Cloud, Apple Developer, Twilio, Cloudflare R2, Play Console).

See `docs/dynamodb-schema.md` for the single-table design.

See `docs/etapa-1-deliverables.md` for the acceptance criteria of Milestone 1.
