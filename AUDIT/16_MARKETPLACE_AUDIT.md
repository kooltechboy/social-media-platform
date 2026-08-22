# 16 — MARKETPLACE & COMMERCE AUDIT

**Domain:** Multi-Vendor Products, Cart Calculations, Order Lifecycle & Dispute Windows  
**Auditor:** Marketplace Architect & Commercial Lead  
**Status:** Good (Score: 82/100)

---

## 1. Cart & Commission Calculations (`@caribbean/marketplace`)

- **Commission:** 8.00% platform commission on marketplace physical & service transactions (800 bps).
- **Line Validation:** Strict minor integer unit validation and quantity capping (maximum 20 items per SKU per line).
- **Order Totals Structure:**
  ```ts
  export interface OrderTotals {
    subtotalMinor: number;
    platformFeeMinor: number;
    totalMinor: number;
  }
  ```

---

## 2. Order Fulfillment State Machine

```
pending_payment → paid → fulfilled → refunded
pending_payment → cancelled
```

### Dispute Windows
- Orders support a 30-day dispute resolution window from confirmed delivery date (`disputeWindowOpen()`).

---

## 3. Server Actions & Fixes

- File: `apps/web/src/lib/marketplace/actions.ts`
- Fix: Align property names in `createOrderAction` to `subtotalMinor`, `platformFeeMinor`, and `totalMinor`.
