# Technology Integration Commitment Agreement
## Melhor Envio — Arena dos Mantos

**Date:** 2026-05-13  
**Status:** ACTIVE

---

## Parties

- **Client:** EDUARDO CANDIDO DA CRUZ, CPF 445.317.368-77  
  Representative of AVANCE LABS / ARENA DOS MANTOS  
  CNPJ: 65.543.815/0001-62

- **Developer:** Responsible for Melhor Envio integration

---

## Terms

1. Developer implements Melhor Envio integration into Arena dos Mantos platform.
2. No upfront payment or advance required from Arena dos Mantos.
3. Developer receives **100% of shipping spread revenue** (markup between buyer payment and Melhor Envio actual cost).
4. Accumulation continues until **USD $220** total is reached.
5. Partial withdrawals allowed from accumulated balance.
6. After USD $220 is fully paid, **all shipping spread becomes Arena dos Mantos' property** — agreement terminates automatically.

---

## Code Implications (Technical)

### Current implementation
- Shipping markup: **40%** applied in `ShippingService` (`SHIPPING_MARKUP = 1.4`)
- Example: Melhor Envio charges R$10 → buyer pays R$14 → spread = R$4

### What needs to be tracked
- `shippingSpreadCents` per order (markup amount = buyer paid − actual carrier cost)
- `developerEarningsAccumulated` global counter (total spread paid to developer)
- Auto-switch logic: when total >= $220 equivalent, spread goes to Arena

### Threshold in BRL
- USD $220 at ~R$5.60 = approximately **R$1,232**
- Needs periodic FX rate update or fixed rate agreed by parties

---

## Payment Status Tracker

| Metric | Value |
|--------|-------|
| Target | USD $220 |
| Paid so far | $0.00 |
| Remaining | $220.00 |
| Status | ACTIVE — developer receives 100% spread |
