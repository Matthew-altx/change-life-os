# Change-Life OS Bilingual Editorial UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a fully bilingual Cantonese/English Change-Life OS with an Editorial Focus interface and reopenable contextual guidance, while preserving all existing browser data and the public GitHub Pages release path.

**Architecture:** Add a typed central locale module and a separate UI-preference adapter, then pass one immutable copy object through the existing React views. Extract the accessible guide into its own component, keep domain and life-data storage unchanged, and finish with responsive CSS, contract tests, browser acceptance checks and live GitHub Pages verification.

**Tech Stack:** React 19, TypeScript 5.9, Vitest 3, Vite 8, CSS, Node test runner, GitHub Actions and GitHub Pages.

## Global Constraints

- Default locale is exactly `zh-HK`; the only alternative locale is exactly `en`.
- The language control is labelled `中 / EN` and changes product-owned copy in place.
- User-entered profile, priority, quest, content and review strings must remain byte-for-byte unchanged during language switching.
- Existing `changeLifeOS` local-storage data must load without migration or deletion.
- UI preferences use a separate key and do not change the JSON backup contract.
- Primary green is `#143C2D`, action orange is `#DA8134`, deep orange is `#9A3D1A`, white is `#FFFFFF`, and gold is `#D7AE5E`.
- Every primary touch target is at least 44 by 44 CSS pixels; keyboard focus remains visible; normal text and controls meet WCAG AA contrast.
- The public runtime remains the static GitHub Pages application; do not add APIs, credentials, analytics or remote fonts.
- The optional `google-app/` stack is outside this release and must remain unchanged.

---

## File map

- Create `app/i18n.ts` — locale types, typed Cantonese/English copy, dynamic labels and locale date formatting.
- Create `app/i18n.test.ts` — dictionary parity, fallback and formatting tests.
- Create `app/uiPreferences.ts` — isolated language/guide preference parsing and persistence.
- Create `app/uiPreferences.test.ts` — invalid storage and write-failure tests.
- Create `app/GuideDialog.tsx` — first-use and module-context guide, keyboard focus management and responsive dialog markup.
- Modify `app/ChangeLifeOS.tsx` — consume one locale/copy source, add the utility bar, pass module context to the guide and remove inline product copy.
- Modify `app/globals.css` — complete Editorial Focus shell, utility controls, guide stepper and responsive/full-height mobile guide.
- Modify `app/layout.tsx` — bilingual metadata; runtime document language remains controlled by the client.
- Modify `tests/pages-contract.test.mjs` — public-release contract for bilingual copy, guide and preference isolation.
- Modify `README.md` — bilingual capability and contextual guide usage.

---

### Task 1: Typed bilingual copy foundation

**Files:**
- Create: `app/i18n.ts`
- Create: `app/i18n.test.ts`

**Interfaces:**
- Produces: `type Locale = "zh-HK" | "en"`
- Produces: `type Screen = "today" | "vision" | "quests" | "content" | "reset"`
- Produces: `type Copy = typeof COPY["zh-HK"]`
- Produces: `normalizeLocale(value: unknown): Locale`
- Produces: `getCopy(locale: Locale): Copy`
- Produces: `formatDate(locale: Locale, date?: Date): string`

- [ ] **Step 1: Write failing locale tests**

Create `app/i18n.test.ts` with exact behavioural assertions:

```ts
import { describe, expect, it } from "vitest";
import { COPY, formatDate, getCopy, normalizeLocale } from "./i18n";

describe("locale copy", () => {
  it("falls back to Cantonese for unsupported values", () => {
    expect(normalizeLocale("zh-HK")).toBe("zh-HK");
    expect(normalizeLocale("en")).toBe("en");
    expect(normalizeLocale("fr")).toBe("zh-HK");
    expect(normalizeLocale(null)).toBe("zh-HK");
  });

  it("keeps both dictionaries structurally identical", () => {
    expect(Object.keys(COPY.en)).toEqual(Object.keys(COPY["zh-HK"]));
    expect(Object.keys(COPY.en.nav)).toEqual(Object.keys(COPY["zh-HK"].nav));
    expect(Object.keys(COPY.en.guide.modules)).toEqual(
      Object.keys(COPY["zh-HK"].guide.modules),
    );
  });

  it("returns complete language-specific core labels", () => {
    expect(getCopy("zh-HK").nav.today).toBe("今日");
    expect(getCopy("en").nav.today).toBe("Today");
    expect(getCopy("zh-HK").guide.why).toBe("點解做");
    expect(getCopy("en").guide.doneWhen).toBe("Done when");
  });

  it("formats dates using the active locale", () => {
    const date = new Date("2026-07-18T04:00:00.000Z");
    expect(formatDate("zh-HK", date)).toMatch(/7月|七月/);
    expect(formatDate("en", date)).toMatch(/July/);
  });
});
```

