# Change-Life OS MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a responsive, Cantonese-first personal operating system that converts vision into a daily focus, quest, creation and reflection loop.

**Architecture:** A Vite React TypeScript single-page app stores one versioned state object through an isolated browser adapter. Pure domain functions own XP, levels, streaks, PIA validation, import validation and timer restoration; React screens compose those functions into five destinations and a four-step onboarding flow.

**Tech Stack:** React 19, TypeScript 5, Vite 7, Vitest 3, CSS, localStorage

## Global Constraints

- Static frontend-only build suitable for Cloudflare Pages, with output in `dist/`.
- No backend, login, analytics, payment or mandatory third-party runtime service.
- Product copy is Cantonese-first for Hong Kong users.
- Brand colours are `#143C2D`, `#DA8134`, `#9A3D1A`, `#FFFFFF` and gold `#D7AE5E`.
- `sources/` is read-only and must not be changed.
- Normal-text contrast meets WCAG AA and interactive targets are at least 44 by 44 CSS pixels.
- Invalid JSON import never overwrites current state.

---

### Task 1: Domain model and tested rules

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/domain/types.ts`
- Create: `src/domain/defaults.ts`
- Create: `src/domain/engine.ts`
- Create: `src/domain/engine.test.ts`

**Interfaces:**
- Produces: `AppState`, `Quest`, `ContentItem`, `DailyReview`, `createInitialState()`, `questXp()`, `calculateProgress()`, `completeQuest()`, `calculateStreak()`, `isPiaReady()`.

- [ ] **Step 1: Add the Vite, TypeScript and Vitest project configuration.**

`package.json` defines `dev`, `build`, `test` and `preview`; TypeScript uses strict mode and Vite uses the React plugin.

- [ ] **Step 2: Write failing domain tests.**

Cover XP values 20/50/100, 500-XP levels, reversible quest completion, skill XP, consecutive-date streaks and whitespace-safe PIA readiness.

- [ ] **Step 3: Run tests and confirm imports fail.**

Run: `npm test -- --run`

Expected: FAIL because domain modules do not exist.

- [ ] **Step 4: Implement types, defaults and pure domain functions.**

Use immutable updates and derive XP from completed quests rather than incrementing stored totals.

- [ ] **Step 5: Run tests and commit the passing domain layer.**

Run: `npm test -- --run`

Expected: all domain tests pass.

Commit: `feat: add Change-Life OS domain engine`

### Task 2: Persistence, import validation and timer recovery

**Files:**
- Create: `src/data/storage.ts`
- Create: `src/data/storage.test.ts`
- Create: `src/domain/timer.ts`
- Create: `src/domain/timer.test.ts`

**Interfaces:**
- Consumes: `AppState`, `createInitialState()`.
- Produces: `loadState(storage)`, `saveState(storage, state)`, `parseImportedState(text)`, `exportState(state)`, `remainingSeconds(timer, now)`, `startTimer(timer, now)`, `pauseTimer(timer, now)`.

- [ ] **Step 1: Write failing tests for valid state round-trip, malformed import rejection, version rejection and timer timestamp recovery.**

- [ ] **Step 2: Run targeted tests and confirm failure.**

Run: `npm test -- --run src/data/storage.test.ts src/domain/timer.test.ts`

- [ ] **Step 3: Implement the storage adapter and timer calculations.**

The adapter catches storage failures; parser validates `version`, `profile`, `quests`, `contentItems`, `reviews`, `resetPlan` and `progress` before returning a state.

- [ ] **Step 4: Run all tests and commit.**

Run: `npm test -- --run`

Expected: all tests pass.

Commit: `feat: add resilient local persistence`

### Task 3: Application shell, onboarding and Today loop

**Files:**
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/app/useAppState.ts`
- Create: `src/components/Icons.tsx`
- Create: `src/components/Navigation.tsx`
- Create: `src/components/ProgressRing.tsx`
- Create: `src/screens/Onboarding.tsx`
- Create: `src/screens/Today.tsx`
- Create: `src/styles.css`

**Interfaces:**
- Consumes: all Task 1 and Task 2 domain APIs.
- Produces: running onboarding and Today screens; `useAppState()` returns state and bounded mutation actions.

- [ ] **Step 1: Implement the four-step onboarding with inline required-field validation.**

Completion creates a main quest and boss quest from the user's 90-day inputs and opens Today.

- [ ] **Step 2: Implement the responsive shell and navigation.**

Desktop uses a left rail and mobile uses a five-item fixed bottom navigation.

- [ ] **Step 3: Implement Today cards for level/XP/streak, one daily priority, HUMAN 3.0 scores, timer and active quests.**

- [ ] **Step 4: Add the complete brand system and responsive styles.**

- [ ] **Step 5: Build and commit.**

Run: `npm run build`

Expected: TypeScript and Vite production build succeed.

Commit: `feat: build onboarding and daily focus loop`

### Task 4: Vision, quests, content and reset destinations

**Files:**
- Create: `src/screens/Vision.tsx`
- Create: `src/screens/Quests.tsx`
- Create: `src/screens/Content.tsx`
- Create: `src/screens/Reset.tsx`
- Modify: `src/App.tsx`
- Modify: `src/app/useAppState.ts`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `AppState` and bounded mutation actions.
- Produces: editable vision, CRUD quest workflow, four-stage content workflow, PIA editor, daily review, reset commitments and backup controls.

- [ ] **Step 1: Implement editable anti-vision, vision, niche and 90-day cards.**

- [ ] **Step 2: Implement quest creation, filtering, completion reversal and four skill progress bars.**

- [ ] **Step 3: Implement content capture, stage movement and PIA completeness indicator.**

- [ ] **Step 4: Implement 3-2-1 review, one-day reset checklist, 30-day commitments, export, validated import and confirmed clear.**

- [ ] **Step 5: Run tests and build, then commit.**

Run: `npm test -- --run && npm run build`

Expected: all tests pass and production build succeeds.

Commit: `feat: complete Change-Life OS workflows`

### Task 5: Browser acceptance and polish

**Files:**
- Modify: UI files only where acceptance findings require a fix.
- Create: `README.md`

**Interfaces:**
- Consumes: complete local application.
- Produces: verified responsive MVP and concise run/deploy instructions.

- [ ] **Step 1: Start the app and complete onboarding in a desktop browser.**

Run: `npm run dev -- --host 127.0.0.1`

Expected: onboarding completes and Today loads with persisted vision and quests.

- [ ] **Step 2: Exercise quest XP, timer restore, content stages, PIA, review persistence, export/import and malformed-import rejection.**

- [ ] **Step 3: Inspect at 390x844 and desktop viewport sizes; fix overflow, tap-target or contrast defects.**

- [ ] **Step 4: Add README instructions and run final checks.**

Run: `npm test -- --run && npm run build`

Expected: all tests pass and production build succeeds.

- [ ] **Step 5: Commit the accepted MVP.**

Commit: `docs: add verified MVP handoff`
