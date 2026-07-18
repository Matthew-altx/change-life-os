"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  calculateProgress,
  calculateStreak,
  completeQuest,
  createInitialState,
  isPiaReady,
  localDate,
  makeId,
  questXp,
  remainingSeconds,
  SKILLS,
  type AppState,
  type ContentItem,
  type ContentStage,
  type Quest,
  type QuestType,
  type Skill,
} from "./domain";
import { exportState, loadState, parseImportedState, saveState } from "./storage";
import { formatDate, getCopy, type Copy, type Locale, type Screen } from "./i18n";
import {
  loadUiPreferences,
  saveUiPreferences,
} from "./uiPreferences";
import { initialRootState, rootReducer } from "./rootState";
import { GuideDialog, type GuideMode } from "./GuideDialog";

const NAV: { id: Screen; mark: string }[] = [
  { id: "today", mark: "01" },
  { id: "vision", mark: "02" },
  { id: "quests", mark: "03" },
  { id: "content", mark: "04" },
  { id: "reset", mark: "05" },
];

const STAGES: ContentStage[] = ["idea", "learn", "teach", "sell"];
const HUMAN: ("mind" | "body" | "spirit" | "vocation")[] = ["mind", "body", "spirit", "vocation"];

const formatTimer = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

function LanguageSwitch({ locale, setLocale, copy }: { locale: Locale; setLocale: (locale: Locale) => void; copy: Copy }) {
  return (
    <div className="language-switch" role="group" aria-label={copy.utility.language}>
      <button type="button" aria-pressed={locale === "zh-HK"} onClick={() => setLocale("zh-HK")}>中</button>
      <span aria-hidden="true">/</span>
      <button type="button" aria-pressed={locale === "en"} onClick={() => setLocale("en")}>EN</button>
    </div>
  );
}

function Onboarding({ onFinish, copy, locale, setLocale }: {
  onFinish: (profile: AppState["profile"]) => void;
  copy: Copy;
  locale: Locale;
  setLocale: (locale: Locale) => void;
}) {
  const [step, setStep] = useState(0);
  const [error, setError] = useState<"required" | "bossRequired" | null>(null);
  const [profile, setProfile] = useState<AppState["profile"]>({
    antiVision: "",
    vision: "",
    niche: "",
    ninetyDayOutcome: "",
    bossFight: "",
    onboarded: false,
  });

  const profileKeys = ["antiVision", "vision", "niche", "ninetyDayOutcome"] as const;
  const steps = copy.onboarding.steps.map((item, index) => ({ ...item, key: profileKeys[index] }));
  const current = steps[step];
  const currentValue = profile[current.key];

  const next = () => {
    if (!currentValue.trim()) {
      setError("required");
      return;
    }
    if (step < steps.length - 1) {
      setError(null);
      setStep(step + 1);
      return;
    }
    if (!profile.bossFight.trim()) {
      setError("bossRequired");
      return;
    }
    onFinish({ ...profile, onboarded: true });
  };

  return (
    <main className="onboarding-shell">
      <div className="onboarding-brand"><span className="brand-orbit">C</span><strong>{copy.brand.name}</strong><small>{copy.brand.product}</small></div>
      <div className="onboarding-utility"><LanguageSwitch locale={locale} setLocale={setLocale} copy={copy} /></div>
      <section className="onboarding-card">
        <div className="step-track" aria-label={copy.onboarding.stepProgress(step + 1, steps.length)}>
          {steps.map((_, index) => <span key={index} className={index <= step ? "active" : ""} />)}
        </div>
        <p className="eyebrow">{current.eyebrow}</p>
        <h1>{current.title}</h1>
        <p className="lead">{current.copy}</p>
        <label className="field-label" htmlFor="onboarding-answer">{copy.onboarding.answer}</label>
        <textarea
          id="onboarding-answer"
          autoFocus
          value={currentValue}
          onChange={(event) => setProfile({ ...profile, [current.key]: event.target.value })}
          placeholder={current.placeholder}
          rows={5}
        />
        {step === 3 && (
          <>
            <label className="field-label" htmlFor="boss-fight">{copy.onboarding.bossLabel}</label>
            <input
              id="boss-fight"
              value={profile.bossFight}
              onChange={(event) => setProfile({ ...profile, bossFight: event.target.value })}
              placeholder={copy.onboarding.bossPlaceholder}
            />
          </>
        )}
        {error && <p className="field-error" role="alert">{copy.onboarding[error]}</p>}
        <div className="onboarding-actions">
          <button className="button ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>{copy.common.back}</button>
          <button className="button primary" onClick={next}>{step === 3 ? copy.onboarding.launch : copy.common.next}<span>→</span></button>
        </div>
      </section>
      <p className="privacy-note">{copy.onboarding.privacy}</p>
    </main>
  );
}