- [ ] **Step 2: Run the focused test and confirm the missing module failure**

Run: `npx vitest run --config vitest.config.ts app/i18n.test.ts`

Expected: FAIL because `app/i18n.ts` does not exist.

- [ ] **Step 3: Implement the typed locale module**

Create `app/i18n.ts`. Define one shared shape containing these exact top-level groups so all product copy has an owned destination:

```ts
export type Locale = "zh-HK" | "en";
export type Screen = "today" | "vision" | "quests" | "content" | "reset";

const zhHK = {
  localeName: "中文",
  nav: { today: "今日", vision: "願景", quests: "任務", content: "內容", reset: "重置" },
  utility: { language: "語言", guide: "使用指南", openGuide: "打開使用指南" },
  common: {
    back: "返回", next: "下一步", close: "關閉", edit: "編輯", all: "全部",
    reset: "重設", delete: "刪除", complete: "完成", level: "等級",
  },
  boot: "正在啟動你嘅 OS…",
  onboarding: {
    answer: "你嘅答案", bossLabel: "第一場 Boss 戰", launch: "啟動我的 OS",
    required: "寫低一個真實答案，先可以行下一步。",
    bossRequired: "Boss 戰係今次改變嘅第一個突破口。",
    privacy: "資料只會保留喺呢部裝置 · 你隨時可以匯出備份",
  },
  today: {
    title: "今日，做少啲。做最重要嗰件事。",
    intro: "專注唔係做更多，而係令雜音冇機會控制你。",
    priority: "今日唯一優先", priorityPrompt: "今日邊一個行動，會令其他事情變得容易？",
    humanTitle: "四維狀態掃描", humanNote: "唔需要全部滿分，只需要誠實。",
    focus: "深度工作", focusStart: "開始專注", focusPause: "暫停", focusAgain: "再來一次",
    nextActions: "下一步行動", noQuests: "任務清空。", noQuestsNote: "保持空間，唔使急住填滿。",
  },
  vision: { title: "用願景拉動自己，唔係靠意志力推。", bossTitle: "而家最需要穿過嘅恐懼" },
  quests: { title: "將人生變成一場值得玩嘅遊戲。", newQuest: "建立新任務", add: "加入任務", skills: "四項不朽技能" },
  content: { title: "學到嘅嘢，要變成公開資產。", capture: "擷取", capturePrompt: "捕捉一個內容點子…", piaIncomplete: "PIA 未完整", stageEmpty: "將內容移到呢度" },
  resetPage: { title: "迷失唔係失敗，只係系統需要重啟。", review: "今晚清空心智", saveReview: "完成今日復盤", export: "匯出備份", import: "匯入備份", clear: "清除全部資料" },
  questTypes: { main: "主線", side: "支線", boss: "Boss 戰" },
  skills: { writing: "寫作", speaking: "演講", marketing: "行銷", sales: "銷售" },
  guide: {
    eyebrow: "使用指南", title: "五步啟動 Change-Life OS", why: "點解做", how: "點做",
    doneWhen: "完成標準", previous: "上一步", next: "下一步", start: "開始行動",
    orientation: [
      { title: "先寫反願景", body: "講清楚你五年後最唔想見到嘅生活，將模糊焦慮變成可見方向。" },
      { title: "鎖定 90 日主線", body: "只揀一個可以驗證嘅結果，再定義一場你一直逃避嘅 Boss 戰。" },
      { title: "每日唯一優先", body: "每日先完成最高槓桿行動，再處理低價值工作同外界要求。" },
      { title: "用任務累積技能", body: "將行動分類為主線、支線或 Boss 戰，同步提升寫作、演講、行銷、銷售。" },
      { title: "輸出與復盤", body: "用 PIA 將經驗變成內容；晚上用 3-2-1 復盤，定期匯出本機備份。" },
    ],
    modules: {
      today: { why: "阻止雜音接管注意力。", how: ["評估四維狀態。", "寫下一個唯一優先。", "開始一段深度工作。"], doneWhen: "今日最高槓桿行動已完成。" },
      vision: { why: "用清晰張力取代短暫意志力。", how: ["重讀反願景。", "更新理想生活。", "鎖定一個 90 日結果。"], doneWhen: "你可以用一句話講清楚今季唯一勝利。" },
      quests: { why: "將恐懼同抽象目標變成可完成行動。", how: ["選擇任務類型。", "連結一項技能。", "完成後記錄 XP。"], doneWhen: "每項進行中任務都有明確下一步。" },
      content: { why: "將私人經驗變成可累積嘅公眾資產。", how: ["捕捉真實問題。", "推進 Learn、Teach、Sell。", "補齊 Pain、Insight、Action。"], doneWhen: "至少一項內容達到 PIA Ready。" },
      reset: { why: "喺混亂擴大之前重新取得方向。", how: ["完成 3-2-1 復盤。", "逐步執行一日重置。", "匯出資料備份。"], doneWhen: "你已寫低聽日第一個行動。" },
    },
  },
} as const;

type Localized<T> = T extends string
  ? string
  : T extends readonly (infer Item)[]
    ? readonly Localized<Item>[]
    : T extends Record<string, unknown>
      ? { readonly [Key in keyof T]: Localized<T[Key]> }
      : T;

const en: Localized<typeof zhHK> = {
  localeName: "English",
  nav: { today: "Today", vision: "Vision", quests: "Quests", content: "Content", reset: "Reset" },
  utility: { language: "Language", guide: "Guide", openGuide: "Open usage guide" },
  common: {
    back: "Back", next: "Next", close: "Close", edit: "Edit", all: "All",
    reset: "Reset", delete: "Delete", complete: "Complete", level: "Level",
  },
  boot: "Starting your OS…",
  onboarding: {
    answer: "Your answer", bossLabel: "Your first Boss Fight", launch: "Start my OS",
    required: "Write one honest answer before moving on.",
    bossRequired: "Your Boss Fight is the first breakthrough in this change.",
    privacy: "Your data stays on this device · Export a backup whenever you want",
  },
  today: {
    title: "Do less today. Do what matters most.",
    intro: "Focus is not doing more. It is giving noise no chance to control you.",
    priority: "Your one priority", priorityPrompt: "Which action would make everything else easier today?",
    humanTitle: "Four-dimension check-in", humanNote: "You do not need perfect scores. You need honesty.",
    focus: "Deep work", focusStart: "Start focus", focusPause: "Pause", focusAgain: "Go again",
    nextActions: "Next actions", noQuests: "Quest log clear.", noQuestsNote: "Keep the space. You do not need to fill it.",
  },
  vision: { title: "Let vision pull you instead of forcing willpower.", bossTitle: "The fear you need to move through now" },
  quests: { title: "Turn life into a game worth playing.", newQuest: "Create a quest", add: "Add quest", skills: "Four timeless skills" },
  content: { title: "Turn what you learn into a public asset.", capture: "Capture", capturePrompt: "Capture a content idea…", piaIncomplete: "PIA incomplete", stageEmpty: "Move content here" },
  resetPage: { title: "Being lost is not failure. Your system needs a reset.", review: "Empty your mind tonight", saveReview: "Complete today's review", export: "Export backup", import: "Import backup", clear: "Clear all data" },
  questTypes: { main: "Main", side: "Side", boss: "Boss Fight" },
  skills: { writing: "Writing", speaking: "Speaking", marketing: "Marketing", sales: "Sales" },
  guide: {
    eyebrow: "Usage guide", title: "Start Change-Life OS in five steps", why: "Why", how: "How",
    doneWhen: "Done when", previous: "Previous", next: "Next", start: "Start acting",
    orientation: [
      { title: "Write your anti-vision", body: "Describe the life you refuse to accept five years from now and turn vague anxiety into direction." },
      { title: "Lock a 90-day quest", body: "Choose one verifiable outcome and define the Boss Fight you keep avoiding." },
      { title: "Choose one daily priority", body: "Finish the highest-leverage action before low-value work and outside demands." },
      { title: "Stack skills through quests", body: "Classify action as a Main, Side or Boss quest while building Writing, Speaking, Marketing and Sales." },
      { title: "Publish and review", body: "Use PIA to turn experience into content, then close the day with a 3-2-1 review and regular backup." },
    ],
    modules: {
      today: { why: "Stop noise from taking over your attention.", how: ["Rate the four dimensions.", "Write one priority.", "Start a deep-work block."], doneWhen: "Your highest-leverage action for today is complete." },
      vision: { why: "Replace temporary willpower with clear tension.", how: ["Read your anti-vision.", "Update your ideal life.", "Lock one 90-day outcome."], doneWhen: "You can state this season's one win in a single sentence." },
      quests: { why: "Turn fear and abstract goals into finishable action.", how: ["Choose a quest type.", "Link one skill.", "Record XP when complete."], doneWhen: "Every active quest has a clear next action." },
      content: { why: "Turn private experience into a compounding public asset.", how: ["Capture a real problem.", "Move through Learn, Teach and Sell.", "Complete Pain, Insight and Action."], doneWhen: "At least one content item is PIA Ready." },
      reset: { why: "Recover direction before disorder expands.", how: ["Complete the 3-2-1 review.", "Work through the one-day reset.", "Export a data backup."], doneWhen: "You have written tomorrow's first action." },
    },
  },
};

export type Copy = Localized<typeof zhHK>;
export const COPY = { "zh-HK": zhHK, en } satisfies Record<Locale, Copy>;

export const normalizeLocale = (value: unknown): Locale => value === "en" ? "en" : "zh-HK";
export const getCopy = (locale: Locale): Copy => COPY[locale];
export const formatDate = (locale: Locale, date = new Date()): string =>
  new Intl.DateTimeFormat(locale, { month: "long", day: "numeric", weekday: "long" }).format(date);
```

