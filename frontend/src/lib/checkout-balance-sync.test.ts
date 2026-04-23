import { describe, expect, it } from "vitest";
import {
  didWalletAccountSwitch,
  getBalanceAmount,
  getDefaultSourceAsset,
  sortSupportedAssetsByBalance,
} from "./checkout-balance-sync";

const balances = [
  { code: "XLM", issuer: null, balance: "12.5000000" },
  { code: "USDC", issuer: "issuer", balance: "87.1000000" },
  { code: "AQUA", issuer: "issuer-2", balance: "0.5000000" },
];

describe("checkout balance sync helpers", () => {
  it("reads a known balance amount", () => {
    expect(getBalanceAmount(balances, "USDC")).toBe(87.1);
  });

  it("falls back to zero for missing balances", () => {
    expect(getBalanceAmount(balances, "EURC")).toBe(0);
  });

  it("sorts supported assets by descending wallet balance", () => {
    expect(
      sortSupportedAssetsByBalance(["AQUA", "XLM", "USDC"], balances),
    ).toEqual(["USDC", "XLM", "AQUA"]);
  });

  it("chooses the highest-balance asset as the default source", () => {
    expect(getDefaultSourceAsset(["XLM", "USDC"], balances)).toBe("USDC");
  });

  it("returns null when there are no supported source assets", () => {
    expect(getDefaultSourceAsset([], balances)).toBeNull();
  });

  it("detects when the connected wallet account changes", () => {
    expect(
      didWalletAccountSwitch(
        "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
        "GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBQ4E",
      ),
    ).toBe(true);
  });

  it("does not treat the first wallet load as an account switch", () => {
    expect(
      didWalletAccountSwitch(
        null,
        "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
      ),
    ).toBe(false);
  });
});
