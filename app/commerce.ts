export const COMMERCE_STORAGE_KEY = "changeLifeOSCommerce";
export const SUPPORTER_PACK_ID = "first-light-garden" as const;
export type EntitlementStatus = "active" | "suspended" | "revoked";

export type CommerceState = {
  version: 1;
  installId: string;
  entitlement: null | {
    packId: typeof SUPPORTER_PACK_ID;
    recoveryCode: string;
    status: EntitlementStatus;
    verifiedAt: string;
  };
};

export type CommerceConfig = {
  enabled: boolean;
  apiBase: string;
};

const makeInstallId = () => typeof crypto !== "undefined" && "randomUUID" in crypto
  ? crypto.randomUUID()
  : `${Date.now()}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;

export const createCommerceState = (installId = makeInstallId()): CommerceState => ({
  version: 1,
  installId,
  entitlement: null,
});

export const loadCommerceState = (storage: Pick<Storage, "getItem">): CommerceState => {
  try {
    const raw = storage.getItem(COMMERCE_STORAGE_KEY);
    if (!raw) return createCommerceState();
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null || Array.isArray(value)) return createCommerceState();
    const record = value as Record<string, unknown>;
    if (record.version !== 1 || typeof record.installId !== "string" || record.installId.length < 16) return createCommerceState();
    const entitlementValue = record.entitlement;
    if (entitlementValue === null) return { version: 1, installId: record.installId, entitlement: null };
    if (typeof entitlementValue !== "object" || entitlementValue === null || Array.isArray(entitlementValue)) return createCommerceState(record.installId);
    const entitlement = entitlementValue as Record<string, unknown>;
    if (
      entitlement.packId !== SUPPORTER_PACK_ID ||
      typeof entitlement.recoveryCode !== "string" ||
      !["active", "suspended", "revoked"].includes(String(entitlement.status)) ||
      typeof entitlement.verifiedAt !== "string"
    ) return createCommerceState(record.installId);
    return {
      version: 1,
      installId: record.installId,
      entitlement: entitlement as CommerceState["entitlement"],
    };
  } catch {
    return createCommerceState();
  }
};

export const saveCommerceState = (
  storage: Pick<Storage, "setItem">,
  state: CommerceState,
) => {
  try {
    storage.setItem(COMMERCE_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
};

export const commerceConfig = (): CommerceConfig => {
  const env = import.meta.env as Record<string, string | boolean | undefined>;
  const apiBase = typeof env.VITE_PAYMENT_API_BASE === "string"
    ? env.VITE_PAYMENT_API_BASE.replace(/\/$/, "")
    : "";
  return { enabled: env.VITE_COMMERCE_ENABLED === "true" && apiBase.length > 0, apiBase };
};

const post = async <T>(
  config: CommerceConfig,
  path: string,
  body: unknown,
  fetcher: typeof fetch = fetch,
): Promise<T> => {
  if (!config.enabled) throw new Error("commerce-disabled");
  const response = await fetcher(`${config.apiBase}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const value = await response.json() as T & { error?: string };
  if (!response.ok && response.status !== 202) throw new Error(value.error ?? "request-failed");
  return value;
};

export const createCheckout = (
  config: CommerceConfig,
  installId: string,
  fetcher?: typeof fetch,
) => post<{ checkoutUrl: string }>(config, "/api/checkout", {
  packId: SUPPORTER_PACK_ID,
  installId,
}, fetcher);

export const fulfillCheckout = (
  config: CommerceConfig,
  sessionId: string,
  installId: string,
  fetcher?: typeof fetch,
) => post<{
  status: "pending" | "fulfilled";
  entitlement?: { packId: typeof SUPPORTER_PACK_ID; recoveryCode: string; status: EntitlementStatus };
}>(config, "/api/fulfill", { sessionId, installId }, fetcher);

export const recoverEntitlement = (
  config: CommerceConfig,
  recoveryCode: string,
  mode: "redeem" | "verify" = "redeem",
  fetcher?: typeof fetch,
) => post<{
  status: EntitlementStatus | "invalid";
  packId?: typeof SUPPORTER_PACK_ID;
}>(config, `/api/${mode}`, { recoveryCode }, fetcher);

export const verificationDue = (verifiedAt: string, now = Date.now()) => {
  const last = Date.parse(verifiedAt);
  return !Number.isFinite(last) || now - last >= 86_400_000;
};