Before replacing inline use in Task 3, extend both locale objects in this same file with these named groups: `onboarding.steps`, `human`, `vision.fields`, `today.timer`, `content.stages`, `content.pia`, `resetPage.review`, `resetPage.protocol`, `resetPage.detox`, `notices`, and `confirmations`. Copy the existing Cantonese strings exactly from `app/ChangeLifeOS.tsx`; use natural English action copy, keep product terms `HUMAN 3.0`, `Boss Fight`, `XP`, `PIA`, `Learn`, `Teach`, `Sell` and `Monk Mode` unchanged, and type the English object as `Localized<typeof zhHK>` so any absent property fails the production build.

- [ ] **Step 4: Run the locale tests and type-check through the production build**

Run: `npx vitest run --config vitest.config.ts app/i18n.test.ts && npm run build:pages`

Expected: locale tests PASS and Vite produces `dist-pages/` without TypeScript errors.

- [ ] **Step 5: Commit the locale foundation**

```bash
git add app/i18n.ts app/i18n.test.ts
git commit -m "feat: add typed bilingual interface copy"
```

---

### Task 2: Isolated UI preference persistence

**Files:**
- Create: `app/uiPreferences.ts`
- Create: `app/uiPreferences.test.ts`

**Interfaces:**
- Consumes: `Locale`, `normalizeLocale` from `app/i18n.ts`
- Produces: `UI_PREFERENCES_KEY = "changeLifeOSUi"`
- Produces: `UiPreferences = { locale: Locale; guideSeen: boolean }`
- Produces: `loadUiPreferences(storage): UiPreferences`
- Produces: `saveUiPreferences(storage, preferences): boolean`