function Shell({ screen, setScreen, children, level, streak, onGuide, copy, locale, setLocale }: {
  screen: Screen;
  setScreen: (screen: Screen) => void;
  children: React.ReactNode;
  level: number;
  streak: number;
  onGuide: () => void;
  copy: Copy;
  locale: Locale;
  setLocale: (locale: Locale) => void;
}) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="logo" onClick={() => setScreen("today")} aria-label={copy.utility.returnToday}>
          <span className="brand-orbit">C</span><span><strong>{copy.brand.name}</strong><small>{copy.brand.product}</small></span>
        </button>
        <nav>
          {NAV.map((item) => (
            <button key={item.id} className={screen === item.id ? "active" : ""} onClick={() => setScreen(item.id)}>
              <span>{item.mark}</span>{copy.nav[item.id]}
            </button>
          ))}
        </nav>
        <div className="top-utility desktop-utility">
          <LanguageSwitch locale={locale} setLocale={setLocale} copy={copy} />
          <button className="guide-link" onClick={onGuide}>？ {copy.utility.guide}</button>
        </div>
        <div className="sidebar-progress">
          <p>{copy.today.levelLabel(level)}</p><strong>{copy.today.streak(streak)}</strong><span>{copy.today.momentumNote}</span>
        </div>
      </aside>
      <div className="main-wrap">{children}</div>
      <div className="top-utility mobile-utility">
        <LanguageSwitch locale={locale} setLocale={setLocale} copy={copy} />
        <button className="guide-fab" onClick={onGuide} aria-label={copy.utility.openGuide}>？</button>
      </div>
      <nav className="mobile-nav">
        {NAV.map((item) => (
          <button key={item.id} className={screen === item.id ? "active" : ""} onClick={() => setScreen(item.id)}>
            <span>{item.mark}</span>{copy.nav[item.id]}
          </button>
        ))}
      </nav>
    </div>
  );
}

function PageHead({ eyebrow, title, copy, action }: { eyebrow: string; title: string; copy: string; action?: React.ReactNode }) {
  return <header className="page-head"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{copy}</p></div>{action}</header>;
}

