# Client Messages Log (Eduardo)

---

## 2026-05-14

### Credentials received
```
Focus NFe Token 1: bKYwvUtxhrR7IFUKDOl55b2PlaZMiMIs
Focus NFe Token 2: 0poJ6KOLoYbt6R6iF9uGIZNUI7wPRSJI
Focus NFe Token 3: sTSbiJcYOVsw0tMBowoo7NijLGEfCuc0
Inscrição Municipal (São Paulo CCM): 0.220.174-7
```

**Status: CONFIGURED — activating Focus NFe**

---

## 2026-05-17

### Original Message
```
Hi buddy, how are you doing?

TEST ENVIRONMENT CREDENTIALS:
Public Key: pk_test_BG7gqeyFMi8xqDRJ
Secret Key: sk_test_6e5a203c5eb6404a8e98f346016e74e6

PENDING ITEMS:
- Payment Split: Support request submitted. Response expected Monday.
  Once confirmed → register recipients (marketplace sellers).
- PIX Configuration: Pagar.me only allows PIX under PSP model.
  Marketplace PIX not yet active — following up with support.
```

**Status: IN PROGRESS — updating credentials + fixing PIX for PSP model**

---

## 2026-05-11

### Original Message
```
It's just for your information.
I'll stay out all day today and I'll make another one tomorrow on Claude.
Some things like "counterfeit jerseys" we already addressed.
So don't need to take it in consideration.
The core is:
  Focus NFe and NFSe
  After that is Bling if needed.
  Than Mercado Envíos. If possible for this first launch it's good, but don't delay the dev for this.
Can you do Mercado Envios RN in this sprint?
Give me the price for those?
Focus NFe API
Mercado Envios API.
```

### Requested Features (by priority)

| Priority | Feature | Urgency |
|----------|---------|---------|
| 1 | Focus NFe API — NFS-e (commission invoice) | Core |
| 2 | Focus NFe API — NF-e (product invoice) | Core |
| 3 | Bling ERP integration | If needed |
| 4 | Mercado Envios (Melhor Envio) API | If possible for first launch |

**Status: PENDING QUOTE**

---

## 2026-05-12

### Original Message
```
Can you give me how much it's gonna cost each feature, so we prioritize?
```

**Status: QUOTE SENT**

---

## 2026-05-13

### Original Message
```
IT'S JUST MERCADO ENVIOS RIGHT NOW.
How much for just mercado envios?
```

**Status: QUOTE SENT**

---

## Document Analysis Summary

### Document 1: Arena_dos_Mantos_Briefing_Final_Bilingual.docx
Summary of technical and fiscal decisions for Phase 1 and Phase 2 (bilingual).

### Document 2: Arena_dos_Mantos_Complete_Briefing_Tax_Legal_Tech_EN.docx
Complete briefing on tax, legal, and technical matters (English).

---

## What Eduardo Wants — Detailed Explanation

### 1. Focus NFe API — NFS-e (Highest Priority)

**What it is:**
- Auto-emission of an electronic service invoice (NFS-e) for the **7% commission** Arena charges each seller
- Triggered automatically after every completed sale (Pagar.me split)
- Uses Focus NFe REST API (R$90/month Solo plan)

**Why it's needed:**
- Legal obligation: Avance Labs must pay ISS (service tax) on commission revenue
- LC 214/2025 compliance — marketplace joint liability kicks in from 2027

**Implementation scope:**
- Backend: call Focus NFe API when order status = paid → auto-emit NFS-e
- NFS-e fields: commission amount (7%), seller info, Pagar.me CNPJ
- Send NFS-e PDF to seller by email

---

### 2. Focus NFe API — NF-e (Second Priority)

**What it is:**
- Electronic product invoice (NF-e, model 55) issued to the buyer when Arena sells its **own jerseys (MPC listings)**
- Must include NT 2020.006 mandatory fields: intermediary flag, Avance Labs CNPJ, seller platform ID

**Implementation scope:**
- Backend: auto-emit NF-e via Focus NFe API when MPC order is paid
- Admin panel: NF-e issuance history and status

---

### 3. Melhor Envio API (replaces "Mercado Envios")

**Important: Eduardo's "Mercado Envios" refers to Melhor Envio API.**
(Document explicitly recommends Melhor Envio, not Mercado Livre's logistics.)

**What it is:**
- Replace hardcoded Correios estimate → **real-time shipping quote API**
- Integrates PAC, SEDEX, Jadlog and other Brazilian carriers
- Marketplace "App model" for centralized multi-seller shipping

**Revenue model:**
- Buyer pays X → Melhor Envio charges Y (Y < X) → Arena keeps the markup difference
- Example: buyer pays R$15 → Melhor Envio charges R$10 → Arena earns R$5

**Implementation scope:**
- Checkout: real-time shipping quote when buyer enters CEP
- Post-payment: auto-generate shipping label (sender = seller address)
- Shipping tracking integration
- Requires Melhor Envio "App model" approval (marketplace account application)

---

### 4. Bling ERP (Optional)

**What it is:**
- ERP tool for sellers to manage their own NF-e issuance
- Cost: R$55–109/month per seller (paid by seller)

**Current assessment:** Phase 2 consideration — not needed in this sprint

---

## Scope Comparison vs Original Contract

| Feature | Original Contract | New Request |
|---------|------------------|-------------|
| Correios shipping | Included | — |
| Melhor Envio API | Not included | New request |
| Focus NFe NFS-e | Not included | New request |
| Focus NFe NF-e | Not included | New request |
| Bling ERP | Not included | Optional |

**All 3 core features are out of original contract scope → additional quote required**

---

## Price Breakdown per Feature

| Feature | Price | Priority |
|---------|-------|----------|
| Focus NFe — NFS-e (commission invoice) | $400 | 1st — legally required |
| Focus NFe — NF-e (product invoice) | $300 | 2nd — for MPC sales |
| Melhor Envio API (shipping) | $400 | 3rd — good for launch |
| Bling ERP integration | $250 | Optional |
| **Total (all 4)** | **$1,350** | |
| **Total (priority 1+2+3)** | **$1,100** | |
