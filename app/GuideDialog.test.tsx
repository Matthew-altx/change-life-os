/** @vitest-environment jsdom */

import { act, useState, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { GuideDialog, type GuideMode } from "./GuideDialog";
import { getCopy } from "./i18n";

const copy = getCopy("en");
let root: Root | null = null;
let container: HTMLDivElement;

const mount = (element: ReactElement) => {
  root = createRoot(container);
  act(() => root?.render(element));
};

function ClosingHarness({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState(true);
  const [mode, setMode] = useState<GuideMode>("orientation");
  if (!open) return null;
  return (
    <GuideDialog
      copy={copy}
      screen="today"
      mode={mode}
      onModeChange={setMode}
      onClose={() => {
        onClose();
        setOpen(false);
      }}
      onGoToScreen={() => undefined}
    />
  );
}

function ModeHarness() {
  const [mode, setMode] = useState<GuideMode>("orientation");
  return (
    <GuideDialog
      copy={copy}
      screen="today"
      mode={mode}
      onModeChange={setMode}
      onClose={() => undefined}
      onGoToScreen={() => undefined}
    />
  );
}

beforeAll(() => {
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
    .IS_REACT_ACT_ENVIRONMENT = true;
});

beforeEach(() => {
  document.body.innerHTML = '<h1 id="screen-title" tabindex="-1">Today</h1>';
  container = document.createElement("div");
  document.body.append(container);
});

afterEach(() => {
  if (root) act(() => root?.unmount());
  root = null;
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("GuideDialog DOM behaviour", () => {
  it("focuses close first and restores the screen fallback after an automatic open", () => {
    const onClose = vi.fn();
    expect(document.activeElement).toBe(document.body);
    mount(<ClosingHarness onClose={onClose} />);

    expect(document.activeElement).toBe(
      container.querySelector(`button[aria-label="${copy.guide.closeGuide}"]`),
    );

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(document.getElementById("screen-title"));
  });

  it("restores a connected opener when the guide closes", () => {
    const opener = document.createElement("button");
    opener.textContent = "Open guide";
    document.body.prepend(opener);
    opener.focus();
    const onClose = vi.fn();
    mount(<ClosingHarness onClose={onClose} />);

    const close = container.querySelector<HTMLButtonElement>(
      `button[aria-label="${copy.guide.closeGuide}"]`,
    );
    act(() => close?.click());

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(opener);
  });

  it("uses the screen fallback when the original opener is disconnected", () => {
    const opener = document.createElement("button");
    opener.textContent = "Onboarding action";
    document.body.prepend(opener);
    opener.focus();
    mount(<ClosingHarness onClose={() => undefined} />);
    opener.remove();

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });

    expect(document.activeElement).toBe(document.getElementById("screen-title"));
  });

  it("wraps Tab and Shift+Tab inside the dialog", () => {
    mount(<ModeHarness />);
    const dialog = container.querySelector<HTMLElement>('[role="dialog"]');
    const close = container.querySelector<HTMLButtonElement>(
      `button[aria-label="${copy.guide.closeGuide}"]`,
    );
    const buttons = Array.from(
      dialog?.querySelectorAll<HTMLButtonElement>("button:not([disabled])") ?? [],
    ).filter((button) => button.tabIndex >= 0);
    const last = buttons.at(-1);

    act(() => {
      last?.focus();
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
    });
    expect(document.activeElement).toBe(close);

    act(() => {
      close?.focus();
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Tab", shiftKey: true }),
      );
    });
    expect(document.activeElement).toBe(last);
  });

  it("closes only once when Escape fires repeatedly", () => {
    const onClose = vi.fn();
    mount(<ClosingHarness onClose={onClose} />);

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(onClose).toHaveBeenCalledTimes(1);

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("removes the exact keydown handler it registered", () => {
    const addListener = vi.spyOn(document, "addEventListener");
    const removeListener = vi.spyOn(document, "removeEventListener");
    mount(<ModeHarness />);
    const keydownRegistration = addListener.mock.calls.find(
      ([eventType]) => eventType === "keydown",
    );
    const keydownHandler = keydownRegistration?.[1];

    expect(keydownHandler).toBeTypeOf("function");
    act(() => root?.unmount());
    root = null;

    expect(removeListener).toHaveBeenCalledWith("keydown", keydownHandler);
  });

  it("ignores dialog presses and closes on the backdrop", () => {
    const onClose = vi.fn();
    mount(<ClosingHarness onClose={onClose} />);
    const dialog = container.querySelector<HTMLElement>('[role="dialog"]');
    const backdrop = container.querySelector<HTMLElement>(".guide-backdrop");

    act(() => {
      dialog?.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    });
    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      backdrop?.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(document.getElementById("screen-title"));
  });

  it("keeps both tab panels mounted and uses arrow-key roving focus", () => {
    mount(<ModeHarness />);
    const orientationTab = container.querySelector<HTMLButtonElement>(
      "#guide-orientation-tab",
    );
    const moduleTab = container.querySelector<HTMLButtonElement>(
      "#guide-module-tab",
    );
    const orientationPanel = container.querySelector<HTMLElement>(
      "#guide-orientation-panel",
    );
    const modulePanel = container.querySelector<HTMLElement>("#guide-module-panel");

    expect(orientationTab?.getAttribute("aria-controls")).toBe(orientationPanel?.id);
    expect(moduleTab?.getAttribute("aria-controls")).toBe(modulePanel?.id);
    expect(orientationPanel?.hidden).toBe(false);
    expect(modulePanel?.hidden).toBe(true);
    expect(orientationTab?.tabIndex).toBe(0);
    expect(moduleTab?.tabIndex).toBe(-1);

    act(() => {
      orientationTab?.focus();
      orientationTab?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
      );
    });
    expect(orientationPanel?.hidden).toBe(true);
    expect(modulePanel?.hidden).toBe(false);
    expect(moduleTab?.tabIndex).toBe(0);
    expect(document.activeElement).toBe(moduleTab);

    act(() => {
      moduleTab?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }),
      );
    });
    expect(orientationPanel?.hidden).toBe(false);
    expect(modulePanel?.hidden).toBe(true);
    expect(orientationTab?.tabIndex).toBe(0);
    expect(document.activeElement).toBe(orientationTab);
  });
});