function Today({ state, update, copy, locale }: { state: AppState; update: (fn: (state: AppState) => AppState) => void; copy: Copy; locale: Locale }) {
  const progress = calculateProgress(state.quests);
  const streak = calculateStreak(state.activeDates);
  const [seconds, setSeconds] = useState(() => remainingSeconds(state.timer));
  const running = state.timer.runningSince !== null && seconds > 0;

  useEffect(() => {
    let cancelled = false;
    window.queueMicrotask(() => {
      if (!cancelled) setSeconds(remainingSeconds(state.timer));
    });
    if (state.timer.runningSince === null) return;
    const interval = window.setInterval(() => {
      const next = remainingSeconds(state.timer);
      setSeconds(next);
      if (next === 0) {
        update((current) => ({ ...current, timer: { ...current.timer, remainingSeconds: 0, runningSince: null } }));
      }
    }, 1000);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, [state.timer, update]);

  const setDuration = (minutes: number) => update((current) => ({
    ...current,
    timer: { durationSeconds: minutes * 60, remainingSeconds: minutes * 60, runningSince: null },
  }));
  const toggleTimer = () => update((current) => {
    if (current.timer.runningSince !== null) {
      return { ...current, timer: { ...current.timer, remainingSeconds: remainingSeconds(current.timer), runningSince: null } };
    }
    if (current.timer.remainingSeconds === 0) {
      return { ...current, timer: { ...current.timer, remainingSeconds: current.timer.durationSeconds, runningSince: Date.now() } };
    }
    return { ...current, timer: { ...current.timer, runningSince: Date.now() } };
  });

  const dateLabel = formatDate(locale);
  const openQuests = state.quests.filter((quest) => !quest.completed).slice(0, 4);
  return (
    <main className="screen">
      <PageHead eyebrow={dateLabel} title={copy.today.title} copy={copy.today.intro} />
      <section className="hero-grid">
        <article className="card level-card">
          <div className="level-ring"><span>{copy.today.levelAbbreviation}</span><strong>{progress.level}</strong></div>
          <div className="level-copy"><p>{copy.today.momentum}</p><h2>{progress.lifetimeXp} XP</h2><div className="progress-bar"><span style={{ width: `${(progress.levelXp / 500) * 100}%` }} /></div><small>{copy.today.xpRemaining(500 - progress.levelXp)}</small></div>
          <div className="streak"><strong>{streak}</strong><span>{copy.today.streakCompact}</span></div>
        </article>
        <article className="card priority-card">
          <div className="card-kicker"><span>{copy.today.priority}</span><small>{copy.today.priorityEyebrow}</small></div>
          <div className="priority-input">
            <button aria-label={copy.today.completePriority} className={state.dailyPriority.completed ? "check checked" : "check"} onClick={() => update((current) => ({ ...current, dailyPriority: { ...current.dailyPriority, completed: !current.dailyPriority.completed }, activeDates: Array.from(new Set([...current.activeDates, localDate()])) }))}>✓</button>
            <input value={state.dailyPriority.text} onChange={(event) => update((current) => ({ ...current, dailyPriority: { date: localDate(), text: event.target.value, completed: false } }))} placeholder={copy.today.priorityPrompt} />
          </div>
        </article>
      </section>

      <section className="section-block">
        <div className="section-title"><div><p className="eyebrow">{copy.today.humanEyebrow}</p><h2>{copy.today.humanTitle}</h2></div><span>{copy.today.humanNote}</span></div>
        <div className="human-grid">
          {HUMAN.map((key) => {
            const score = state.humanScores[key];
            const item = copy.human[key];
            return <article className="card human-card" key={key}><div><small>{item.eyebrow}</small><h3>{item.label}</h3><p>{item.prompt}</p></div><div className="score-row" aria-label={copy.human.scoreLabel(item.label, score)}>{[1,2,3,4,5].map((value) => <button key={value} className={value <= score ? "active" : ""} onClick={() => update((current) => ({ ...current, humanScores: { ...current.humanScores, [key]: value, updatedAt: localDate() } }))}>{value}</button>)}</div></article>;
          })}
        </div>
      </section>

      <section className="work-grid">
        <article className="card timer-card">
          <div className="card-kicker"><span>{copy.today.focus}</span><small>{copy.today.timer.eyebrow}</small></div>
          <div className="timer-presets">{[25,50,90].map((minutes) => <button key={minutes} className={state.timer.durationSeconds === minutes * 60 ? "active" : ""} onClick={() => setDuration(minutes)}>{copy.today.timer.presetLabel(minutes)}</button>)}</div>
          <strong className="timer-display">{formatTimer(seconds)}</strong>
          <p>{running ? copy.today.timer.running : copy.today.timer.idle}</p>
          <div className="timer-actions"><button className="button primary" onClick={toggleTimer}>{running ? copy.today.focusPause : seconds === 0 ? copy.today.focusAgain : copy.today.focusStart}</button><button className="button ghost" onClick={() => setDuration(state.timer.durationSeconds / 60)}>{copy.common.reset}</button></div>
        </article>
        <article className="card quest-preview">
          <div className="card-kicker"><span>{copy.today.nextActions}</span><small>{copy.today.questLogEyebrow}</small></div>
          {openQuests.length === 0 ? <div className="empty"><strong>{copy.today.noQuests}</strong><span>{copy.today.noQuestsNote}</span></div> : openQuests.map((quest) => <div className="mini-quest" key={quest.id}><button className="check" onClick={() => update((current) => ({ ...current, quests: completeQuest(current.quests, quest.id), activeDates: Array.from(new Set([...current.activeDates, localDate()])) }))}>✓</button><div><small>{copy.questTypes[quest.type]} · +{questXp(quest.type)} XP</small><strong>{quest.title}</strong></div></div>)}
        </article>
      </section>
    </main>
  );
}

function Vision({ state, update, copy }: { state: AppState; update: (fn: (state: AppState) => AppState) => void; copy: Copy }) {
  const fields = [
    { key: "antiVision", tone: "dark" },
    { key: "vision", tone: "gold" },
    { key: "niche", tone: "plain" },
    { key: "ninetyDayOutcome", tone: "orange" },
  ] as const;
  return <main className="screen"><PageHead eyebrow={copy.vision.eyebrow} title={copy.vision.title} copy={copy.vision.intro} />
    <section className="vision-grid">{fields.map((field) => { const fieldCopy = copy.vision.fields[field.key]; return <article key={field.key} className={`vision-card ${field.tone}`}><p className="eyebrow">{fieldCopy.eyebrow}</p><h2>{fieldCopy.title}</h2><p>{fieldCopy.prompt}</p><textarea value={state.profile[field.key]} onChange={(event) => update((current) => ({ ...current, profile: { ...current.profile, [field.key]: event.target.value } }))} rows={5} /></article>; })}</section>
    <article className="card boss-banner"><div><p className="eyebrow">{copy.vision.bossEyebrow}</p><h2>{copy.vision.bossTitle}</h2></div><input value={state.profile.bossFight} onChange={(event) => update((current) => ({ ...current, profile: { ...current.profile, bossFight: event.target.value } }))} /></article>
  </main>;
}

function Quests({ state, update, copy }: { state: AppState; update: (fn: (state: AppState) => AppState) => void; copy: Copy }) {
  const [type, setType] = useState<QuestType>("side");
  const [skill, setSkill] = useState<Skill>("writing");
  const [title, setTitle] = useState("");
  const [filter, setFilter] = useState<"all" | QuestType>("all");
  const progress = calculateProgress(state.quests);
  const add = () => {
    if (!title.trim()) return;
    const next: Quest = { id: makeId(), title: title.trim(), type, skill, completed: false, createdAt: localDate() };
    update((current) => ({ ...current, quests: [next, ...current.quests] }));
    setTitle("");
  };
  const filtered = state.quests.filter((quest) => filter === "all" || quest.type === filter);
  return <main className="screen"><PageHead eyebrow={copy.quests.eyebrow} title={copy.quests.title} copy={copy.quests.intro} />
    <section className="quest-layout"><div>
      <article className="card quest-form"><div className="card-kicker"><span>{copy.quests.newQuest}</span><small>{copy.quests.newQuestEyebrow}</small></div><input value={title} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => event.key === "Enter" && add()} placeholder={copy.quests.prompt} /><div className="form-row"><select value={type} onChange={(event) => setType(event.target.value as QuestType)}>{(["side", "main", "boss"] as const).map((item) => <option key={item} value={item}>{copy.quests.typeOption(copy.questTypes[item], questXp(item))}</option>)}</select><select value={skill} onChange={(event) => setSkill(event.target.value as Skill)}>{SKILLS.map((item) => <option key={item} value={item}>{copy.skills[item]}</option>)}</select><button className="button primary" onClick={add}>{copy.quests.add}</button></div></article>
      <div className="filter-row">{(["all","main","side","boss"] as const).map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item === "all" ? copy.common.all : copy.questTypes[item]}</button>)}</div>
      <div className="quest-list">{filtered.map((quest) => <article className={quest.completed ? "card quest-row completed" : "card quest-row"} key={quest.id}><button className={quest.completed ? "check checked" : "check"} onClick={() => update((current) => ({ ...current, quests: completeQuest(current.quests, quest.id), activeDates: Array.from(new Set([...current.activeDates, localDate()])) }))}>✓</button><div><small>{copy.questTypes[quest.type]} · {copy.skills[quest.skill]}</small><strong>{quest.title}</strong></div><span>+{questXp(quest.type)} XP</span><button className="delete" aria-label={copy.quests.deleteQuest} onClick={() => update((current) => ({ ...current, quests: current.quests.filter((item) => item.id !== quest.id) }))}>×</button></article>)}</div>
    </div><aside className="card skill-card"><p className="eyebrow">{copy.quests.skillsEyebrow}</p><h2>{copy.quests.skills}</h2><p>{copy.quests.skillsIntro}</p>{SKILLS.map((item) => { const value = progress.skills[item]; return <div className="skill-row" key={item}><div><span>{copy.skills[item]}</span><small>{value} XP</small></div><div className="progress-bar"><span style={{ width: `${Math.min(100, value / 5)}%` }} /></div></div>; })}</aside></section>
  </main>;
}

