export const PACK_ID = "first-light-garden" as const;
export const PACK_AMOUNT = 700;
export const PACK_CURRENCY = "hkd";
export const RECOVERY_PREFIX = "CLO";

const encoder = new TextEncoder();
const BASE32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export const bytesToHex = (bytes: Uint8Array) =>
  Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");

export const sha256 = async (value: string) => {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return bytesToHex(new Uint8Array(digest));
};

const base32 = (bytes: Uint8Array, length: number) => {
  let bits = 0;
  let buffer = 0;
  let result = "";
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 5 && result.length < length) {
      bits -= 5;
      result += BASE32[(buffer >>> bits) & 31];
    }
  }
  return result;
};

export const deriveRecoveryCode = async (sessionId: string, signingSecret: string) => {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(signingSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(sessionId));
  const compact = base32(new Uint8Array(signature), 20);
  return `${RECOVERY_PREFIX}-${compact.slice(0, 5)}-${compact.slice(5, 10)}-${compact.slice(10, 15)}-${compact.slice(15, 20)}`;
};

export const normalizeRecoveryCode = (value: unknown) => {
  if (typeof value !== "string") return null;
  const compact = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!compact.startsWith(RECOVERY_PREFIX) || compact.length !== 23) return null;
  const body = compact.slice(3);
  if (![...body].every((character) => BASE32.includes(character))) return null;
  return `${RECOVERY_PREFIX}-${body.slice(0, 5)}-${body.slice(5, 10)}-${body.slice(10, 15)}-${body.slice(15, 20)}`;
};

export const parseAllowedOrigins = (value: string) =>
  value.split(",").map((origin) => origin.trim().replace(/\/$/, "")).filter(Boolean);

export const allowedOrigin = (origin: string | null, configured: string) => {
  if (!origin) return null;
  return parseAllowedOrigins(configured).includes(origin.replace(/\/$/, "")) ? origin : null;
};

export const validateCheckoutPayload = (value: unknown): { packId: typeof PACK_ID; installId: string } | null => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (record.packId !== PACK_ID || typeof record.installId !== "string") return null;
  if (!/^[A-Za-z0-9_-]{16,100}$/.test(record.installId)) return null;
  return { packId: PACK_ID, installId: record.installId };
};
