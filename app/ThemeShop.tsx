"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  commerceConfig,
  createCheckout,
  fulfillCheckout,
  loadCommerceState,
  recoverEntitlement,
  saveCommerceState,
  verificationDue,
  type CommerceState,
  type EntitlementStatus,
} from "./commerce";
import type { AppState, GardenThemeId } from "./domain";
import type { Copy } from "./i18n";

type ShopMessage = "confirming" | "pending" | "active" | "suspended" | "revoked" | "invalid" | "failed" | "cancelled" | null;

export function ThemeShop({
  state,
  update,
  copy,
  previewTheme,
  setPreviewTheme,
}: {
  state: AppState;
  update: (fn: (current: AppState) => AppState) => void;
  copy: Copy;
  previewTheme: GardenThemeId | null;
  setPreviewTheme: (theme: GardenThemeId | null) => void;
}) {
  const config = useMemo(() => commerceConfig(), []);
  const [commerce, setCommerce] = useState<CommerceState | null>(null);
  const [message, setMessage] = useState<ShopMessage>(null);
  const [recoveryInput, setRecoveryInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const handledSessions = useRef(new Set<string>());
  const sessionId = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("session_id");
  const entitled = commerce?.entitlement?.status === "active";

  const persist = useCallback((next: CommerceState) => {
    saveCommerceState(window.localStorage, next);
    setCommerce(next);
  }, []);

  const applyStatus = useCallback((
    current: CommerceState,
    recoveryCode: string,
    status: EntitlementStatus,
  ) => {
    const next: CommerceState = {
      ...current,
      entitlement: {
        packId: "first-light-garden",
        recoveryCode,
        status,
        verifiedAt: new Date().toISOString(),
      },
    };
    persist(next);
    setMessage(status);
    if (status === "active") {
      update((app) => ({
        ...app,
        growth: { ...app.growth, garden: { ...app.growth.garden, activeThemeId: "first-light-garden" } },
      }));
      setPreviewTheme(null);
    } else {
      update((app) => ({
        ...app,
        growth: { ...app.growth, garden: { ...app.growth.garden, activeThemeId: "classic" } },
      }));
    }
  }, [persist, setPreviewTheme, update]);

  const confirmSession = useCallback(async (current: CommerceState, id: string) => {
    if (!config.enabled) return;
    setBusy(true);
    setMessage("confirming");
    try {
      const result = await fulfillCheckout(config, id, current.installId);
      if (result.status === "pending" || !result.entitlement) {
        setMessage("pending");
      } else {
        applyStatus(current, result.entitlement.recoveryCode, result.entitlement.status);
        const url = new URL(window.location.href);
        url.searchParams.delete("checkout");
        url.searchParams.delete("session_id");
        window.history.replaceState({}, "", url);
      }
    } catch {
      setMessage("failed");
    } finally {
      setBusy(false);
    }
  }, [applyStatus, config]);

  useEffect(() => {
    let cancelled = false;
    window.queueMicrotask(() => {
      if (cancelled) return;
      const loaded = loadCommerceState(window.localStorage);
      persist(loaded);
      const params = new URLSearchParams(window.location.search);
      if (params.get("checkout") === "cancelled") {
        setMessage("cancelled");
        const url = new URL(window.location.href);
        url.searchParams.delete("checkout");
        window.history.replaceState({}, "", url);
      }
    });
    return () => { cancelled = true; };
  }, [persist]);

  useEffect(() => {
    if (!commerce || !sessionId || handledSessions.current.has(sessionId)) return;
    handledSessions.current.add(sessionId);
    void confirmSession(commerce, sessionId);
  }, [commerce, confirmSession, sessionId]);

  useEffect(() => {
    const entitlement = commerce?.entitlement;
    if (!config.enabled || !commerce || !entitlement || !verificationDue(entitlement.verifiedAt)) return;
    void recoverEntitlement(config, entitlement.recoveryCode, "verify")
      .then((result) => {
        if (result.status !== "invalid") applyStatus(commerce, entitlement.recoveryCode, result.status);
      })
      .catch(() => undefined);
  }, [applyStatus, commerce, config]);

  const buy = async () => {
    if (!commerce || !config.enabled) return;
    setBusy(true);
    setMessage(null);
    try {
      const result = await createCheckout(config, commerce.installId);
      window.location.assign(result.checkoutUrl);
    } catch {
      setMessage("failed");
      setBusy(false);
    }
  };

  const restore = async () => {
    if (!commerce || !config.enabled || !recoveryInput.trim()) return;
    setBusy(true);
    try {
      const result = await recoverEntitlement(config, recoveryInput, "redeem");
      if (result.status === "invalid") setMessage("invalid");
      else applyStatus(commerce, recoveryInput.trim().toUpperCase(), result.status);
    } catch {
      setMessage("failed");
    } finally {
      setBusy(false);
    }
  };

  const selectTheme = (theme: GardenThemeId) => {
    if (theme === "first-light-garden" && !entitled) return;
    update((current) => ({
      ...current,
      growth: { ...current.growth, garden: { ...current.growth.garden, activeThemeId: theme } },
    }));
    setPreviewTheme(null);
  };

  const recoveryCode = commerce?.entitlement?.recoveryCode;
  return (
    <section className="supporter-shop" aria-labelledby="supporter-shop-title">
      <div className="supporter-copy">
        <p className="eyebrow">{copy.commerce.eyebrow}</p>
        <h2 id="supporter-shop-title">{copy.commerce.title}</h2>
        <p>{copy.commerce.intro}</p>
        <ul>{copy.commerce.elements.map((item) => <li key={item}>{item}</li>)}</ul>
        <p className="no-advantage">{copy.commerce.noAdvantage}</p>
        <div className="theme-actions">
          <button className="button ghost" onClick={() => setPreviewTheme(previewTheme === "first-light-garden" ? null : "first-light-garden")}>{previewTheme === "first-light-garden" ? copy.commerce.stopPreview : copy.commerce.preview}</button>
          {entitled && <button className="button secondary" onClick={() => selectTheme(state.growth.garden.activeThemeId === "first-light-garden" ? "classic" : "first-light-garden")}>{state.growth.garden.activeThemeId === "first-light-garden" ? copy.commerce.useClassic : copy.commerce.useFirstLight}</button>}
          {!entitled && <button className="button primary" onClick={buy} disabled={!config.enabled || busy}>{copy.commerce.buy}</button>}
        </div>
        {!config.enabled && <p className="commerce-unavailable">{copy.commerce.unavailable}</p>}
        <p className="purchase-terms">{copy.commerce.purchaseTerms}</p>
      </div>
      <aside className="card recovery-panel">
        {message && <p className={`commerce-message message-${message}`} role="status">{copy.commerce[message]}</p>}
        {message === "pending" && sessionId && commerce && <button className="button ghost" onClick={() => confirmSession(commerce, sessionId)} disabled={busy}>{copy.commerce.retry}</button>}
        {recoveryCode && <div className="recovery-code"><strong>{copy.commerce.recoveryTitle}</strong><p>{copy.commerce.recoveryIntro}</p><code>{recoveryCode}</code><button className="button ghost" onClick={async () => {
          try {
            await navigator.clipboard.writeText(recoveryCode);
            setCopied(true);
          } catch {
            setMessage("failed");
          }
        }}>{copied ? copy.commerce.copied : copy.commerce.copyCode}</button></div>}
        <div className="restore-form"><h3>{copy.commerce.restoreTitle}</h3><p>{copy.commerce.restoreIntro}</p><input value={recoveryInput} onChange={(event) => setRecoveryInput(event.target.value)} placeholder={copy.commerce.restorePlaceholder} autoCapitalize="characters"/><button className="button ghost" onClick={restore} disabled={!config.enabled || busy}>{busy ? copy.commerce.restoring : copy.commerce.restore}</button></div>
      </aside>
    </section>
  );
}