function Content({ state, update, copy }: { state: AppState; update: (fn: (state: AppState) => AppState) => void; copy: Copy }) {
  const [title, setTitle] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = state.contentItems.find((item) => item.id === selectedId) ?? null;
  const add = () => {
    if (!title.trim()) return;
    const item: ContentItem = { id: makeId(), title: title.trim(), stage: "idea", pain: "", insight: "", action: "" };
    update((current) => ({ ...current, contentItems: [item, ...current.contentItems] }));
    setSelectedId(item.id); setTitle("");
  };
  const patchItem = (id: string, patch: Partial<ContentItem>) => update((current) => ({ ...current, contentItems: current.contentItems.map((item) => item.id === id ? { ...item, ...patch } : item) }));
  return <main className="screen wide"><PageHead eyebrow={copy.content.eyebrow} title={copy.content.title} copy={copy.content.intro} action={<div className="capture"><input value={title} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => event.key === "Enter" && add()} placeholder={copy.content.capturePrompt}/><button className="button primary" onClick={add}>{copy.content.capture}</button></div>} />
    <section className="flywheel">{STAGES.map((stage, stageIndex) => { const stageCopy = copy.content.stages[stage]; return <div className="stage" key={stage}><header><div><span>0{stageIndex + 1}</span><h2>{stageCopy.label}</h2></div><small>{stageCopy.note}</small></header><div className="stage-items">{state.contentItems.filter((item) => item.stage === stage).map((item) => { const index = STAGES.findIndex((entry) => entry === item.stage); return <article className="content-card" key={item.id}><button className="content-title" onClick={() => setSelectedId(item.id)}>{item.title}</button><span className={isPiaReady(item) ? "pia ready" : "pia"}>{isPiaReady(item) ? copy.content.piaReady : copy.content.piaIncomplete}</span><div className="move-row"><button aria-label={copy.common.back} disabled={index === 0} onClick={() => patchItem(item.id, { stage: STAGES[index - 1] })}>←</button><button onClick={() => setSelectedId(item.id)}>{copy.common.edit}</button><button aria-label={copy.common.next} disabled={index === STAGES.length - 1} onClick={() => patchItem(item.id, { stage: STAGES[index + 1] })}>→</button></div></article>; })}{state.contentItems.every((item) => item.stage !== stage) && <p className="stage-empty">{copy.content.stageEmpty}</p>}</div></div>; })}</section>
    {selected && <section className="card pia-editor"><div className="pia-head"><div><p className="eyebrow">{copy.content.pia.eyebrow}</p><h2>{selected.title}</h2></div><button className="close" aria-label={copy.common.close} onClick={() => setSelectedId(null)}>×</button></div><div className="pia-grid"><label><span>{copy.content.pia.pain.label}</span><small>{copy.content.pia.pain.help}</small><textarea rows={3} value={selected.pain} onChange={(event) => patchItem(selected.id, { pain: event.target.value })}/></label><label><span>{copy.content.pia.insight.label}</span><small>{copy.content.pia.insight.help}</small><textarea rows={3} value={selected.insight} onChange={(event) => patchItem(selected.id, { insight: event.target.value })}/></label><label><span>{copy.content.pia.action.label}</span><small>{copy.content.pia.action.help}</small><textarea rows={3} value={selected.action} onChange={(event) => patchItem(selected.id, { action: event.target.value })}/></label></div></section>}
  </main>;
}