- [ ] **Step 1: Write failing preference tests**

```ts
import { describe, expect, it } from "vitest";
import {
  UI_PREFERENCES_KEY,
  loadUiPreferences,
  saveUiPreferences,
} from "./uiPreferences";

describe("UI preferences", () => {
  it("defaults to Cantonese and an unseen guide", () => {
    expect(loadUiPreferences({ getItem: () => null })).toEqual({
      locale: "zh-HK",
      guideSeen: false,
    });
  });

  it("restores only supported values", () => {
    const storage = { getItem: () => JSON.stringify({ locale: "en", guideSeen: true }) };
    expect(loadUiPreferences(storage)).toEqual({ locale: "en", guideSeen: true });

    const invalid = { getItem: () => JSON.stringify({ locale: "fr", guideSeen: "yes" }) };
    expect(loadUiPreferences(invalid)).toEqual({ locale: "zh-HK", guideSeen: false });
  });

  it("survives read and write failures", () => {
    expect(loadUiPreferences({ getItem: () => { throw new Error("blocked"); } })).toEqual({
      locale: "zh-HK",
      guideSeen: false,
    });
    expect(saveUiPreferences({ setItem: () => { throw new Error("full"); } }, {
      locale: "en",
      guideSeen: true,
    })).toBe(false);
  });

  it("writes only the dedicated UI key", () => {
    let key = "";
    let value = "";
    expect(saveUiPreferences({ setItem: (nextKey, nextValue) => { key = nextKey; value = nextValue; } }, {
      locale: "en",
      guideSeen: true,
    })).toBe(true);
    expect(key).toBe(UI_PREFERENCES_KEY);
    expect(JSON.parse(value)).toEqual({ locale: "en", guideSeen: true });
  });
});
```

- [ ] **Step 2: Run the test and confirm the missing module failure**

Run: `npx vitest run --config vitest.config.ts app/uiPreferences.test.ts`

