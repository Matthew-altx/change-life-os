import Stripe from "stripe";
import {
  PACK_AMOUNT,
  PACK_CURRENCY,
  PACK_ID,
  allowedOrigin,
  deriveRecoveryCode,
  normalizeRecoveryCode,
  sha256,
  validateCheckoutPayload,
} from "./core";

type EntitlementStatus = "active" | "suspended" | "revoked";
interface D1Result { success: boolean }
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<D1Result>;
}
interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
}

interface Env {
  DB: D1Database;
  ALLOWED_ORIGINS: string;
  SUCCESS_URL: string;
  STRIPE_PRICE_FIRST_LIGHT_GARDEN: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  ENTITLEMENT_SIGNING_SECRET: string;
}

type PurchaseRow = {
  stripe_session_id: string;
  stripe_payment_intent_id: string | null;
  pack_id: string;
  amount_total: number;
  currency: string;
  payment_status: string;
  install_id_hash: string;
  entitlement_id: string;
  entitlement_status: EntitlementStatus;
};

const json = (body: unknown, status = 200, origin: string | null = null) => new Response(
  JSON.stringify(body),
  {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...(origin ? {
        "access-control-allow-origin": origin,
        "access-control-allow-methods": "POST,OPTIONS",
        "access-control-allow-headers": "content-type",
        "vary": "Origin",
      } : {}),
    },
  },
);

const readJson = async (request: Request) => {
  const length = Number(request.headers.get("content-length") ?? "0");
  if (length > 8_192) throw new Error("payload-too-large");
  return request.json() as Promise<unknown>;
};

const stripeClient = (env: Env) => new Stripe(env.STRIPE_SECRET_KEY, {
  httpClient: Stripe.createFetchHttpClient(),
  telemetry: false,
  maxNetworkRetries: 2,
});

const consumeRateLimit = async (
  env: Env,
  scope: string,
  keyHash: string,
  limit: number,
  windowMs = 60_000,
) => {
  const cutoff = new Date(Date.now() - windowMs).toISOString();
  const recent = await env.DB.prepare(`
    SELECT COUNT(*) AS total FROM api_attempts
    WHERE scope = ?1 AND key_hash = ?2 AND created_at > ?3
  `).bind(scope, keyHash, cutoff).first<{ total: number }>();
  if ((recent?.total ?? 0) >= limit) return false;
  await env.DB.prepare(`INSERT INTO api_attempts (scope, key_hash, created_at) VALUES (?1, ?2, ?3)`)
    .bind(scope, keyHash, new Date().toISOString()).run();
  return true;
};

const findPurchase = (env: Env, sessionId: string) => env.DB.prepare(`
  SELECT p.stripe_session_id, p.stripe_payment_intent_id, p.pack_id,
    p.amount_total, p.currency, p.payment_status, p.install_id_hash,
    p.entitlement_id, e.status AS entitlement_status
  FROM purchases p
  JOIN entitlements e ON e.id = p.entitlement_id
  WHERE p.stripe_session_id = ?1
`).bind(sessionId).first<PurchaseRow>();

export const validSession = (session: Stripe.Checkout.Session, env: Pick<Env, "STRIPE_PRICE_FIRST_LIGHT_GARDEN">) => {
  const price = session.line_items?.data[0]?.price;
  return session.payment_status === "paid" &&
    session.metadata?.pack_id === PACK_ID &&
    session.amount_total === PACK_AMOUNT &&
    session.currency === PACK_CURRENCY &&
    price?.id === env.STRIPE_PRICE_FIRST_LIGHT_GARDEN;
};

