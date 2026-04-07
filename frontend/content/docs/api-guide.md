# Subscription API Guide

This guide is for teams integrating PLUTO into an external business app using the standard API-key flow (no x402 challenge handling).

---

## Integration architecture

`Customer frontend -> Your backend -> PLUTO API`

Recommended local setup used in this guide:

- Store frontend: `http://localhost:5173`
- Store backend: `http://localhost:3001`
- PLUTO frontend (checkout): `http://localhost:3000`
- PLUTO backend (API): `http://localhost:4000`

---

## Your backend `.env` (non-x402)

Store backend (`3001`) example:

```bash
PORT=3001
PLUTO_API_URL=http://localhost:4000
PLUTO_API_KEY=sk_your_merchant_api_key
MERCHANT_STELLAR_RECIPIENT=GDTVZPCLO7YHRF3JQV6TQI6XW3DIIMFWWQWI25WWLOUZM5AOCZTE5RA3
USDC_ISSUER=GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5
```

Notes:

- Keep `PLUTO_API_KEY` only on your backend.
- For non-native assets like `USDC`, always send `asset_issuer`.

---

## Step-by-step implementation (non-x402)

### 1. Register merchant on PLUTO

```http
POST /api/register-merchant
```

Save:

- `merchant.id`
- `merchant.api_key`
- `merchant.webhook_secret`

### 2. Add checkout route in your backend

`server/routes/checkout.js`

```js
import "dotenv/config";
import express from "express";
import crypto from "node:crypto";

const router = express.Router();
const API_URL = process.env.PLUTO_API_URL || "http://localhost:4000";

router.post("/checkout", async (req, res) => {
  try {
    const payload = {
      amount: req.body.amount,
      asset: "USDC",
      asset_issuer: process.env.USDC_ISSUER,
      recipient: process.env.MERCHANT_STELLAR_RECIPIENT,
      metadata: { cart_id: req.body.cartId },
    };

    const r = await fetch(`${API_URL}/api/create-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.PLUTO_API_KEY,
        "Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify(payload),
    });

    const data = await r.json();
    return res.status(r.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || "Checkout failed" });
  }
});

export default router;
```

### 3. Redirect customer to returned `payment_link`

Example response:

```json
{
  "payment_id": "f95aa43c-46ad-42f4-88b9-4c9be8d7865e",
  "payment_link": "http://localhost:3000/pay/f95aa43c-46ad-42f4-88b9-4c9be8d7865e",
  "status": "pending"
}
```

### 4. Track result in your app

Use one or both:

- `GET /api/payment-status/:id`
- Webhooks + signature verification (`PLUTO_WEBHOOK_SECRET`)

---

## Common mistakes

- Sending `x-api-key` from browser/frontend code.
- Missing `asset_issuer` when sending `USDC`.
- Pointing users to the wrong checkout domain.
- Reusing a single idempotency key for different orders.

---

## Want pay-per-request mode?

Use the x402 guide:

- `/docs/x402-agentic-payments`