Expected: FAIL because `app/uiPreferences.ts` does not exist.

- [ ] **Step 3: Implement preference parsing and safe persistence**

```ts
import { normalizeLocale, type Locale } from "./i18n";

export const UI_PREFERENCES_KEY = "changeLifeOSUi";

export type UiPreferences = {
  locale: Locale;
  guideSeen: boolean;
};

const defaults = (): UiPreferences => ({ locale: "zh-HK", guideSeen: false });

export const loadUiPreferences = (
  storage: Pick<Storage, "getItem">,
): UiPreferences => {
  try {
    const raw = storage.getItem(UI_PREFERENCES_KEY);
    if (!raw) return defaults();
    const value = JSON.parse(raw) as Record<string, unknown>;
    return {
      locale: normalizeLocale(value.locale),
      guideSeen: value.guideSeen === true,
    };
  } catch {
    return defaults();
  }
};

export const saveUiPreferences = (
  storage: Pick<Storage, "setItem">,
  preferences: UiPreferences,
): boolean => {
  try {
    storage.setItem(UI_PREFERENCES_KEY, JSON.stringify(preferences));
    return true;
  } catch {
    return false;
  }
};
```

- [ ] **Step 4: Run focused and existing storage tests**

Run: `npx vitest run --config vitest.config.ts app/uiPreferences.test.ts app/storage.test.ts`

Expected: both test files PASS; `app/storage.ts` remains unchanged.

- [ ] **Step 5: Commit preference isolation**

```bash
git add app/uiPreferences.ts app/uiPreferences.test.ts
git commit -m "feat: persist bilingual UI preferences"
```

---

### Task 3: Apply bilingual copy and Editorial Focus shell

**Files:**
- Modify: `app/ChangeLifeOS.tsx`
- Modify: `app/layout.tsx`
- Modify: `tests/pages-contract.test.mjs`

**Interfaces:**
- Consumes: `Copy`, `Locale`, `Screen`, `formatDate`, `getCopy` from `app/i18n.ts`
- Consumes: `UiPreferences`, `loadUiPreferences`, `saveUiPreferences` from `app/uiPreferences.ts`
- Produces: one `locale` state used by every product-owned string and `document.documentElement.lang`
- Produces: desktop/mobile utility controls with `aria-pressed` language buttons

- [ ] **Step 1: Strengthen the public-page contract before refactoring**

Add these imports and assertions to `tests/pages-contract.test.mjs`:

```js
const i18n = fs.readFileSync("app/i18n.ts", "utf8");
const preferences = fs.readFileSync("app/uiPreferences.ts", "utf8");

test("public version ships a Cantonese-first bilingual interface", () => {
  assert.match(i18n, /"zh-HK"/);
  assert.match(i18n, /\ben\b/);
  assert.match(i18n, /Turn life into a game worth playing/);
  assert.match(app, /document\.documentElement\.lang/);
  assert.match(app, /aria-pressed/);
});

test("UI preferences stay separate from life data", () => {
  assert.match(preferences, /changeLifeOSUi/);
  assert.doesNotMatch(preferences, /changeLifeOS(?:"|')/);
  assert.match(storage, /STORAGE_KEY = "changeLifeOS"/);
});
```

- [ ] **Step 2: Run the contract test and confirm the app integration failure**

Run: `node --test tests/pages-contract.test.mjs`

Expected: FAIL because `ChangeLifeOS.tsx` does not yet update the document language or expose `aria-pressed` language controls.

- [ ] **Step 3: Wire locale state into the application root**

In `ChangeLifeOS`, initialise preferences before the app becomes interactive, derive `copy`, update the HTML language, and persist UI preferences independently:

```tsx
const [preferences, setPreferences] = useState<UiPreferences>({
  locale: "zh-HK",
  guideSeen: false,
});
const copy = getCopy(preferences.locale);

useEffect(() => {
  let cancelled = false;
  window.queueMicrotask(() => {
    if (cancelled) return;
    setState(loadState(window.localStorage));
    setPreferences(loadUiPreferences(window.localStorage));
    setHydrated(true);
  });
  return () => { cancelled = true; };
}, []);

useEffect(() => {
  document.documentElement.lang = preferences.locale;
  if (hydrated) saveUiPreferences(window.localStorage, preferences);
}, [hydrated, preferences]);

const setLocale = (locale: Locale) =>
  setPreferences((current) => ({ ...current, locale }));
```