const fulfillSession = async (sessionId: string, env: Env) => {
  const existing = await findPurchase(env, sessionId);
  if (existing) return existing;

  const session = await stripeClient(env).checkout.sessions.retrieve(sessionId, { expand: ["line_items"] });
  if (!validSession(session, env) || !session.client_reference_id) return null;

  const recoveryCode = await deriveRecoveryCode(session.id, env.ENTITLEMENT_SIGNING_SECRET);
  const recoveryHash = await sha256(recoveryCode);
  const entitlementId = `ent_${(await sha256(session.id)).slice(0, 28)}`;
  const paymentIntentId = typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent?.id ?? null;
  const now = new Date().toISOString();

  await env.DB.batch([
    env.DB.prepare(`
      INSERT OR IGNORE INTO entitlements
        (id, pack_id, recovery_code_hash, status, created_at, updated_at)
      VALUES (?1, ?2, ?3, 'active', ?4, ?4)
    `).bind(entitlementId, PACK_ID, recoveryHash, now),
    env.DB.prepare(`
      INSERT OR IGNORE INTO purchases
        (stripe_session_id, stripe_payment_intent_id, pack_id, amount_total,
         currency, payment_status, install_id_hash, entitlement_id, created_at, fulfilled_at)
      VALUES (?1, ?2, ?3, ?4, ?5, 'paid', ?6, ?7, ?8, ?8)
    `).bind(
      session.id,
      paymentIntentId,
      PACK_ID,
      PACK_AMOUNT,
      PACK_CURRENCY,
      session.client_reference_id,
      entitlementId,
      now,
    ),
  ]);

  return findPurchase(env, sessionId);
};

const setEntitlementStatusByPaymentIntent = async (
  env: Env,
  paymentIntentId: string | null,
  status: EntitlementStatus,
) => {
  if (!paymentIntentId) return;
  await env.DB.prepare(`
    UPDATE entitlements SET status = ?1, updated_at = ?2
    WHERE id IN (SELECT entitlement_id FROM purchases WHERE stripe_payment_intent_id = ?3)
  `).bind(status, new Date().toISOString(), paymentIntentId).run();
};

const paymentIntentIdFrom = (value: string | Stripe.PaymentIntent | null | undefined) =>
  typeof value === "string" ? value : value?.id ?? null;

const handleWebhook = async (request: Request, env: Env) => {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return json({ error: "invalid-request" }, 400);
  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    const stripe = stripeClient(env);
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
      undefined,
      Stripe.createSubtleCryptoProvider(),
    );
  } catch {
    return json({ error: "invalid-signature" }, 400);
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    await fulfillSession((event.data.object as Stripe.Checkout.Session).id, env);
  } else if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    await setEntitlementStatusByPaymentIntent(env, paymentIntentIdFrom(charge.payment_intent), "revoked");
  } else if (event.type === "charge.dispute.created") {
    const dispute = event.data.object as Stripe.Dispute;
    await setEntitlementStatusByPaymentIntent(env, paymentIntentIdFrom(dispute.payment_intent), "suspended");
  } else if (event.type === "charge.dispute.closed") {
    const dispute = event.data.object as Stripe.Dispute;
    await setEntitlementStatusByPaymentIntent(
      env,
      paymentIntentIdFrom(dispute.payment_intent),
      dispute.status === "won" ? "active" : "revoked",
    );
  }
  return json({ received: true });
};

const handleCheckout = async (request: Request, env: Env, origin: string) => {
  const payload = validateCheckoutPayload(await readJson(request));
  if (!payload) return json({ error: "invalid-request" }, 400, origin);
  const installHash = await sha256(payload.installId);
  if (!await consumeRateLimit(env, "checkout", installHash, 2)) {
    return json({ error: "try-again-later" }, 429, origin);
  }
  const recent = await env.DB.prepare(`
    SELECT created_at FROM checkout_attempts
    WHERE install_id_hash = ?1 AND created_at > ?2
    ORDER BY created_at DESC LIMIT 1
  `).bind(installHash, new Date(Date.now() - 60_000).toISOString()).first();
  if (recent) return json({ error: "try-again-later" }, 429, origin);

  const session = await stripeClient(env).checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: env.STRIPE_PRICE_FIRST_LIGHT_GARDEN, quantity: 1 }],
    client_reference_id: installHash,
    metadata: { pack_id: PACK_ID },
    success_url: `${env.SUCCESS_URL}${env.SUCCESS_URL.includes("?") ? "&" : "?"}checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.SUCCESS_URL}${env.SUCCESS_URL.includes("?") ? "&" : "?"}checkout=cancelled`,
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
  });
  await env.DB.prepare(`INSERT INTO checkout_attempts (install_id_hash, created_at) VALUES (?1, ?2)`)
    .bind(installHash, new Date().toISOString()).run();
  return json({ checkoutUrl: session.url }, 200, origin);
};

