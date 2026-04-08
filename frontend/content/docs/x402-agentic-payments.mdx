# x402 Agentic Payments

This guide is for integrating PLUTO into an external business app using x402 pay-per-request mode.

It assumes you already have a merchant account and API key.

---

## Integration architecture

`Customer frontend -> Your backend -> PLUTO API (x402 mode)`

Recommended local setup used in this guide:

- Store frontend: `https://your-app.vercel.app`
- Store backend: `https://your-api.up.railway.app`
- PLUTO frontend (checkout): `https://stellar-payment-api.vercel.app`
- PLUTO backend (API): `https://pluto-api.up.railway.app`

---

## Your backend `.env` (x402)

Store backend example:

```bash
# The port your integration server runs on
PORT=3001

# The production PLUTO API base URL
PLUTO_API_URL=https://pluto-api.up.railway.app

# Your Private Merchant API Key (keep this secret!)
PLUTO_API_KEY=sk_your_merchant_api_key

# The Stellar address where you want to receive payments
MERCHANT_STELLAR_RECIPIENT=G_YOUR_RECEIVING_ADDRESS

# Optional: Standard USDC issuer is auto-resolved if omitted
# USDC_ISSUER=GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5

# Edit this and replace S... with the secret key for the account 
# that will sign transactions and pay for the resource.
X402_PAYER_SECRET=S_YOUR_PAYER_SECRET_KEY

# Stellar network configuration (testnet or public)
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
```

Requirements for `X402_PAYER_SECRET` wallet:

- funded with XLM (network fees)
- has USDC trustline
- has enough USDC for x402 charges

> [!TIP]
> `USDC_ISSUER` is **optional** for standard USDC; PLUTO resolves it automatically based on your `STELLAR_NETWORK`.

---

## x402 flow in one view

1. Your backend calls `POST /api/create-payment` with:
- `x-api-key`
- `x-pluto-pricing-mode: x402`

2. PLUTO responds `402 Payment Required` with challenge payload.
3. Your backend pays the exact challenge on Stellar.
4. Your backend verifies tx at `POST /api/verify-x402`.
5. Your backend retries `create-payment` with `X-Payment-Token`.

---

## Production `payOnStellar` sample

`lib/payOnStellar.js`

```js
import StellarSdk from "stellar-sdk";

const HORIZON_URL =
  process.env.STELLAR_HORIZON_URL || "https://horizon-testnet.stellar.org";

const NETWORK_PASSPHRASE =
  process.env.STELLAR_NETWORK === "public"
    ? StellarSdk.Networks.PUBLIC
    : StellarSdk.Networks.TESTNET;

export async function payOnStellar({ amount, recipient, memo, assetIssuer }) {
  const secret = process.env.X402_PAYER_SECRET;
  if (!secret) throw new Error("X402_PAYER_SECRET is missing");
  if (!amount || !recipient || !memo || !assetIssuer) {
    throw new Error("Missing x402 challenge payment fields");
  }
  if (Buffer.byteLength(memo, "utf8") > 28) {
    throw new Error("x402 memo exceeds 28 bytes");
  }

  const server = new StellarSdk.Horizon.Server(HORIZON_URL);
  const source = StellarSdk.Keypair.fromSecret(secret);
  const sourceAccount = await server.loadAccount(source.publicKey());
  const fee = await server.fetchBaseFee();

  const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: String(fee),
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: recipient,
        asset: new StellarSdk.Asset("USDC", assetIssuer),
        amount: String(amount),
      })
    )
    .addMemo(StellarSdk.Memo.text(memo))
    .setTimeout(30)
    .build();

  tx.sign(source);
  const result = await server.submitTransaction(tx);
  return result.hash;
}
```

---

## Store backend checkout route (x402)

`server/routes/checkout.js`

```js
import "dotenv/config";
import express from "express";
import { payOnStellar } from "../lib/payOnStellar.js";

const router = express.Router();
const API_URL = process.env.PLUTO_API_URL || "https://pluto-api.up.railway.app";

router.post("/checkout", async (req, res) => {
  try {
    const payload = {
      amount: req.body.amount,
      asset: "USDC",
      // Optional: Standard issuer is used if process.env.USDC_ISSUER is missing
      asset_issuer: process.env.USDC_ISSUER,
      recipient: process.env.MERCHANT_STELLAR_RECIPIENT,
      metadata: { cart_id: req.body.cartId },
    };

    const create = async (token) =>
      fetch(`${API_URL}/api/create-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.PLUTO_API_KEY,
          "x-pluto-pricing-mode": "x402",
          ...(token ? { "X-Payment-Token": token } : {}),
        },
        body: JSON.stringify(payload),
      });

    const first = await create();
    const firstBody = await first.json();

    if (first.ok) return res.status(first.status).json(firstBody);
    if (first.status !== 402) return res.status(first.status).json(firstBody);

    const txHash = await payOnStellar({
      amount: firstBody.amount,
      recipient: firstBody.recipient,
      memo: firstBody.memo,
      assetIssuer: firstBody.asset_issuer,
    });

    const verify = await fetch(`${API_URL}/api/verify-x402`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tx_hash: txHash,
        expected_amount: firstBody.amount,
        expected_recipient: firstBody.recipient,
        memo: firstBody.memo,
      }),
    });

    const verifyBody = await verify.json();
    if (!verify.ok || !verifyBody.access_token) {
      return res.status(verify.status).json(verifyBody);
    }

    const retry = await create(verifyBody.access_token);
    const retryBody = await retry.json();
    return res.status(retry.status).json(retryBody);
  } catch (err) {
    return res.status(500).json({ error: err.message || "Checkout failed" });
  }
});

export default router;
```

---

## Practical notes

- Keep x402 flow on server-side only.
- Do not trust client-provided challenge fields.
- Use exact challenge values (`amount`, `recipient`, `memo`, `asset_issuer`).
- `memo` must remain at most 28 bytes.
- Keep the returned `payment_id` in your order table.

---

## Related

- Non-x402 integration: `/docs/api-guide`