Pass `copy` into `Onboarding`, `Shell`, `Today`, `Vision`, `Quests`, `Content` and `Reset`. Replace every product-owned inline string with a typed property or dynamic helper from `app/i18n.ts`; keep `quest.title`, `content.title`, profile values, priority text and review values untouched.

- [ ] **Step 4: Add the desktop and mobile language controls**

Extend `Shell` with `locale`, `setLocale` and `copy`. Render this exact semantic control in the top utility bar and reuse it in the mobile utility group:

```tsx
<div className="language-switch" role="group" aria-label={copy.utility.language}>
  <button
    type="button"
    aria-pressed={locale === "zh-HK"}
    onClick={() => setLocale("zh-HK")}
  >
    中
  </button>
  <span aria-hidden="true">/</span>
  <button
    type="button"
    aria-pressed={locale === "en"}
    onClick={() => setLocale("en")}
  >
    EN
  </button>
</div>
```

Build navigation labels from `copy.nav[item.id]`, format Today with `formatDate(locale)`, and use the active locale in score `aria-label` values. Keep navigation IDs and state transitions unchanged.

- [ ] **Step 5: Make page metadata honestly bilingual**

Change `app/layout.tsx` metadata to:

```ts
export const metadata: Metadata = {
  title: "Change-Life OS｜人生管理作業系統 · Personal Operating System",
  description: "以反願景、90 日主線、深度工作與內容飛輪，建立你的一人公司。Build focus, leverage and a one-person business.",
};
```

Keep the server-rendered `<html lang="zh-HK">` fallback; the client updates it only after saved preferences load.

- [ ] **Step 6: Run contract, unit and production-build checks**

Run: `npm run test:pages && npx vitest run --config vitest.config.ts`

Expected: Pages contract PASS, all Vitest files PASS, and `dist-pages/` builds without missing translation keys.

- [ ] **Step 7: Commit the bilingual application shell**

```bash
git add app/ChangeLifeOS.tsx app/layout.tsx tests/pages-contract.test.mjs
git commit -m "feat: apply bilingual editorial application shell"
```

---

### Task 4: Accessible contextual guide

**Files:**
- Create: `app/GuideDialog.tsx`
- Modify: `app/ChangeLifeOS.tsx`
- Modify: `tests/pages-contract.test.mjs`

**Interfaces:**
- Consumes: `Copy`, `Screen` from `app/i18n.ts`
- Produces: `GuideDialog({ copy, screen, mode, onModeChange, onClose, onGoToScreen })`
- Produces: `GuideMode = "orientation" | "module"`

- [ ] **Step 1: Add guide accessibility checks to the release contract**

Read `app/GuideDialog.tsx` in `tests/pages-contract.test.mjs` and add:

```js
const guide = fs.readFileSync("app/GuideDialog.tsx", "utf8");

test("contextual guide is keyboard accessible and reopenable", () => {
  assert.match(guide, /role="dialog"/);
  assert.match(guide, /aria-modal="true"/);
  assert.match(guide, /event\.key === "Escape"/);
  assert.match(guide, /focus\(\)/);
  assert.match(guide, /copy\.guide\.modules\[screen\]/);
  assert.match(app, /setGuideOpen\(true\)/);
});
```

- [ ] **Step 2: Run the contract and confirm the missing component failure**

Run: `node --test tests/pages-contract.test.mjs`

Expected: FAIL because `app/GuideDialog.tsx` does not exist.

- [ ] **Step 3: Implement dialog focus, Escape and module content**

Create `GuideDialog.tsx` with refs for the dialog, close button and previously focused element. On mount, remember `document.activeElement`, focus the close button, listen for Escape and constrain Tab/Shift+Tab to focusable dialog controls. On cleanup, remove the listener and restore focus.

Render the orientation as a five-step stepper with local `step` state. Render the current module using this exact content contract:

```tsx
const moduleGuide = copy.guide.modules[screen];

<section className="context-guide" aria-labelledby="context-guide-title">
  <article>
    <p className="eyebrow">{copy.guide.why}</p>
    <h3 id="context-guide-title">{moduleGuide.why}</h3>
  </article>
  <article>
    <p className="eyebrow">{copy.guide.how}</p>
    <ol>{moduleGuide.how.map((item) => <li key={item}>{item}</li>)}</ol>
  </article>
  <article className="done-when">
    <p className="eyebrow">{copy.guide.doneWhen}</p>
    <strong>{moduleGuide.doneWhen}</strong>
  </article>
</section>
```

The dialog footer includes orientation/module tabs, previous/next controls when relevant and a primary action that calls `onGoToScreen(screen)` before closing. Use translated `aria-label` values and no hard-coded Cantonese inside this component.