const handleFulfill = async (request: Request, env: Env, origin: string) => {
  const value = await readJson(request);
  if (typeof value !== "object" || value === null || Array.isArray(value)) return json({ error: "invalid-request" }, 400, origin);
  const { sessionId, installId } = value as Record<string, unknown>;
  if (typeof sessionId !== "string" || !/^cs_[A-Za-z0-9_]+$/.test(sessionId) || typeof installId !== "string") {
    return json({ error: "invalid-request" }, 400, origin);
  }
  const installHash = await sha256(installId);
  if (!await consumeRateLimit(env, "fulfill", installHash, 12)) {
    return json({ error: "try-again-later" }, 429, origin);
  }
  const purchase = await fulfillSession(sessionId, env);
  if (!purchase) return json({ status: "pending" }, 202, origin);
  if (purchase.install_id_hash !== installHash) return json({ error: "invalid-request" }, 400, origin);
  const recoveryCode = await deriveRecoveryCode(sessionId, env.ENTITLEMENT_SIGNING_SECRET);
  return json({
    status: "fulfilled",
    entitlement: { packId: PACK_ID, recoveryCode, status: purchase.entitlement_status },
  }, 200, origin);
};

const handleRecovery = async (request: Request, env: Env, origin: string) => {
  const value = await readJson(request);
  if (typeof value !== "object" || value === null || Array.isArray(value)) return json({ error: "invalid-request" }, 400, origin);
  const recoveryCode = normalizeRecoveryCode((value as Record<string, unknown>).recoveryCode);
  if (!recoveryCode) return json({ status: "invalid" }, 200, origin);
  const recoveryHash = await sha256(recoveryCode);
  if (!await consumeRateLimit(env, "recovery", recoveryHash, 12)) {
    return json({ error: "try-again-later" }, 429, origin);
  }
  const row = await env.DB.prepare(`SELECT pack_id, status FROM entitlements WHERE recovery_code_hash = ?1`)
    .bind(recoveryHash).first<{ pack_id: string; status: EntitlementStatus }>();
  if (!row) return json({ status: "invalid" }, 200, origin);
  return json({ status: row.status, packId: row.pack_id }, 200, origin);
};

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health") {
      return json({ ok: true, service: "change-life-os-payments" });
    }
    if (request.method === "POST" && url.pathname === "/api/stripe/webhook") {
      return handleWebhook(request, env);
    }

    const origin = allowedOrigin(request.headers.get("origin"), env.ALLOWED_ORIGINS);
    if (!origin) return json({ error: "origin-not-allowed" }, 403);
    if (request.method === "OPTIONS") return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": origin,
        "access-control-allow-methods": "POST,OPTIONS",
        "access-control-allow-headers": "content-type",
        "access-control-max-age": "86400",
        "vary": "Origin",
      },
    });
    if (request.method !== "POST") return json({ error: "not-found" }, 404, origin);

    try {
      if (url.pathname === "/api/checkout") return handleCheckout(request, env, origin);
      if (url.pathname === "/api/fulfill") return handleFulfill(request, env, origin);
      if (url.pathname === "/api/redeem" || url.pathname === "/api/verify") return handleRecovery(request, env, origin);
      return json({ error: "not-found" }, 404, origin);
    } catch {
      return json({ error: "request-failed" }, 500, origin);
    }
  },
};

export default worker;
