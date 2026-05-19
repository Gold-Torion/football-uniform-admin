# DynamoDB Single-Table Schema

Eduardo specified DynamoDB single-table in the signed meeting doc. This document is the authoritative access-pattern map for the entire app — every read and write the API performs must trace back to one of the patterns listed here.

## Table

- **Name**: `arena_dos_mantos` (override per environment via env var)
- **Partition key**: `PK` (string)
- **Sort key**: `SK` (string)
- **Billing**: On-demand (PAY_PER_REQUEST) for Etapa 1; revisit when traffic stabilizes.
- **TTL attribute**: `ttl` (epoch seconds) — used for OTP attempts, refresh-token denylist, transient items only.

## Global Secondary Indexes

| Name | PK | SK | Projection | Purpose |
| --- | --- | --- | --- | --- |
| `GSI1` | `GSI1PK` | `GSI1SK` | ALL | Listing feed by status, pending reports queue, MPC listing queue |
| `GSI2` | `GSI2PK` | `GSI2SK` | ALL | Reverse lookups by status (orders by buyer/seller, etc.) |

## Item types

Notation: ULIDs are used for entity IDs (lexicographically sortable, time-ordered, 26 chars). Phone is stored in E.164 (`+5511999999999`). CPF is stored as 11 digits without punctuation.

### 1. User
The canonical user record. One per signed-up user.

| Attribute | Value |
| --- | --- |
| `PK` | `USER#{userId}` |
| `SK` | `PROFILE` |
| `entityType` | `User` |
| `userId` | ULID |
| `displayName` | string |
| `phoneE164` | string (verified) |
| `cpf` | string (11 digits, verified) |
| `email` | string \| null (from Google/Apple) |
| `googleSub` | string \| null (Google `sub` claim) |
| `appleSub` | string \| null (Apple `sub` claim) |
| `lgpdConsentAt` | ISO timestamp |
| `lgpdConsentVersion` | string (e.g., `2026-04-29`) |
| `ratingAvgAsSeller` | number \| null |
| `ratingCountAsSeller` | number |
| `ratingAvgAsBuyer` | number \| null |
| `ratingCountAsBuyer` | number |
| `listingsActiveCount` | number (≤ 20, enforced server-side) |
| `mpcPurchasesCount` | number (≤ 5, enforced server-side) |
| `status` | `ACTIVE` \| `SUSPENDED` \| `DELETED` |
| `createdAt` / `updatedAt` | ISO timestamp |

### 2. Lookup records (sparse, one item per unique key)
Used to resolve a login identifier to a `userId` in O(1). Each lookup item is its own row.

| Attribute | Value |
| --- | --- |
| `PK` | `LOOKUP#PHONE#{e164}` / `LOOKUP#CPF#{cpf}` / `LOOKUP#GOOGLE#{sub}` / `LOOKUP#APPLE#{sub}` / `LOOKUP#EMAIL#{email}` |
| `SK` | `USER` |
| `entityType` | `UserLookup` |
| `userId` | ULID (target) |

Writes happen inside a `TransactWriteItems` together with the User profile creation/update so uniqueness is atomic. Conditional expression `attribute_not_exists(PK)` enforces that two users cannot register with the same phone/CPF/etc.

### 3. Listing
A jersey for sale. Created in Etapa 2 but the schema is fixed now.