- [ ] **Step 4: Integrate first-use and reopenable behaviour**

Replace the old inline `GuideModal`. Open orientation automatically only when `preferences.guideSeen` is false after hydration. Close or complete it with:

```tsx
const closeGuide = () => {
  setGuideOpen(false);
  setPreferences((current) => ({ ...current, guideSeen: true }));
};
```

The persistent desktop and mobile guide controls always set `guideMode` to `"module"` and reopen the guide for the active screen. Add a separate “five-step overview” tab inside the dialog so orientation remains reachable after completion.

- [ ] **Step 5: Run focused release checks**

Run: `node --test tests/pages-contract.test.mjs && npm run build:pages`

Expected: contract PASS and production build PASS.

- [ ] **Step 6: Commit the contextual guide**

```bash
git add app/GuideDialog.tsx app/ChangeLifeOS.tsx tests/pages-contract.test.mjs
git commit -m "feat: add contextual bilingual usage guide"
```

---

### Task 5: Complete the Editorial Focus responsive UI

**Files:**
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: existing class names plus `.top-utility`, `.language-switch`, `.guide-tabs`, `.guide-progress`, `.context-guide`, `.done-when`
- Produces: desktop editorial shell, tablet layout and mobile full-height guide without changing React behaviour

- [ ] **Step 1: Record visual acceptance conditions before CSS changes**

Capture local screenshots at 1440×1000 and 390×844. Confirm the starting defects against the approved design: no visible language utility group, dense card rhythm, mobile guide not full height and no contextual guide layout.

Run: `npm run dev:pages -- --host 127.0.0.1`

Expected: local Vite URL responds and both baseline screenshots show the pre-redesign layout.

- [ ] **Step 2: Apply editorial tokens and application shell rules**

Preserve the required brand values and introduce consistent typography/spacing tokens:

```css
:root {
  --green: #143C2D;
  --orange: #DA8134;
  --deep-orange: #9A3D1A;
  --white: #FFFFFF;
  --gold: #D7AE5E;
  --canvas: #F5F1E8;
  --paper: #FFFDF8;
  --ink: #17241E;
  --muted: #63736B;
  --line: rgba(20, 60, 45, .14);
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
}

:focus-visible {
  outline: 3px solid var(--orange);
  outline-offset: 3px;
}

.top-utility {
  min-height: 64px;
  padding: 0 clamp(28px, 5vw, 72px);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  border-bottom: 1px solid var(--line);
}

.language-switch {
  min-height: 44px;
  padding: 4px 8px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--paper);
}

.language-switch button {
  min-width: 44px;
  min-height: 36px;
  border: 0;
  border-radius: 999px;
  color: var(--muted);
  background: transparent;
  font-weight: 800;
}

.language-switch button[aria-pressed="true"] {
  color: var(--white);
  background: var(--green);
}
```

Adjust `.screen`, `.page-head`, `.card`, `.section-block`, form fields and grids to use the spacing scale, warm paper surfaces, stronger editorial headings and less simultaneous colour. Keep orange for action and gold for XP/progress only.

- [ ] **Step 3: Style the contextual guide and mobile sheet**

```css
.guide-tabs {
  margin-top: 20px;
  display: flex;
  gap: 8px;
}

.guide-tabs button {
  min-height: 44px;
  padding: 0 16px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: transparent;
}

.guide-tabs button[aria-pressed="true"] {
  color: var(--white);
  border-color: var(--green);
  background: var(--green);
}

.context-guide {
  margin-top: 24px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.context-guide article {
  padding: 20px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--white);
}

.context-guide .done-when {
  grid-column: 1 / -1;
  color: var(--white);
  background: var(--green);
}

@media (max-width: 780px) {
  .top-utility { padding: 8px 72px 8px 16px; justify-content: flex-start; }
  .guide-backdrop { padding: 0; align-items: end; }
  .guide-modal {
    width: 100%;
    height: 100dvh;
    max-height: none;
    border: 0;
    border-radius: 0;
  }
  .context-guide { grid-template-columns: 1fr; }
  .context-guide .done-when { grid-column: auto; }
}
```

Verify all buttons touched by the redesign have a 44-pixel interactive box, English labels wrap, bottom navigation does not cover content and reduced-motion rules remain intact.

- [ ] **Step 4: Run production checks and inspect responsive output**

Run: `npm run lint && npm run test:pages`

Expected: ESLint exits zero, Pages contract passes and `dist-pages/` builds.

Capture new screenshots at 1440×1000, 1024×768 and 390×844. Expected: warm editorial hierarchy, visible language/guide utilities, no horizontal page overflow, readable English, full-height mobile guide and unobstructed bottom navigation.

