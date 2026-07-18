import { describe, expect, it } from "vitest";
import worker, { validSession } from "./index";

const env = {
  ALLOWED_ORIGINS: "https://matthew-altx.github.io,http://localhost:5173",
  SUCCESS_URL: "https://matthew-altx.github.io/change-life-os/",
  STRIPE_PRICE_FIRST_LIGHT_GARDEN: "price_test",
  STRIPE_SECRET_KEY: "sk_test_placeholder",
  STRIPE_WEBHOOK_SECRET: "whsec_placeholder",
  ENTITLEMENT_SIGNING_SECRET: "a-placeholder-secret-with-at-least-32-characters",
  DB: {
    prepare: () => {
      throw new Error("database should not be reached for this request");
    },
    batch: async () => [],
  },
};

const call = (request: Request) => worker.fetch(request, env as never);

describe("payment worker boundary", () => {
  it("accepts only the paid HKD 700 session for the fixed pack and Price", () => {
    const session = {
      payment_status: "paid",
      metadata: { pack_id: "first-light-garden" },
      amount_total: 700,
      currency: "hkd",
      line_items: { data: [{ price: { id: "price_test" } }] },
    };
    const price = { STRIPE_PRICE_FIRST_LIGHT_GARDEN: "price_test" };
    expect(validSession(session as never, price)).toBe(true);
    expect(validSession({ ...session, amount_total: 701 } as never, price)).toBe(false);
    expect(validSession({ ...session, currency: "usd" } as never, price)).toBe(false);
    expect(validSession({ ...session, metadata: { pack_id: "other" } } as never, price)).toBe(false);
    expect(validSession({ ...session, payment_status: "unpaid" } as never, price)).toBe(false);
    expect(validSession(session as never, { STRIPE_PRICE_FIRST_LIGHT_GARDEN: "price_other" })).toBe(false);
  });

  it("exposes only a minimal health response", async () => {
    const response = await call(new Request("https://payments.example/health"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, service: "change-life-os-payments" });
  });

  it("blocks browser API calls outside the exact origin allowlist", async () => {
    const response = await call(new Request("https://payments.example/api/redeem", {
      method: "POST",
      headers: { origin: "https://evil.example", "content-type": "application/json" },
      body: JSON.stringify({ recoveryCode: "CLO-00000-00000-00000-00000" }),
    }));
    expect(response.status).toBe(403);
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("returns scoped CORS headers for preflight", async () => {
    const response = await call(new Request("https://payments.example/api/checkout", {
      method: "OPTIONS",
      headers: { origin: "https://matthew-altx.github.io" },
    }));
    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe("https://matthew-altx.github.io");
  });

  it("rejects the wrong product before contacting Stripe or D1", async () => {
    const response = await call(new Request("https://payments.example/api/checkout", {
      method: "POST",
      headers: { origin: "https://matthew-altx.github.io", "content-type": "application/json" },
      body: JSON.stringify({ packId: "other-pack", installId: "1234567890123456" }),
    }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid-request" });
  });

  it("rejects malformed fulfillment and unsigned webhook requests", async () => {
    const fulfill = await call(new Request("https://payments.example/api/fulfill", {
      method: "POST",
      headers: { origin: "https://matthew-altx.github.io", "content-type": "application/json" },
      body: JSON.stringify({ sessionId: "bad", installId: "1234567890123456" }),
    }));
    expect(fulfill.status).toBe(400);

    const webhook = await call(new Request("https://payments.example/api/stripe/webhook", {
      method: "POST",
      body: "{}",
    }));
    expect(webhook.status).toBe(400);
    expect(await webhook.json()).toEqual({ error: "invalid-request" });
  });
});
