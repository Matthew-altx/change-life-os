"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

type Screen = "today" | "vision" | "quests" | "content" | "reset";

const NAV: { id: Screen; label: string; mark: string }[] = [
  { id: "today", label: "今日", mark: "01" },
  { id: "vision", label: "願景", mark: "02" },
  { id: "quests", label: "任務", mark: "03" },
  { id: "content", label: "內容", mark: "04" },
  { id: "reset", label: "重置", mark: "05" },
];

const TYPE_LABEL: Record<QuestType, string> = {
  main: "主線",
  side: "支線",
  boss: "Boss 戰",
};

const SKILL_LABEL: Record<Skill, string> = {
  writing: "寫作",
  speaking: "演講",
  marketing: "行銷",
  sales: "銷售",
};

const STAGES: { id: ContentStage; label: string; note: string }[] = [
  { id: "idea", label: "Idea", note: "捕捉真實問題" },
  { id: "learn", label: "Learn", note: "建立洞察" },
  { id: "teach", label: "Teach", note: "公開教學" },
  { id: "sell", label: "Sell", note: "轉成價值" },
];

const HUMAN = [
  { key: "mind", label: "心智", en: "MIND", prompt: "今日思緒有幾清晰？" },
  { key: "body", label: "身體", en: "BODY", prompt: "今日身體有幾多能量？" },
  { key: "spirit", label: "精神", en: "SPIRIT", prompt: "今日有幾連結到意義？" },
  { key: "vocation", label: "天職", en: "VOCATION", prompt: "今日有幾接近真正工作？" },
] as const;

const GUIDE_STEPS = [
  ["先寫反願景", "講清楚你五年後最唔想見到嘅生活，將模糊焦慮變成可見方向。"],
  ["鎖定 90 日主線", "只揀一個可以驗證嘅結果，再定義一場你一直逃避嘅 Boss 戰。"],
  ["每日唯一優先", "每日先完成最高槓桿行動，再處理低價值工作同外界要求。"],
  ["用任務累積技能", "將行動分類為主線、支線或 Boss 戰，同步提升寫作、演講、行銷、銷售。"],
  ["輸出與復盤", "用 PIA 將經驗變成內容；晚上用 3-2-1 復盤，定期匯出本機備份。"],
] as const;

const formatTimer = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

function Onboarding({ onFinish }: { onFinish: (profile: AppState["profile"]) => void }) {
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<AppState["profile"]>({
    antiVision: "",
    vision: "",
    niche: "",
    ninetyDayOutcome: "",
    bossFight: "",
    onboarded: false,
  });

  const steps = [
    {
      eyebrow: "STEP 01 · 反向願景",
      title: "如果你乜都唔改，五年後會點？",
      copy: "唔需要正能量。先寫清楚你拒絕接受嘅人生，痛苦先會變成方向。",
      key: "antiVision" as const,
      placeholder: "例：我仍然困喺冇成長嘅工作，健康轉差，收入被時間封頂……",
    },
    {
      eyebrow: "STEP 02 · 理想願景",
      title: "你真正想過點樣嘅一日？",
      copy: "唔好由職銜出發。由時間、自由、關係、健康同創造方式出發。",
      key: "vision" as const,
      placeholder: "例：每日只做四小時高價值工作，有時間運動、陪家人同持續創作……",
    },
    {
      eyebrow: "STEP 03 · 你就是利基",
      title: "你解決過咩問題，最想幫邊類人？",
      copy: "你嘅經歷、興趣同已解決難題，交集就係最難被複製嘅定位。",
      key: "niche" as const,
      placeholder: "例：我幫助香港保險團隊，用簡單系統將複雜工作變成可執行流程……",
    },
    {
      eyebrow: "STEP 04 · 90 日主線",
      title: "未來 90 日，只贏一場仗。",
      copy: "結果要可驗證；Boss 戰要係你一直逃避、但一完成就會改變局面嘅行動。",
      key: "ninetyDayOutcome" as const,
      placeholder: "例：推出第一個有人付費使用嘅個人產品",
    },
  ];
  const current = steps[step];
  const currentValue = profile[current.key];

  const next = () => {
    if (!currentValue.trim()) {
      setError("寫低一個真實答案，先可以行下一步。");
      return;
    }
    if (step < steps.length - 1) {
      setError("");
      setStep(step + 1);
      return;
    }
    if (!profile.bossFight.trim()) {
      setError("Boss 戰係今次改變嘅第一個突破口。");
      return;
    }
    onFinish({ ...profile, onboarded: true });
  };

  return (
    <main className="onboarding-shell">
      <div className="onboarding-brand"><span className="brand-orbit">C</span><strong>CHANGE-LIFE</strong><small>PERSONAL OS</small></div>
      <section className="onboarding-card">
        <div className="step-track" aria-label={`第 ${step + 1} 步，共 4 步`}>
          {steps.map((_, index) => <span key={index} className={index <= step ? "active" : ""} />)}
        </div>
        <p className="eyebrow">{current.eyebrow}</p>
        <h1>{current.title}</h1>
        <p className="lead">{current.copy}</p>
        <label className="field-label" htmlFor="onboarding-answer">你嘅答案</label>
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
            <label className="field-label" htmlFor="boss-fight">第一場 Boss 戰</label>
            <input
              id="boss-fight"
              value={profile.bossFight}
              onChange={(event) => setProfile({ ...profile, bossFight: event.target.value })}
              placeholder="例：喺星期五前公開預售頁"
            />
          </>
        )}
        {error && <p className="field-error" role="alert">{error}</p>}
        <div className="onboarding-actions">
          <button className="button ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>返回</button>
          <button className="button primary" onClick={next}>{step === 3 ? "啟動我的 OS" : "下一步"}<span>→</span></button>
        </div>
      </section>
      <p className="privacy-note">資料只會保留喺呢部裝置 · 你隨時可以匯出備份</p>
    </main>
  );
}

function GuideModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="guide-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="guide-modal" role="dialog" aria-modal="true" aria-labelledby="guide-title">
        <header>
          <div><p className="eyebrow">使用指南</p><h2 id="guide-title">五步啟動 Change-Life OS</h2></div>
          <button className="close" onClick={onClose} aria-label="關閉使用指南">×</button>
        </header>
        <div className="guide-list">
          {GUIDE_STEPS.map(([title, copy], index) => (
            <article key={title}><span>{index + 1}</span><div><h3>{title}</h3><p>{copy}</p></div></article>
          ))}
        </div>
        <footer><button className="button primary" onClick={onClose}>明白，開始行動</button></footer>
      </section>
    </div>
  );
}

function Shell({ screen, setScreen, children, level, streak, onGuide }: {
  screen: Screen;
  setScreen: (screen: Screen) => void;
  children: React.ReactNode;
  level: number;
  streak: number;
  onGuide: () => void;
}) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="logo" onClick={() => setScreen("today")} aria-label="返回今日">
          <span className="brand-orbit">C</span><span><strong>CHANGE-LIFE</strong><small>PERSONAL OS</small></span>
        </button>
        <nav>
          {NAV.map((item) => (
            <button key={item.id} className={screen === item.id ? "active" : ""} onClick={() => setScreen(item.id)}>
              <span>{item.mark}</span>{item.label}
            </button>
          ))}
        </nav>
        <button className="guide-link" onClick={onGuide}>？ 使用指南</button>
        <div className="sidebar-progress">
          <p>LEVEL {level}</p><strong>{streak} 日連續行動</strong><span>保持勢能，而唔係追求完美。</span>
        </div>
      </aside>
      <div className="main-wrap">{children}</div>
      <button className="guide-fab" onClick={onGuide} aria-label="打開使用指南">？</button>
      <nav className="mobile-nav">
        {NAV.map((item) => (
          <button key={item.id} className={screen === item.id ? "active" : ""} onClick={() => setScreen(item.id)}>
            <span>{item.mark}</span>{item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function PageHead({ eyebrow, title, copy, action }: { eyebrow: string; title: string; copy: string; action?: React.ReactNode }) {
  return <header className="page-head"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{copy}</p></div>{action}</header>;
}

function Today({ state, update }: { state: AppState; update: (fn: (state: AppState) => AppState) => void }) {
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

  const dateLabel = new Intl.DateTimeFormat("zh-HK", { month: "long", day: "numeric", weekday: "long" }).format(new Date());
  const openQuests = state.quests.filter((quest) => !quest.completed).slice(0, 4);
  return (
    <main className="screen">
      <PageHead eyebrow={dateLabel} title="今日，做少啲。做最重要嗰件事。" copy="專注唔係做更多，而係令雜音冇機會控制你。" />
      <section className="hero-grid">
        <article className="card level-card">
          <div className="level-ring"><span>LV</span><strong>{progress.level}</strong></div>
          <div className="level-copy"><p>你嘅勢能</p><h2>{progress.lifetimeXp} XP</h2><div className="progress-bar"><span style={{ width: `${(progress.levelXp / 500) * 100}%` }} /></div><small>距離下一級仲有 {500 - progress.levelXp} XP</small></div>
          <div className="streak"><strong>{streak}</strong><span>日<br/>連續</span></div>
        </article>
        <article className="card priority-card">
          <div className="card-kicker"><span>今日唯一優先</span><small>PRIORITY</small></div>
          <div className="priority-input">
            <button aria-label="完成今日優先" className={state.dailyPriority.completed ? "check checked" : "check"} onClick={() => update((current) => ({ ...current, dailyPriority: { ...current.dailyPriority, completed: !current.dailyPriority.completed }, activeDates: Array.from(new Set([...current.activeDates, localDate()])) }))}>✓</button>
            <input value={state.dailyPriority.text} onChange={(event) => update((current) => ({ ...current, dailyPriority: { date: localDate(), text: event.target.value, completed: false } }))} placeholder="今日邊一個行動，會令其他事情變得容易？" />
          </div>
        </article>
      </section>

      <section className="section-block">
        <div className="section-title"><div><p className="eyebrow">HUMAN 3.0</p><h2>四維狀態掃描</h2></div><span>唔需要全部滿分，只需要誠實。</span></div>
        <div className="human-grid">
          {HUMAN.map((item) => {
            const score = state.humanScores[item.key];
            return <article className="card human-card" key={item.key}><div><small>{item.en}</small><h3>{item.label}</h3><p>{item.prompt}</p></div><div className="score-row" aria-label={`${item.label} ${score} 分`}>{[1,2,3,4,5].map((value) => <button key={value} className={value <= score ? "active" : ""} onClick={() => update((current) => ({ ...current, humanScores: { ...current.humanScores, [item.key]: value, updatedAt: localDate() } }))}>{value}</button>)}</div></article>;
          })}
        </div>
      </section>

      <section className="work-grid">
        <article className="card timer-card">
          <div className="card-kicker"><span>深度工作</span><small>USE YOUR MIND</small></div>
          <div className="timer-presets">{[25,50,90].map((minutes) => <button key={minutes} className={state.timer.durationSeconds === minutes * 60 ? "active" : ""} onClick={() => setDuration(minutes)}>{minutes}m</button>)}</div>
          <strong className="timer-display">{formatTimer(seconds)}</strong>
          <p>{running ? "而家只需要留喺呢一件事。" : "關閉雜音，為最重要嘅工作留一段完整時間。"}</p>
          <div className="timer-actions"><button className="button primary" onClick={toggleTimer}>{running ? "暫停" : seconds === 0 ? "再來一次" : "開始專注"}</button><button className="button ghost" onClick={() => setDuration(state.timer.durationSeconds / 60)}>重設</button></div>
        </article>
        <article className="card quest-preview">
          <div className="card-kicker"><span>下一步行動</span><small>QUEST LOG</small></div>
          {openQuests.length === 0 ? <div className="empty"><strong>任務清空。</strong><span>保持空間，唔使急住填滿。</span></div> : openQuests.map((quest) => <div className="mini-quest" key={quest.id}><button className="check" onClick={() => update((current) => ({ ...current, quests: completeQuest(current.quests, quest.id), activeDates: Array.from(new Set([...current.activeDates, localDate()])) }))}>✓</button><div><small>{TYPE_LABEL[quest.type]} · +{questXp(quest.type)} XP</small><strong>{quest.title}</strong></div></div>)}
        </article>
      </section>
    </main>
  );
}

function Vision({ state, update }: { state: AppState; update: (fn: (state: AppState) => AppState) => void }) {
  const fields = [
    { key: "antiVision", eyebrow: "ANTI-VISION", title: "我拒絕接受嘅人生", tone: "dark", prompt: "保持現狀五年，代價係咩？" },
    { key: "vision", eyebrow: "VISION", title: "我正在創造嘅生活", tone: "gold", prompt: "理想一日點樣運作？" },
    { key: "niche", eyebrow: "PERSONAL MONOPOLY", title: "我就是利基市場", tone: "plain", prompt: "我嘅經驗可以幫邊類人解決咩問題？" },
    { key: "ninetyDayOutcome", eyebrow: "90-DAY OUTCOME", title: "今季唯一勝利", tone: "orange", prompt: "90 日後，咩結果可以被驗證？" },
  ] as const;
  return <main className="screen"><PageHead eyebrow="NAVIGATION" title="用願景拉動自己，唔係靠意志力推。" copy="反願景製造張力，理想願景提供方向；90 日主線將兩者變成今日行動。" />
    <section className="vision-grid">{fields.map((field) => <article key={field.key} className={`vision-card ${field.tone}`}><p className="eyebrow">{field.eyebrow}</p><h2>{field.title}</h2><p>{field.prompt}</p><textarea value={state.profile[field.key]} onChange={(event) => update((current) => ({ ...current, profile: { ...current.profile, [field.key]: event.target.value } }))} rows={5} /></article>)}</section>
    <article className="card boss-banner"><div><p className="eyebrow">CURRENT BOSS FIGHT</p><h2>而家最需要穿過嘅恐懼</h2></div><input value={state.profile.bossFight} onChange={(event) => update((current) => ({ ...current, profile: { ...current.profile, bossFight: event.target.value } }))} /></article>
  </main>;
}

function Quests({ state, update }: { state: AppState; update: (fn: (state: AppState) => AppState) => void }) {
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
  return <main className="screen"><PageHead eyebrow="EXPERIENCE ENGINE" title="將人生變成一場值得玩嘅遊戲。" copy="任務唔係用嚟填滿時間；每一個任務都要推進身份、能力或者市場價值。" />
    <section className="quest-layout"><div>
      <article className="card quest-form"><div className="card-kicker"><span>建立新任務</span><small>NEW QUEST</small></div><input value={title} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => event.key === "Enter" && add()} placeholder="下一個可以完成嘅行動係咩？" /><div className="form-row"><select value={type} onChange={(event) => setType(event.target.value as QuestType)}><option value="side">支線 · 20 XP</option><option value="main">主線 · 50 XP</option><option value="boss">Boss 戰 · 100 XP</option></select><select value={skill} onChange={(event) => setSkill(event.target.value as Skill)}>{SKILLS.map((item) => <option key={item} value={item}>{SKILL_LABEL[item]}</option>)}</select><button className="button primary" onClick={add}>加入任務</button></div></article>
      <div className="filter-row">{(["all","main","side","boss"] as const).map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item === "all" ? "全部" : TYPE_LABEL[item]}</button>)}</div>
      <div className="quest-list">{filtered.map((quest) => <article className={quest.completed ? "card quest-row completed" : "card quest-row"} key={quest.id}><button className={quest.completed ? "check checked" : "check"} onClick={() => update((current) => ({ ...current, quests: completeQuest(current.quests, quest.id), activeDates: Array.from(new Set([...current.activeDates, localDate()])) }))}>✓</button><div><small>{TYPE_LABEL[quest.type]} · {SKILL_LABEL[quest.skill]}</small><strong>{quest.title}</strong></div><span>+{questXp(quest.type)} XP</span><button className="delete" aria-label="刪除任務" onClick={() => update((current) => ({ ...current, quests: current.quests.filter((item) => item.id !== quest.id) }))}>×</button></article>)}</div>
    </div><aside className="card skill-card"><p className="eyebrow">SKILL STACK</p><h2>四項不朽技能</h2><p>廣度令你有選擇，組合令你難以取代。</p>{SKILLS.map((item) => { const value = progress.skills[item]; return <div className="skill-row" key={item}><div><span>{SKILL_LABEL[item]}</span><small>{value} XP</small></div><div className="progress-bar"><span style={{ width: `${Math.min(100, value / 5)}%` }} /></div></div>; })}</aside></section>
  </main>;
}

function Content({ state, update }: { state: AppState; update: (fn: (state: AppState) => AppState) => void }) {
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
  return <main className="screen wide"><PageHead eyebrow="LEARN · TEACH · SELL" title="學到嘅嘢，要變成公開資產。" copy="由真實問題開始，建立洞察，公開教學，再將價值包裝成可以交換嘅結果。" action={<div className="capture"><input value={title} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => event.key === "Enter" && add()} placeholder="捕捉一個內容點子…"/><button className="button primary" onClick={add}>擷取</button></div>} />
    <section className="flywheel">{STAGES.map((stage, stageIndex) => <div className="stage" key={stage.id}><header><div><span>0{stageIndex + 1}</span><h2>{stage.label}</h2></div><small>{stage.note}</small></header><div className="stage-items">{state.contentItems.filter((item) => item.stage === stage.id).map((item) => { const index = STAGES.findIndex((entry) => entry.id === item.stage); return <article className="content-card" key={item.id}><button className="content-title" onClick={() => setSelectedId(item.id)}>{item.title}</button><span className={isPiaReady(item) ? "pia ready" : "pia"}>{isPiaReady(item) ? "PIA READY" : "PIA 未完整"}</span><div className="move-row"><button disabled={index === 0} onClick={() => patchItem(item.id, { stage: STAGES[index - 1]?.id })}>←</button><button onClick={() => setSelectedId(item.id)}>編輯</button><button disabled={index === STAGES.length - 1} onClick={() => patchItem(item.id, { stage: STAGES[index + 1]?.id })}>→</button></div></article>; })}{state.contentItems.every((item) => item.stage !== stage.id) && <p className="stage-empty">將內容移到呢度</p>}</div></div>)}</section>
    {selected && <section className="card pia-editor"><div className="pia-head"><div><p className="eyebrow">PIA WRITING CHECK</p><h2>{selected.title}</h2></div><button className="close" onClick={() => setSelectedId(null)}>×</button></div><div className="pia-grid"><label><span>P · Pain</span><small>讀者真正感受到嘅痛點</small><textarea rows={3} value={selected.pain} onChange={(event) => patchItem(selected.id, { pain: event.target.value })}/></label><label><span>I · Insight</span><small>你提供嘅新理解</small><textarea rows={3} value={selected.insight} onChange={(event) => patchItem(selected.id, { insight: event.target.value })}/></label><label><span>A · Action</span><small>讀完之後下一步做咩</small><textarea rows={3} value={selected.action} onChange={(event) => patchItem(selected.id, { action: event.target.value })}/></label></div></section>}
  </main>;
}