- [ ] **Step 5: Commit the visual redesign**

```bash
git add app/globals.css
git commit -m "style: refine editorial responsive interface"
```

---

### Task 6: Documentation and full regression

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: final user-visible behaviour from Tasks 1–5
- Produces: accurate open-source setup and usage documentation

- [ ] **Step 1: Update README capability and usage copy**

Change the opening description to state that the app is Cantonese-first and fully switchable to English. Update the feature list with:

```markdown
- 完整繁體中文／英文介面，右上角「中 / EN」一鍵切換並記住選擇。
- 五步首次導覽，以及每個模組嘅「點解做／點做／完成標準」情境指南。
```

Update the usage section to explain that product labels change language but user-entered data stays exactly as written. Keep the existing local-only privacy explanation and GitHub Pages URL unchanged.

- [ ] **Step 2: Run every relevant automated check**

Run:

```bash
npm test
npm run test:google
npm run test:pages
npm run lint
```

Expected: all Vitest and Node tests PASS, both production builds succeed, Google-stack regression tests remain unchanged and ESLint exits zero.

- [ ] **Step 3: Perform local browser acceptance**

Start the server with `npm run dev:pages -- --host 127.0.0.1 --port 4173` and verify all nine approved acceptance cases at `http://127.0.0.1:4173/`:

1. Clean storage shows Cantonese and the five-step guide.
2. Guide can be skipped, reopened and switched between overview and active-module guidance.
3. English covers all five destinations, onboarding, controls, empty states, validation, confirmation and notices.
4. Reload restores English.
5. Mixed Chinese/English user content is unchanged across switches.
6. Desktop, tablet and mobile have no clipping or navigation overlap.
7. Keyboard opens/closes the guide, Escape works and focus returns to the trigger.
8. A saved pre-release `changeLifeOS` fixture loads with profile, quests and reviews intact.
9. JSON export/import still round-trips state and invalid JSON leaves current data untouched.

- [ ] **Step 4: Commit documentation and any test-only corrections**

```bash
git add README.md tests/pages-contract.test.mjs
git commit -m "docs: explain bilingual guide workflow"
```

---

### Task 7: Push, deploy and verify GitHub Pages

**Files:**
- Verify: `.github/workflows/pages.yml`
- Verify: `vite.pages.config.ts`
- Verify: public URL `https://matthew-altx.github.io/change-life-os/`

**Interfaces:**
- Consumes: green `main` branch and existing GitHub Pages workflow
- Produces: public bilingual Editorial Focus release with a recorded successful workflow run

- [ ] **Step 1: Confirm the release diff and repository state**

Run:

```bash
git status --short
git log --oneline --decorate -8
git diff origin/main...HEAD --stat
```

Expected: only the planned application, test and documentation files differ; `.superpowers/` remains untracked and is not staged; the current branch is `main`.

- [ ] **Step 2: Push the completed commits**

Run: `git push origin main`

Expected: push succeeds and triggers `Deploy GitHub Pages`.

- [ ] **Step 3: Wait for the Pages workflow**

Run:

```bash
pages_run_id="$(work/gh-cli-v2.96.0/gh_2.96.0_macOS_arm64/bin/gh run list --workflow pages.yml --limit 1 --json databaseId --jq '.[0].databaseId')"
work/gh-cli-v2.96.0/gh_2.96.0_macOS_arm64/bin/gh run watch "$pages_run_id" --exit-status
```

Expected: the newest run for the pushed commit finishes with conclusion `success`.

- [ ] **Step 4: Verify the real public deployment**

Run:

```bash
curl -fsS -o /tmp/change-life-os-live.html -w '%{http_code}\n' https://matthew-altx.github.io/change-life-os/
live_script_path="$(rg -o 'assets/[^" ]+\.js' /tmp/change-life-os-live.html | head -1)"
live_css_path="$(rg -o 'assets/[^" ]+\.css' /tmp/change-life-os-live.html | head -1)"
curl -fsSI "https://matthew-altx.github.io/change-life-os/$live_script_path"
curl -fsSI "https://matthew-altx.github.io/change-life-os/$live_css_path"
```

Expected: HTML, JavaScript and CSS each return HTTP 200. Open the live URL in the browser and repeat language persistence, contextual guide and representative user-data checks against the deployed assets.

- [ ] **Step 5: Record deployment evidence**

Record the public URL, workflow run URL, deployed commit SHA and final verification result in the handoff. Do not claim completion until the browser is visibly running the new bilingual build.
