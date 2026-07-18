import { describe, expect, it } from "vitest";
import {
  COMMERCE_STORAGE_KEY,
  createCheckout,
  createCommerceState,
  loadCommerceState,
  saveCommerceState,
  verificationDue,
} from "./commerce";

describe("commerce client", () => {
  it("round-trips local entitlement state", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
    };
    const state = {
      ...createCommerceState("12345678-1234-1234-1234-123456789012"),
      entitlement: {
        packId: "first-light-garden" as const,
        recoveryCode: "CLO-00000-11111-22222-33333",
        status: "active" as const,
        verifiedAt: "2026-07-19T00:00:00.000Z",
      },
    };
    expect(saveCommerceState(storage, state)).toBe(true);
    expect(values.has(COMMERCE_STORAGE_KEY)).toBe(true);
    expect(loadCommerceState(storage)).toEqual(state);
  });

  it("sends only the fixed pack id and install id to checkout", async () => {
    const fetcher = (async (_url: string, init?: RequestInit) => {
      expect(JSON.parse(String(init?.body))).toEqual({
        packId: "first-light-garden",
        installId: "12345678-1234-1234-1234-123456789012",
      });
      return new Response(JSON.stringify({ checkoutUrl: "https://checkout.stripe.test/session" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch;
    await expect(createCheckout(
      { enabled: true, apiBase: "https://api.example" },
      "12345678-1234-1234-1234-123456789012",
      fetcher,
    )).resolves.toEqual({ checkoutUrl: "https://checkout.stripe.test/session" });
  });

  it("verifies active entitlements at most once per day", () => {
    expect(verificationDue("2026-07-19T00:00:00.000Z", Date.parse("2026-07-19T23:59:59.000Z"))).toBe(false);
    expect(verificationDue("2026-07-19T00:00:00.000Z", Date.parse("2026-07-20T00:00:00.000Z"))).toBe(true);
  });
});