function Reset({ state, update, onImport, onClear }: { state: AppState; update: (fn: (state: AppState) => AppState) => void; onImport: (text: string) => void; onClear: () => void }) {
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
  const resetLabels = ["離線：關閉通知同資訊輸入", "反思：重讀反願景同理想願景", "決定：揀返唯一 90 日主線", "重啟：寫低明日第一個行動"];
  return <main className="screen"><PageHead eyebrow="SYSTEM RECOVERY" title="迷失唔係失敗，只係系統需要重啟。" copy="停止攝取、重新看清、再揀一次。你唔需要等星期一先重新開始。" />
    <section className="reset-grid"><article className="card review-card"><p className="eyebrow">3 · 2 · 1 EVENING REVIEW</p><h2>今晚清空心智</h2><p>將未完成嘅思緒放低，俾大腦真正休息。</p><div className="review-group"><strong>3 個勝利</strong>{wins.map((value, index) => <input key={index} value={value} onChange={(event) => { const next = [...wins] as [string,string,string]; next[index] = event.target.value; setWins(next); }} placeholder={`${index + 1}. 今日有咩值得保留？`}/>)}</div><div className="review-group"><strong>2 個教訓</strong>{lessons.map((value, index) => <input key={index} value={value} onChange={(event) => { const next = [...lessons] as [string,string]; next[index] = event.target.value; setLessons(next); }} placeholder={`${index + 1}. 今日學到咩？`}/>)}</div><div className="review-group"><strong>1 個明日意圖</strong><input value={intention} onChange={(event) => setIntention(event.target.value)} placeholder="聽日最重要嘅一件事"/></div><button className="button primary" onClick={saveReview}>完成今日復盤</button></article>
      <div className="reset-stack"><article className="card protocol-card"><p className="eyebrow">1-DAY RESET</p><h2>一日人生重置</h2>{resetLabels.map((label, index) => <button key={label} className={state.resetPlan.resetSteps[index] ? "protocol-step done" : "protocol-step"} onClick={() => update((current) => { const steps = [...current.resetPlan.resetSteps]; steps[index] = !steps[index]; return { ...current, resetPlan: { ...current.resetPlan, resetSteps: steps } }; })}><span>{state.resetPlan.resetSteps[index] ? "✓" : index + 1}</span>{label}</button>)}</article>
      <article className="card detox-card"><div className="card-kicker"><span>30 日 Monk Mode</span><small>DOPAMINE DETOX</small></div>{state.resetPlan.commitments.map((commitment, index) => <label key={index}><span>{String(index + 1).padStart(2,"0")}</span><input value={commitment} onChange={(event) => update((current) => ({ ...current, resetPlan: { ...current.resetPlan, commitments: current.resetPlan.commitments.map((item, itemIndex) => itemIndex === index ? event.target.value : item) } }))}/></label>)}</article></div>
    </section>
    <section className="card data-card"><div><p className="eyebrow">YOUR DATA</p><h2>你嘅系統，由你擁有。</h2><p>定期匯出備份。匯入前會先驗證，錯誤檔案唔會覆蓋現有資料。</p></div><div className="data-actions"><button className="button secondary" onClick={download}>匯出備份</button><button className="button ghost" onClick={() => fileRef.current?.click()}>匯入備份</button><input ref={fileRef} hidden type="file" accept="application/json" onChange={async (event) => { const file = event.target.files?.[0]; if (file) onImport(await file.text()); event.target.value = ""; }}/><button className="button danger" onClick={onClear}>清除全部資料</button></div></section>
  </main>;
}