| Attribute | Value |
| --- | --- |
| `PK` | `LISTING#{listingId}` |
| `SK` | `METADATA` |
| `entityType` | `Listing` |
| `listingId` | ULID |
| `sellerId` | ULID (denormalized) |
| `title` | string |
| `description` | string (free-text condition details — Eduardo's instruction) |
| `kind` | `TIME` \| `SELECAO` |
| `teamName` | string |
| `continent` | `AMERICA` \| `EUROPA` \| `ASIA` \| `AFRICA` \| `OCEANIA` |
| `country` | string (cascading from continent) |
| `season` | string (`2024/25` for Europa/Selecoes, `2024` otherwise) |
| `supplier` | enum (Adidas, Nike, Puma, Umbro, Kappa, LeCoqSportif, NewBalance, UnderArmour, Penalty, Topper, Reusch, Lotto, Outro) |
| `model` | `TITULAR` \| `RESERVA` \| `TERCEIRA` \| `GOLEIRO` \| `TREINO` \| `COMEMORATIVA` |
| `garmentType` | `LOJA` \| `JOGO` |
| `size` | `PP` \| `P` \| `M` \| `G` \| `GG` \| `XGG` \| `2XGG` \| `3XGG` |
| `condition` | `COM_ETIQUETA` \| `PERFEITA` \| `EXCELENTE` \| `BOA` \| `REGULAR` \| `DESGASTADA` |
| `gender` | `MASCULINO` \| `FEMININO` |
| `priceCents` | integer (BRL cents) |
| `photoKeys` | string[] (R2 object keys, max 8) |
| `isMpc` | boolean (true = "Minha Primeira Camisa", curated R$149) |
| `nonVerifiedSupplierAck` | boolean (required true when supplier is not Adidas/Nike/Puma) |
| `status` | `DRAFT` \| `ACTIVE` \| `SOLD` \| `REMOVED` |
| `createdAt` / `updatedAt` | ISO timestamp |
| `GSI1PK` | `LISTING_FEED#{status}` (e.g., `LISTING_FEED#ACTIVE`) |
| `GSI1SK` | `{createdAt}#{listingId}` |

For MPC discovery within the catalog, also write a parallel index entry:

- `GSI2PK = LISTING_MPC#{status}` (only for `isMpc=true`)
- `GSI2SK = {createdAt}#{listingId}`

### 4. UserListing pointer
Lets us answer "Show my listings (max 20)" with a single Query, avoiding a scan.

| Attribute | Value |
| --- | --- |
| `PK` | `USER#{userId}` |
| `SK` | `LISTING#{createdAt}#{listingId}` |
| `entityType` | `UserListingRef` |
| `listingId` | ULID |
| `status` | mirrors Listing.status |

### 5. Comment (Etapa 3)
Public comments on a listing — replaces the live chat.

| Attribute | Value |
| --- | --- |
| `PK` | `LISTING#{listingId}` |
| `SK` | `COMMENT#{createdAt}#{commentId}` |
| `entityType` | `Comment` |
| `commentId` | ULID |
| `authorId` | ULID |
| `body` | string |
| `createdAt` | ISO |

### 6. CommentReport (Etapa 3, admin)
Created when a seller reports a comment on their own listing.

| Attribute | Value |
| --- | --- |
| `PK` | `LISTING#{listingId}` |
| `SK` | `REPORT#{createdAt}#{reportId}` |
| `entityType` | `CommentReport` |
| `reportId` | ULID |
| `commentId` | ULID |
| `reporterId` | ULID (must equal listing.sellerId) |
| `reason` | string (free text Eduardo requested) |
| `status` | `PENDING` \| `RESOLVED` \| `DISMISSED` |
| `resolvedAt` | ISO \| null |
| `GSI1PK` | `REPORT#{status}` |
| `GSI1SK` | `{createdAt}#{reportId}` |

### 7. Order (Etapa 4)
| Attribute | Value |
| --- | --- |
| `PK` | `ORDER#{orderId}` |
| `SK` | `METADATA` |
| `entityType` | `Order` |
| `orderId` | ULID |
| `listingId` | ULID |
| `buyerId` / `sellerId` | ULID |
| `priceCents` | integer |
| `shippingCents` | integer (0 when ENTREGA_EM_MAOS) |
| `couponCode` | string \| null |
| `discountCents` | integer |
| `commissionCents` | integer (8–12 % range, value set on creation) |
| `deliveryMode` | `CORREIOS` \| `ENTREGA_EM_MAOS` |
| `pagarmeChargeId` | string \| null |
| `paymentMethod` | `PIX` \| `CARD` |
| `escrowReleaseAt` | ISO (auto-release at +7 days unless contested) |
| `status` | `PENDING_PAYMENT` \| `PAID` \| `SHIPPED` \| `DELIVERED` \| `CONFIRMED` \| `CANCELED` |
| `correiosTracking` | string \| null |
| `createdAt` / `updatedAt` | ISO |
| `GSI1PK` | `ORDER_BUYER#{buyerId}` |
| `GSI1SK` | `{createdAt}#{orderId}` |
| `GSI2PK` | `ORDER_SELLER#{sellerId}` |
| `GSI2SK` | `{createdAt}#{orderId}` |

### 8. MPC purchase counter row
Used to enforce the per-user 5-MPC-purchase cap atomically.

| Attribute | Value |
| --- | --- |
| `PK` | `USER#{userId}` |
| `SK` | `MPC_PURCHASE#{orderId}` |
| `entityType` | `MpcPurchaseRef` |
| `orderId` | ULID |
| `createdAt` | ISO |

Read pattern: `Query PK=USER#{userId} AND begins_with(SK, "MPC_PURCHASE#")` then count items, OR maintain a counter on the User profile updated transactionally.

### 9. Rating (Etapa 3)
Each transaction produces up to two Rating items (buyer→seller, seller→buyer).

| Attribute | Value |
| --- | --- |
| `PK` | `USER#{rateeId}` |
| `SK` | `RATING_RECEIVED#{createdAt}#{ratingId}` |
| `entityType` | `Rating` |
| `ratingId` | ULID |
| `orderId` | ULID |
| `raterId` | ULID |
| `direction` | `BUYER_TO_SELLER` \| `SELLER_TO_BUYER` |
| `criteria` | map of `{ name: string, score: 1..5 }` (4 entries for B→S, 3 entries for S→B) |
| `average` | number (simple arithmetic mean of `criteria` scores) |
| `createdAt` | ISO |

On write, increment the User profile's `ratingAvgAs{Seller|Buyer}` and `ratingCountAs{Seller|Buyer}` in the same `TransactWriteItems`.

### 10. Coupon (optional add-on)
| Attribute | Value |
| --- | --- |
| `PK` | `COUPON#{code}` |
| `SK` | `METADATA` |
| `entityType` | `Coupon` |
| `code` | string (uppercase, printed on physical cards) |
| `discountKind` | `PERCENT` \| `FIXED_CENTS` |
| `discountValue` | integer |
| `validFromAt` / `validUntilAt` | ISO |
| `maxRedemptions` | integer |
| `redemptionsCount` | integer |
| `perUserLimit` | integer (e.g., 1) |
| `status` | `ACTIVE` \| `EXPIRED` \| `EXHAUSTED` |

Plus per-user redemption rows:

- `PK = COUPON#{code}`, `SK = REDEMPTION#{userId}`, `orderId`, `redeemedAt`.

## Access patterns checklist

The implementation MUST cover all of these. Each Item-type doc above maps back to one or more entries here.

| # | Pattern | How |
| --- | --- | --- |
| 1 | Sign in via phone OTP — find user by phone | GetItem `LOOKUP#PHONE#{e164}` |
| 2 | Sign in via Google — find user by Google sub | GetItem `LOOKUP#GOOGLE#{sub}` |
| 3 | Sign in via Apple — find user by Apple sub | GetItem `LOOKUP#APPLE#{sub}` |
| 4 | Verify CPF uniqueness | GetItem `LOOKUP#CPF#{cpf}` |
| 5 | Read user profile | GetItem `USER#{userId}` / `PROFILE` |
| 6 | Update user profile | UpdateItem (transactional with lookups when keys change) |
| 7 | List my listings (≤20) | Query `PK=USER#{userId}` `begins_with(SK,"LISTING#")` |
| 8 | Catalog feed (active listings, recent first) | Query `GSI1` `GSI1PK="LISTING_FEED#ACTIVE"` ScanIndexForward=false |
| 9 | MPC catalog feed | Query `GSI2` `GSI2PK="LISTING_MPC#ACTIVE"` |
| 10 | Listing detail | GetItem `LISTING#{id}` `METADATA` |
| 11 | Comments on listing | Query `PK=LISTING#{id}` `begins_with(SK,"COMMENT#")` |
| 12 | Pending reports (admin) | Query `GSI1` `GSI1PK="REPORT#PENDING"` |
| 13 | Reports for a listing | Query `PK=LISTING#{id}` `begins_with(SK,"REPORT#")` |
| 14 | Orders bought by a user | Query `GSI1` `GSI1PK="ORDER_BUYER#{userId}"` |
| 15 | Orders sold by a user | Query `GSI2` `GSI2PK="ORDER_SELLER#{userId}"` |
| 16 | Order detail | GetItem `ORDER#{orderId}` `METADATA` |
| 17 | Ratings received by user | Query `PK=USER#{userId}` `begins_with(SK,"RATING_RECEIVED#")` |
| 18 | Coupon by code | GetItem `COUPON#{code}` `METADATA` |
| 19 | Has user redeemed coupon? | GetItem `COUPON#{code}` `REDEMPTION#{userId}` |
| 20 | MPC purchases for user (count ≤ 5) | Query `PK=USER#{userId}` `begins_with(SK,"MPC_PURCHASE#")` (or read counter on profile) |

## Search (Algolia)

DynamoDB does not handle the 12-filter search Eduardo specified. The search experience is delegated to **Algolia free tier** as agreed in the meeting. The flow:

1. On `Listing` create/update/delete, the API publishes a CDC event to Algolia (Algolia ingestion or direct SDK call).
2. Mobile queries Algolia directly with public, restricted API keys for filtered search.
3. Algolia returns `listingId`s; the mobile app then BatchGetItems from DynamoDB for full records (or relies on the Algolia copy when the listing's hot fields are denormalized into the index).

## Backups & local development

- **Production**: Point-in-time recovery enabled, daily backup (AWS managed).
- **Local**: `docker run -p 8000:8000 amazon/dynamodb-local`. Set `DYNAMODB_ENDPOINT=http://localhost:8000` in `.env`.
