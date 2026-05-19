# Arena dos Mantos — Production Setup Guide

This guide explains exactly where to obtain each credential and how to add it to Railway.

**How to add variables to Railway:**
1. Go to [railway.app](https://railway.app) → your project → `football-project-backed` service
2. Click **Variables** tab
3. Click **New Variable** and paste the key + value
4. Railway redeploys automatically after saving

---

## 🔴 CRITICAL — App won't work without these

### 1. AWS DynamoDB Credentials

The database is hosted on AWS DynamoDB. You need real AWS credentials.

**Steps:**
1. Go to [console.aws.amazon.com](https://console.aws.amazon.com)
2. Sign in (or create a free account — DynamoDB free tier is permanent: 25 GB)
3. Search for **IAM** in the top search bar → click IAM
4. Left menu → **Users** → **Create user**
5. Username: `arena-dos-mantos-backend`
6. Click **Next** → **Attach policies directly**
7. Search for `AmazonDynamoDBFullAccess` → check it → **Next** → **Create user**
8. Click the user you just created → **Security credentials** tab
9. Scroll to **Access keys** → **Create access key**
10. Select **Application running outside AWS** → **Next** → **Create**
11. Copy both values immediately (the secret is shown only once)

**Create the DynamoDB table:**
1. In AWS Console, search for **DynamoDB** → **Create table**
2. Table name: `arena_dos_mantos`
3. Partition key: `PK` (String)
4. Sort key: `SK` (String)
5. Table settings: **Customize** → Billing mode: **On-demand**
6. Click **Create table**

**Create GSI indexes** (required for queries):
After table is created → **Indexes** tab → **Create index**:

| GSI Name | Partition key | Sort key | Type |
|----------|--------------|----------|------|
| `GSI1` | `GSI1PK` (String) | `GSI1SK` (String) | Global |
| `GSI2` | `GSI2PK` (String) | `GSI2SK` (String) | Global |

**Railway Variables to add:**
```
AWS_ACCESS_KEY_ID      = AKIA...  (your access key)
AWS_SECRET_ACCESS_KEY  = ...      (your secret key)
AWS_REGION             = sa-east-1
DYNAMODB_TABLE_NAME    = arena_dos_mantos
```

**⚠️ Also delete this wrong variable:**
```
DYNAMODB_ENDPOINT  ← DELETE THIS (currently set to wrong value "arena_dos_mantos")
```

---

## 🟠 HIGH — Core features unavailable without these

### 2. Twilio Verify (SMS Phone Verification)

Used to send OTP codes to users' phones during signup.

**Steps:**
1. Go to [twilio.com](https://www.twilio.com) → **Sign up** (free trial available)
2. After login, go to **Console Dashboard**
3. Copy **Account SID** and **Auth Token** from the dashboard
4. Left menu → **Verify** → **Services** → **Create new Service**
5. Friendly Name: `Arena dos Mantos`
6. Copy the **Service SID** (starts with `VA...`)

**Railway Variables to add:**
```
TWILIO_ACCOUNT_SID        = AC...
TWILIO_AUTH_TOKEN         = ...
TWILIO_VERIFY_SERVICE_SID = VA...
```

---

### 3. Pagar.me (PIX Payments)

Used to process PIX payments and split commission between Arena and sellers.

**Steps:**
1. Go to [pagar.me](https://pagar.me) → **Criar conta** (if not registered)
2. After login, go to [dashboard.pagar.me](https://dashboard.pagar.me)
3. Top right → **Configurações** → **API**
4. Copy the **API Key** (use the **Live** key for production, **Test** key for sandbox)
5. Go to **Configurações** → **Webhooks** → **Adicionar webhook**
6. URL: `https://football-project-backed-production.up.railway.app/payments/webhook`
7. Events to enable: `charge.paid`, `charge.pending`, `charge.failed`
8. After saving, copy the **Webhook Secret**

**Railway Variables to add:**
```
PAGARME_API_KEY        = ak_live_...
PAGARME_WEBHOOK_SECRET = ...
```

---

### 4. Algolia (Search Engine)

Used to power the jersey catalog search with filters.

**Steps:**
1. Go to [algolia.com](https://www.algolia.com) → **Start for free**
2. After login → **Settings** (gear icon, top left)
3. → **Applications** → your app name (or **Create Application**)
4. Note the **Application ID** shown on the app card
5. Left menu → **API Keys**
6. Copy **Search-Only API Key** (public, safe to expose)
7. Copy **Admin API Key** (private, keep secret)
8. Go to **Search** → **Index** → **Create Index**
9. Index name: `listings`

**⚠️ Brazil region:** You need the **Elevate** plan to use the `sa-east-1` (Brazil) region.
Contact Algolia sales for startup pricing: [algolia.com/startups](https://www.algolia.com/industries-and-solutions/startups/)

**Railway Variables to add:**
```
ALGOLIA_APP_ID         = ...
ALGOLIA_ADMIN_API_KEY  = ...
ALGOLIA_SEARCH_API_KEY = ...
ALGOLIA_INDEX_NAME     = listings
```

---

### 5. Cloudflare R2 — Public URL

R2 credentials are already set. You just need to enable public access on the bucket.

**Steps:**
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **R2**
2. Click the `arena-dos-mantos` bucket
3. Click **Settings** tab → **Public access**
4. Click **Allow Access** → confirm
5. Copy the **Public Bucket URL** (looks like `https://pub-xxxx.r2.dev`)

**Railway Variable to add:**
```
R2_PUBLIC_URL = https://pub-xxxx.r2.dev
```

---

## 🟡 MEDIUM — Some features unavailable

### 6. Apple Sign In

Required for iOS users to sign in with their Apple account.

**Steps:**
1. Go to [developer.apple.com](https://developer.apple.com) → **Account**
2. Note your **Team ID** (top right, 10-character code like `ABCD123456`)
3. Left menu → **Certificates, IDs & Profiles** → **Keys**
4. Click **+** → Name: `Arena dos Mantos Sign In Key`
5. Enable **Sign in with Apple** → **Configure** → select your app ID
6. Click **Continue** → **Register** → **Download** (downloads `AuthKey_XXXX.p8`)
7. Note the **Key ID** shown (10-character code)
8. Open the `.p8` file in a text editor and copy the full contents

**Railway Variables to add:**
```
APPLE_TEAM_ID     = ABCD123456
APPLE_KEY_ID      = ABCD123456
APPLE_PRIVATE_KEY = -----BEGIN PRIVATE KEY-----\nMIGH...\n-----END PRIVATE KEY-----
```
*(Replace newlines in the private key with `\n` when pasting into Railway)*

---

### 7. Melhor Envio (Real-time Shipping Quotes)

Used to calculate real shipping costs and generate labels. Replaces hardcoded Correios estimates.

**⚠️ Important:** For a marketplace (multi-seller), you need the **App model**, not a regular account.

**Steps:**
1. Go to [melhorenvio.com.br](https://melhorenvio.com.br) → **Criar conta**
2. After signup, go to **Perfil** → **Dados da empresa**
3. Fill in company data (Avance Labs CNPJ)
4. Go to **Ferramentas** → **API / Apps** → **Criar aplicativo**
5. App name: `Arena dos Mantos`
6. Permissions needed: `shipping-calculate`, `shipping-generate`, `shipping-checkout`
7. After approval (may take 1–3 business days), copy the **Access Token**
8. For sandbox testing: [sandbox.melhorenvio.com.br](https://sandbox.melhorenvio.com.br)

**Railway Variables to add:**
```
MELHOR_ENVIO_TOKEN   = ...
MELHOR_ENVIO_SANDBOX = false   (use "true" for testing)
```

---

### 8. LGPD Privacy Policy URL

Update the privacy policy URL from localhost to the real domain.

**Railway Variable to update:**
```
LGPD_PRIVACY_POLICY_URL = https://arenadosmantos.com.br/privacidade
```

---

## ✅ Already Configured — No action needed

| Credential | Status |
|-----------|--------|
| JWT Access & Refresh Secrets | ✅ Set |
| Google OAuth (Android / iOS / Web) | ✅ Set |
| Cloudflare R2 Account ID, Keys, Bucket | ✅ Set |
| Admin Secret | ✅ Set |
| Railway deployment domain | ✅ Active |
| Vercel frontend deployment | ✅ Active |

---

## Final Checklist Before Launch

- [ ] AWS credentials added to Railway + DYNAMODB_ENDPOINT deleted
- [ ] DynamoDB table `arena_dos_mantos` created with GSI1 + GSI2
- [ ] Twilio Verify service created and SID added
- [ ] Pagar.me live API key + webhook configured
- [ ] Algolia index created + keys added
- [ ] R2 public URL enabled and added
- [ ] Apple Sign In key downloaded and added *(iOS only)*
- [ ] Melhor Envio app approved and token added
- [ ] LGPD URL updated to real domain
- [ ] Railway redeploys successfully (check Deployments tab — status: Success)
- [ ] Test a full flow: signup → list jersey → buy → PIX payment

---

*Last updated: 2026-05-13 · Arena dos Mantos / Avance Labs*
