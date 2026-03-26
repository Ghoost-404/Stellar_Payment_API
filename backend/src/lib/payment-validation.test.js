import { describe, expect, it } from "vitest";
import {
  MINIMUM_XLM_PAYMENT_AMOUNT,
  validateCreatePayment,
} from "./payment-validation.js";

describe("validateCreatePayment", () => {
  it("accepts a native XLM amount at the minimum threshold", () => {
    const result = validateCreatePayment({
      amount: MINIMUM_XLM_PAYMENT_AMOUNT,
      asset: "XLM",
      recipient: "GRECIPIENT",
    });

    expect(result).toBeNull();
  });

  it("rejects a native XLM amount below the minimum threshold", () => {
    const result = validateCreatePayment({
      amount: 0.0000001,
      asset: "XLM",
      recipient: "GRECIPIENT",
    });

    expect(result).toBe(
      `Minimum XLM payment amount is ${MINIMUM_XLM_PAYMENT_AMOUNT}`
    );
  });

  it("does not apply the XLM minimum to non-native assets", () => {
    const result = validateCreatePayment({
      amount: 0.0000001,
      asset: "USDC",
      asset_issuer: "GISSUER",
      recipient: "GRECIPIENT",
    });

    expect(result).toBeNull();
  });
});
