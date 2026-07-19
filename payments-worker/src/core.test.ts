import { describe, expect, it } from "vitest";
import {
  allowedOrigin,
  deriveRecoveryCode,
  normalizeRecoveryCode,
  sha256,
  validateCheckoutPayload,
} from "./core";

describe("payment core", () => {
  it("derives a stable, high-entropy formatted recovery code", async () => {
    const first = await deriveRecoveryCode("cs_test_123", "signing-secret-at-least-32-characters");
    const second = await deriveRecoveryCode("cs_test_123", "signing-secret-at-least-32-characters");
    expect(first).toBe(second);
    expect(first).toMatch(/^CLO-[0-9A-HJKMNP-TV-Z]{5}(?:-[0-9A-HJKMNP-TV-Z]{5}){3}$/);
    expect(normalizeRecoveryCode(first.toLowerCase())).toBe(first);
    expect(await sha256(first)).toHaveLength(64);
  });

  it("rejects malformed recovery codes", () => {
    expect(normalizeRecoveryCode("CLO-AAAAA-AAAAA-AAAAA")).toBeNull();
    expect(normalizeRecoveryCode("BAD-AAAAA-AAAAA-AAAAA-AAAAA")).toBeNull();
    expect(normalizeRecoveryCode("CLO-IIIII-IIIII-IIIII-IIIII")).toBeNull();
  });

  it("accepts only the fixed pack and valid install ids", () => {
    expect(validateCheckoutPayload({
      packId: "first-light-garden",
      installId: "12345678-1234-1234-1234-123456789012",
    })).not.toBeNull();
    expect(validateCheckoutPayload({ packId: "other", installId: "1234567890123456" })).toBeNull();
    expect(validateCheckoutPayload({ packId: "first-light-garden", installId: "short" })).toBeNull();
  });

  it("uses an exact origin allowlist", () => {
    const configured = "https://matthew-altx.github.io,http://localhost:5173";
    expect(allowedOrigin("https://matthew-altx.github.io", configured)).toBe("https://matthew-altx.github.io");
    expect(allowedOrigin("https://evil.example", configured)).toBeNull();
  });
});
