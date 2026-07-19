"use client";

import { useMemo, useState } from "react";
import {
  CYCLE_LENGTH_DAYS,
  LIFE_DIMENSIONS,
  completeDailyGrowth,
  isCycleExpired,
  localDate,
  rotateGrowthCycle,
  saveDailyCheckIn,
  suggestLifeDimension,
  type AppState,
  type DimensionScores,
  type GrowthQuestChoice,
  type LifeDimension,
} from "./domain";
import { downloadCompletionCard, createCompletionCardSvg } from "./completionCard";
import { localizeGrowthQuest, pickGrowthQuest } from "./growthQuests";
import type { Copy, Locale } from "./i18n";
import type { GardenThemeId } from "./domain";

const addDays = (value: string, days: number) => {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

function GardenScene({ state, copy, themeOverride }: { state: AppState; copy: Copy; themeOverride?: GardenThemeId | null }) {
  const { garden } = state.growth;
  const totalSeeds = Object.values(garden.growth).reduce((sum, value) => sum + value, 0);
  const firstLight = (themeOverride ?? garden.activeThemeId) === "first-light-garden";
  return (
    <figure className={`life-garden ${firstLight ? "theme-first-light" : "theme-classic"}`} aria-label={copy.growth.gardenLabel}>
      <div className="garden-sky"><span className="garden-sun" /><span className="garden-moon" /><span className="garden-water" /></div>
      <div className="garden-landscape">
        {LIFE_DIMENSIONS.map((dimension, index) => {
          const amount = garden.growth[dimension];
          const scale = Math.min(1.65, .7 + amount * .12);
          return <div className={`garden-zone zone-${dimension}`} key={dimension} style={{ "--growth-scale": scale, "--zone-index": index } as React.CSSProperties}>
            <span className="garden-motif" aria-hidden="true" />
            <strong>{copy.growth.dimensions[dimension].label}</strong>
            <small>{copy.growth.dimensions[dimension].motif} · {amount}</small>
          </div>;
        })}
        <div className={`guardian guardian-stage-${garden.guardianStage}`} role="img" aria-label={copy.growth.guardianLabel(garden.guardianStage)}>
          <span className="guardian-halo" /><span className="guardian-head" /><span className="guardian-body" />
        </div>
      </div>
      <span className="supporter-mark" aria-hidden="true" />
      <figcaption><strong>{totalSeeds}</strong><span>{copy.growth.seeds}</span></figcaption>
    </figure>
  );
}

export function GrowthGarden({
  state,
  update,
  copy,
  locale,
  themeOverride,
}: {
  state: AppState;
  update: (fn: (current: AppState) => AppState) => void;
  copy: Copy;
  locale: Locale;
  themeOverride?: GardenThemeId | null;
}) {
  const today = localDate();
  const scores: DimensionScores = {
    mind: state.humanScores.mind,
    body: state.humanScores.body,
    spirit: state.humanScores.spirit,
    vocation: state.humanScores.vocation,
  };
  const suggested = suggestLifeDimension(scores, state.growth.garden.growth, state.growth.checkIns);
  const todayEntry = state.growth.checkIns.find((entry) => entry.date === today);
  const [selectedOverride, setSelectedOverride] = useState<LifeDimension | null>(todayEntry?.selectedDimension ?? null);
  const [choice, setChoice] = useState<GrowthQuestChoice>(todayEntry?.questChoice ?? "short");
  const [customAction, setCustomAction] = useState(todayEntry?.customAction ?? "");
  const [error, setError] = useState("");

  const selectedDimension = selectedOverride ?? suggested;

  const selectedQuest = useMemo(() => choice === "custom"
    ? null
    : pickGrowthQuest(selectedDimension, choice, today), [choice, selectedDimension, today]);
  const localizedQuest = selectedQuest ? localizeGrowthQuest(selectedQuest, locale) : null;
  const rotated = rotateGrowthCycle(state.growth, today);
  const cycleStartedOn = rotated.cycle.startedOn ?? today;
  const cycleEnd = addDays(cycleStartedOn, CYCLE_LENGTH_DAYS - 1);
  const needsNewCycle = isCycleExpired(state.growth.cycle, today) || state.growth.cycle.status === "completed";
  const completed = todayEntry?.completedAt !== null && todayEntry?.completedAt !== undefined;

  const createEntry = () => ({
    date: today,
    scores,
    suggestedDimension: suggested,
    selectedDimension,
    questChoice: choice,
    questId: selectedQuest?.id ?? null,
    customAction: choice === "custom" ? customAction.trim() : "",
    completedAt: null,
  });

  const save = () => {
    if (choice === "custom" && !customAction.trim()) {
      setError(copy.growth.customRequired);
      return false;
    }
    setError("");
    update((current) => ({
      ...current,
      humanScores: { ...scores, updatedAt: today },
      growth: saveDailyCheckIn(current.growth, createEntry()),
    }));
    return true;
  };

  const complete = () => {
    if (choice === "custom" && !customAction.trim()) {
      setError(copy.growth.customRequired);
      return;
    }
    update((current) => {
      const saved = saveDailyCheckIn(current.growth, createEntry());
      return {
        ...current,
        humanScores: { ...scores, updatedAt: today },
        growth: completeDailyGrowth(saved, today),
        activeDates: Array.from(new Set([...current.activeDates, today])),
      };
    });
    setError("");
  };

  const downloadCard = () => {
    if (!state.growth.cycle.startedOn || !state.growth.cycle.completedOn) return;
    const svg = createCompletionCardSvg({
      startDate: state.growth.cycle.startedOn,
      endDate: state.growth.cycle.completedOn,
      garden: state.growth.garden,
      locale,
    });
    downloadCompletionCard(svg, `change-life-os-7-of-14-${state.growth.cycle.completedOn}.svg`);
  };

  return (
    <section className="growth-section" aria-labelledby="growth-title">
      <header className="growth-head">
        <div><p className="eyebrow">{copy.growth.eyebrow}</p><h2 id="growth-title">{copy.growth.title}</h2><p>{copy.growth.intro}</p></div>
        <div className="cycle-summary"><strong>{copy.growth.cycleProgress(rotated.cycle.completedDates.length)}</strong><span>{copy.growth.cycleWindow(cycleStartedOn, cycleEnd)}</span></div>
      </header>
      {needsNewCycle && !todayEntry && <p className="growth-note">{copy.growth.newCycle}</p>}
      <div className="growth-layout">
        <GardenScene state={state} copy={copy} themeOverride={themeOverride} />
        <article className="card growth-action-card">
          {completed ? (
            <div className="growth-complete"><span aria-hidden="true">✓</span><h3>{copy.growth.completedTitle}</h3><p>{copy.growth.completedBody}</p></div>
          ) : (
            <>
              <div className="suggestion-callout"><small>{copy.growth.suggestion}</small><strong>{copy.growth.dimensions[suggested].label}</strong><span>{copy.growth.suggestionReason}</span></div>
              <fieldset><legend>{copy.growth.chooseDimension}</legend><div className="dimension-picker">{LIFE_DIMENSIONS.map((dimension) => <button type="button" key={dimension} aria-pressed={selectedDimension === dimension} onClick={() => setSelectedOverride(dimension)}><strong>{copy.growth.dimensions[dimension].label}</strong><small>{copy.growth.dimensions[dimension].motif}</small></button>)}</div></fieldset>
              <fieldset><legend>{copy.growth.actionSize}</legend><div className="choice-picker">{(["short", "medium", "custom"] as GrowthQuestChoice[]).map((item) => <button type="button" key={item} aria-pressed={choice === item} onClick={() => setChoice(item)}>{copy.growth[item]}</button>)}</div></fieldset>
              {choice === "custom" ? <textarea rows={3} value={customAction} onChange={(event) => setCustomAction(event.target.value)} placeholder={copy.growth.customPlaceholder} /> : localizedQuest && <div className="quest-suggestion"><strong>{localizedQuest.title}</strong><small>{copy.growth.doneWhen}</small><p>{localizedQuest.doneWhen}</p></div>}
              {error && <p className="field-error" role="alert">{error}</p>}
              <div className="growth-actions"><button className="button ghost" onClick={save}>{copy.growth.saveAction}</button><button className="button primary" onClick={complete}>{copy.growth.completeAction}</button></div>
            </>
          )}
          {state.growth.cycle.status === "completed" && <div className="completion-card-cta"><p>{copy.growth.cardReady}</p><button className="button secondary" onClick={downloadCard}>{copy.growth.downloadCard}</button></div>}
        </article>
      </div>
    </section>
  );
}