function Reset({ state, update, onImport, onClear, copy }: { state: AppState; update: (fn: (state: AppState) => AppState) => void; onImport: (text: string) => void; onClear: () => void; copy: Copy }) {
  const existing = state.reviews.find((review) => review.date === localDate());
  const [wins, setWins] = useState<[string,string,string]>(existing?.wins ?? ["","",""]);
  const [lessons, setLessons] = useState<[string,string]>(existing?.lessons ?? ["",""]);
  const [intention, setIntention] = useState(existing?.intention ?? "");
  const fileRef = useRef<HTMLInputElement>(null);
  const saveReview = () => update((current) => ({ ...current, reviews: [...current.reviews.filter((review) => review.date !== localDate()), { date: localDate(), wins, lessons, intention }], activeDates: Array.from(new Set([...current.activeDates, localDate()])) }));
  const download = () => {
    const blob = new Blob([exportState(state)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `change-life-os-${localDate()}.json`; anchor.click(); URL.revokeObjectURL(url);
  };
  return <main className="screen"><PageHead eyebrow={copy.resetPage.eyebrow} title={copy.resetPage.title} copy={copy.resetPage.intro} />
    <section className="reset-grid"><article className="card review-card"><p className="eyebrow">{copy.resetPage.review.eyebrow}</p><h2>{copy.resetPage.review.title}</h2><p>{copy.resetPage.review.intro}</p><div className="review-group"><strong>{copy.resetPage.review.wins}</strong>{wins.map((value, index) => <input key={index} value={value} onChange={(event) => { const next = [...wins] as [string,string,string]; next[index] = event.target.value; setWins(next); }} placeholder={copy.resetPage.review.winPlaceholder(index + 1)}/>)}</div><div className="review-group"><strong>{copy.resetPage.review.lessons}</strong>{lessons.map((value, index) => <input key={index} value={value} onChange={(event) => { const next = [...lessons] as [string,string]; next[index] = event.target.value; setLessons(next); }} placeholder={copy.resetPage.review.lessonPlaceholder(index + 1)}/>)}</div><div className="review-group"><strong>{copy.resetPage.review.intention}</strong><input value={intention} onChange={(event) => setIntention(event.target.value)} placeholder={copy.resetPage.review.intentionPlaceholder}/></div><button className="button primary" onClick={saveReview}>{copy.resetPage.review.save}</button></article>
      <div className="reset-stack"><article className="card protocol-card"><p className="eyebrow">{copy.resetPage.protocol.eyebrow}</p><h2>{copy.resetPage.protocol.title}</h2>{copy.resetPage.protocol.steps.map((label, index) => <button key={label} className={state.resetPlan.resetSteps[index] ? "protocol-step done" : "protocol-step"} onClick={() => update((current) => { const steps = [...current.resetPlan.resetSteps]; steps[index] = !steps[index]; return { ...current, resetPlan: { ...current.resetPlan, resetSteps: steps } }; })}><span>{state.resetPlan.resetSteps[index] ? "✓" : index + 1}</span>{label}</button>)}</article>
      <article className="card detox-card"><div className="card-kicker"><span>{copy.resetPage.detox.title}</span><small>{copy.resetPage.detox.eyebrow}</small></div>{state.resetPlan.commitments.map((commitment, index) => <label key={index}><span>{String(index + 1).padStart(2,"0")}</span><input value={commitment} onChange={(event) => update((current) => ({ ...current, resetPlan: { ...current.resetPlan, commitments: current.resetPlan.commitments.map((item, itemIndex) => itemIndex === index ? event.target.value : item) } }))}/></label>)}</article></div>
    </section>
    <section className="card data-card"><div><p className="eyebrow">{copy.resetPage.data.eyebrow}</p><h2>{copy.resetPage.data.title}</h2><p>{copy.resetPage.data.intro}</p></div><div className="data-actions"><button className="button secondary" onClick={download}>{copy.resetPage.export}</button><button className="button ghost" onClick={() => fileRef.current?.click()}>{copy.resetPage.import}</button><input ref={fileRef} hidden type="file" accept="application/json" onChange={async (event) => { const file = event.target.files?.[0]; if (file) onImport(await file.text()); event.target.value = ""; }}/><button className="button danger" onClick={onClear}>{copy.resetPage.clear}</button></div></section>
  </main>;
}

export default function ChangeLifeOS() {
  const [rootState, dispatch] = useReducer(rootReducer, initialRootState);
  const { appState: state, preferences } = rootState;
  const [hydrated, setHydrated] = useState(false);
  const [screen, setScreen] = useState<Screen>("today");
  const [notice, setNotice] = useState<keyof Copy["notices"] | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideMode, setGuideMode] = useState<GuideMode>("orientation");
  const copy = getCopy(preferences.locale);

  useEffect(() => {
    let cancelled = false;
    window.queueMicrotask(() => {
      if (!cancelled) {
        const storedPreferences = loadUiPreferences(window.localStorage);
        dispatch({
          type: "hydrate",
          appState: loadState(window.localStorage),
          preferences: storedPreferences,
        });
        if (!storedPreferences.guideSeen) {
          setGuideMode("orientation");
          setGuideOpen(true);
        }
        setHydrated(true);
      }
    });
    return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    const result = saveState(window.localStorage, state);
    if (!result.ok) window.queueMicrotask(() => setNotice("saveFailed"));
  }, [state, hydrated]);
  useEffect(() => {
    document.documentElement.lang = preferences.locale;
    if (hydrated) saveUiPreferences(window.localStorage, preferences);
  }, [hydrated, preferences]);

  const update = useMemo(() => (fn: (current: AppState) => AppState) => dispatch({ type: "update-app", update: fn }), []);
  const setLocale = (locale: Locale) => dispatch({ type: "set-locale", locale });
  const closeGuide = useCallback(() => {
    dispatch({ type: "set-guide-seen", guideSeen: true });
    setGuideOpen(false);
  }, []);
  const openModuleGuide = useCallback(() => {
    setGuideMode("module");
    setGuideOpen(true);
  }, []);
  const progress = calculateProgress(state.quests);
  const streak = calculateStreak(state.activeDates);

  if (!hydrated) return <div className="boot"><span className="brand-orbit">C</span><p>{copy.boot}</p></div>;
  if (!state.profile.onboarded) return <Onboarding copy={copy} locale={preferences.locale} setLocale={setLocale} onFinish={(profile) => update((current) => ({ ...current, profile, quests: [
    { id: makeId(), title: profile.ninetyDayOutcome, type: "main", skill: "marketing", completed: false, createdAt: localDate() },
    { id: makeId(), title: profile.bossFight, type: "boss", skill: "sales", completed: false, createdAt: localDate() },
  ], activeDates: [localDate()] }))} />;

  const importData = (text: string) => {
    try {
      const imported = parseImportedState(text);
      update(() => imported);
      setNotice("backupRestored");
    }
    catch (error) {
      if (error instanceof Error && error.message === getCopy("zh-HK").notices.invalidFile) setNotice("invalidFile");
      else if (error instanceof Error && error.message === getCopy("zh-HK").notices.unsupportedBackup) setNotice("unsupportedBackup");
      else if (error instanceof Error && error.message === getCopy("zh-HK").notices.incompleteBackup) setNotice("incompleteBackup");
      else setNotice("importFailed");
    }
  };
  const clear = () => {
    if (window.confirm(copy.confirmations.clearAll)) update(() => createInitialState());
  };

  return <Shell screen={screen} setScreen={setScreen} level={progress.level} streak={streak} onGuide={openModuleGuide} copy={copy} locale={preferences.locale} setLocale={setLocale}>
    {notice && <button className="notice" aria-label={copy.common.close} onClick={() => setNotice(null)} role="status">{copy.notices[notice]}<span>×</span></button>}
    {screen === "today" && <Today state={state} update={update} copy={copy} locale={preferences.locale} />}
    {screen === "vision" && <Vision state={state} update={update} copy={copy} />}
    {screen === "quests" && <Quests state={state} update={update} copy={copy} />}
    {screen === "content" && <Content state={state} update={update} copy={copy} />}
    {screen === "reset" && <Reset state={state} update={update} onImport={importData} onClear={clear} copy={copy} />}
    {guideOpen && (
      <GuideDialog
        copy={copy}
        screen={screen}
        mode={guideMode}
        onModeChange={setGuideMode}
        onClose={closeGuide}
        onGoToScreen={setScreen}
      />
    )}
  </Shell>;
}
