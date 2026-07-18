"use client";

import { useEffect, useRef, useState } from "react";
import type { Copy, Screen } from "./i18n";

export type GuideMode = "orientation" | "module";

type GuideDialogProps = {
  copy: Copy;
  screen: Screen;
  mode: GuideMode;
  onModeChange: (mode: GuideMode) => void;
  onClose: () => void;
  onGoToScreen: (screen: Screen) => void;
};

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function GuideDialog({
  copy,
  screen,
  mode,
  onModeChange,
  onClose,
  onGoToScreen,
}: GuideDialogProps) {
  const [step, setStep] = useState(0);
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const moduleGuide = copy.guide.modules[screen];
  const orientationStep = copy.guide.orientation[step];
  const isLastStep = step === copy.guide.orientation.length - 1;

  useEffect(() => {
    previouslyFocused.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => !element.hasAttribute("disabled"));
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) {
        event.preventDefault();
        return;
      }

      const activeElement = document.activeElement;
      if (event.shiftKey && (activeElement === first || !dialog.contains(activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (activeElement === last || !dialog.contains(activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused.current?.focus();
    };
  }, [onClose]);

  const finish = () => {
    onGoToScreen(screen);
    onClose();
  };

  const dialogTitle = mode === "orientation"
    ? copy.guide.title
    : copy.guide.moduleTitle(copy.nav[screen]);

  return (
    <div
      className="guide-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className="guide-modal guide-dialog guide-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-title"
      >
        <header>
          <div>
            <p className="eyebrow">{copy.guide.eyebrow}</p>
            <h2 id="guide-title">{dialogTitle}</h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="close"
            onClick={onClose}
            aria-label={copy.guide.closeGuide}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        {mode === "orientation" ? (
          <section
            id="guide-orientation-panel"
            className="orientation-guide"
            role="tabpanel"
            aria-labelledby="guide-orientation-tab"
            aria-live="polite"
          >
            <div
              className="guide-progress"
              aria-label={copy.onboarding.stepProgress(
                step + 1,
                copy.guide.orientation.length,
              )}
            >
              {copy.guide.orientation.map((item, index) => (
                <span
                  key={item.title}
                  className={index <= step ? "active" : ""}
                  aria-current={index === step ? "step" : undefined}
                />
              ))}
            </div>
            <article className="guide-step">
              <p className="eyebrow">
                {copy.onboarding.stepProgress(
                  step + 1,
                  copy.guide.orientation.length,
                )}
              </p>
              <h3>{orientationStep.title}</h3>
              <p>{orientationStep.body}</p>
            </article>
          </section>
        ) : (
          <section
            id="guide-module-panel"
            className="context-guide"
            role="tabpanel"
            aria-labelledby="guide-module-tab context-guide-title"
          >
            <article>
              <p className="eyebrow">{copy.guide.why}</p>
              <h3 id="context-guide-title">{moduleGuide.why}</h3>
            </article>
            <article>
              <p className="eyebrow">{copy.guide.how}</p>
              <ol>
                {moduleGuide.how.map((item) => <li key={item}>{item}</li>)}
              </ol>
            </article>
            <article className="done-when">
              <p className="eyebrow">{copy.guide.doneWhen}</p>
              <strong>{moduleGuide.doneWhen}</strong>
            </article>
          </section>
        )}

        <footer className="guide-footer">
          <div
            className="guide-tabs"
            role="tablist"
            aria-label={copy.guide.eyebrow}
          >
            <button
              id="guide-orientation-tab"
              type="button"
              role="tab"
              aria-selected={mode === "orientation"}
              aria-controls="guide-orientation-panel"
              onClick={() => onModeChange("orientation")}
            >
              {copy.guide.overviewTab}
            </button>
            <button
              id="guide-module-tab"
              type="button"
              role="tab"
              aria-selected={mode === "module"}
              aria-controls="guide-module-panel"
              onClick={() => onModeChange("module")}
            >
              {copy.guide.moduleTab(copy.nav[screen])}
            </button>
          </div>
          <div className="guide-actions">
            {mode === "orientation" && (
              <>
                <button
                  type="button"
                  className="button ghost"
                  onClick={() => setStep((current) => Math.max(0, current - 1))}
                  disabled={step === 0}
                >
                  {copy.guide.previous}
                </button>
                {!isLastStep && (
                  <button
                    type="button"
                    className="button primary"
                    onClick={() => setStep((current) => current + 1)}
                  >
                    {copy.guide.next}
                  </button>
                )}
              </>
            )}
            <button type="button" className="button ghost" onClick={onClose}>
              {copy.guide.skip}
            </button>
            {(mode === "module" || isLastStep) && (
              <button type="button" className="button primary" onClick={finish}>
                {copy.guide.start}
              </button>
            )}
          </div>
        </footer>
      </section>
    </div>
  );
}