export default function ChangeLifeOS() {
  const [state, setState] = useState<AppState>(() => createInitialState());
  const [hydrated, setHydrated] = useState(false);
  const [screen, setScreen] = useState<Screen>("today");
  const [notice, setNotice] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    window.queueMicrotask(() => {
      if (!cancelled) {
        setState(loadState(window.localStorage));
        setHydrated(true);
      }
    });
    return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    const result = saveState(window.localStorage, state);
    if (!result.ok) window.queueMicrotask(() => setNotice(result.message));
  }, [state, hydrated]);

  const update = useMemo(() => (fn: (current: AppState) => AppState) => setState((current) => fn(current)), []);
  const progress = calculateProgress(state.quests);
  const streak = calculateStreak(state.activeDates);

  if (!hydrated) return <div className="boot"><span className="brand-orbit">C</span><p>正在啟動你嘅 OS…</p></div>;
  if (!state.profile.onboarded) return <Onboarding onFinish={(profile) => setState((current) => ({ ...current, profile, quests: [
    { id: makeId(), title: profile.ninetyDayOutcome, type: "main", skill: "marketing", completed: false, createdAt: localDate() },
    { id: makeId(), title: profile.bossFight, type: "boss", skill: "sales", completed: false, createdAt: localDate() },
  ], activeDates: [localDate()] }))} />;

  const importData = (text: string) => {
    try { setState(parseImportedState(text)); setNotice("備份已成功還原。"); }
    catch (error) { setNotice(error instanceof Error ? error.message : "未能匯入備份。"); }
  };
  const clear = () => {
    if (window.confirm("確定清除全部資料？呢個動作無法復原，建議先匯出備份。")) setState(createInitialState());
  };

  return <Shell screen={screen} setScreen={setScreen} level={progress.level} streak={streak} onGuide={() => setGuideOpen(true)}>
    {notice && <button className="notice" onClick={() => setNotice("")} role="status">{notice}<span>×</span></button>}
    {screen === "today" && <Today state={state} update={update} />}
    {screen === "vision" && <Vision state={state} update={update} />}
    {screen === "quests" && <Quests state={state} update={update} />}
    {screen === "content" && <Content state={state} update={update} />}
    {screen === "reset" && <Reset state={state} update={update} onImport={importData} onClear={clear} />}
    {guideOpen && <GuideModal onClose={() => setGuideOpen(false)} />}
  </Shell>;
}
