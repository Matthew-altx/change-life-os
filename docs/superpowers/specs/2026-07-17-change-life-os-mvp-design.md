# Change-Life OS MVP Design

## 1. Product outcome

Build a browser-first personal operating system for Hong Kong users. The MVP must turn an abstract life direction into one daily execution loop:

1. Face the cost of staying unchanged.
2. Define a 90-day direction.
3. Select one high-leverage action today.
4. Complete a focused work session.
5. Review the day and preserve momentum.

The product is not a generic task manager. Its primary success condition is that a new user can complete onboarding and begin the first focused work session within five minutes.

## 2. Scope

### Included

- Guided onboarding for anti-vision, ideal vision, personal niche and one 90-day quest.
- Today dashboard with one priority, four HUMAN 3.0 dimensions and a deep-work timer.
- RPG quest system with main quest, side quest, boss fight, XP, level and streak.
- Content flywheel board using Idea, Learn, Teach and Sell stages.
- PIA content check for Pain, Insight and Action.
- Evening 3-2-1 review.
- One-day reset flow.
- Local browser persistence plus JSON export and import.
- Responsive desktop and mobile layouts.
- Cantonese-first product copy for the Hong Kong market.

### Deliberately excluded

- Login, multi-device sync and collaboration.
- Supabase or another backend.
- AI-generated plans or content.
- Social-media publishing APIs.
- Operating-system-level app blocking.
- Payments, subscriptions and analytics.
- A literal 30-day enforcement engine; the MVP records reset commitments but cannot block external apps.

## 3. User journey

### First run

The user moves through four short onboarding steps:

1. **反願景** — describe the likely five-year cost of not changing.
2. **理想願景** — describe the desired life and work pattern.
3. **你就是利基** — combine strengths, interests, solved problems and people helped into one positioning statement.
4. **90 日主線** — choose one measurable outcome and one first boss fight.

On completion, the system creates the first main quest, awards onboarding XP and opens the Today dashboard.

### Daily loop

1. Rate Mind, Body, Spirit and Vocation from 1 to 5.
2. Choose or write one highest-leverage priority.
3. Start a 25, 50 or 90-minute focus session.
4. Mark quests complete to earn XP.
5. Finish the 3-2-1 evening review.

### Weekly creation loop

The user captures an idea, moves it through Learn, Teach and Sell, and checks whether the resulting content contains Pain, Insight and Action.

## 4. Information architecture

The app has five primary destinations:

- **今日** — daily focus, HUMAN 3.0 status, timer and active quests.
- **願景** — anti-vision, ideal vision, niche statement and 90-day outcome.
- **任務** — main quests, side quests, boss fights and skill progress.
- **內容** — idea-to-offer flywheel and PIA editor.
- **重置** — 3-2-1 review, one-day reset and data backup controls.

Desktop uses a left navigation rail. Mobile uses a fixed bottom navigation bar. The Today screen is always the default after onboarding.

## 5. Core components

### Today dashboard

- Hero card shows level, XP progress and current streak.
- Priority card permits exactly one active daily priority.
- Four compact status controls cover Mind, Body, Spirit and Vocation.
- Timer supports 25, 50 and 90 minutes, pause, resume and reset.
- Active quest list exposes the next useful action without opening another page.

### Vision system

- Editable cards preserve the four onboarding answers.
- The anti-vision uses direct, concrete prompts without fearmongering.
- The vision card displays the 90-day outcome beside the cost of inaction.

### Quest engine

- Quest types: `main`, `side`, `boss`.
- Difficulty awards: side 20 XP, main 50 XP, boss 100 XP.
- Every quest has a title, optional due date, status and skill category.
- Completing a quest is reversible. Reversing completion removes the same XP.
- Level is derived from lifetime XP using 500 XP per level.
- Skills are Writing, Speaking, Marketing and Sales. Completing a tagged quest adds its XP to that skill.

### Content flywheel

- A lightweight four-column board: Idea, Learn, Teach, Sell.
- Each content item has a title, notes and one current stage.
- The editor has three explicit fields: Pain, Insight and Action.
- An item is “PIA ready” only when all three fields contain non-whitespace text.

### Reset system

- Evening review stores exactly three wins, two lessons and one intention.
- One-day reset walks through disconnect, reflect, decide and recommit.
- Detox is represented as a configurable 30-day commitment checklist, not an external blocking promise.

## 6. Data model

All user data lives in one versioned `changeLifeOS` record in `localStorage`.

```text
AppState
  version: 1
  profile: { antiVision, vision, niche, ninetyDayOutcome, onboarded }
  humanScores: { mind, body, spirit, vocation, updatedAt }
  dailyPriority: { date, text, completed }
  quests: Quest[]
  contentItems: ContentItem[]
  reviews: DailyReview[]
  resetPlan: { commitments: string[], startDate, completedDays: string[] }
  progress: { lifetimeXp, streak, lastActiveDate }
```

Dates use local `YYYY-MM-DD` values so Hong Kong day boundaries remain intuitive. XP and level are derived or recalculated from persisted completion state to prevent drift.

## 7. Behaviour and error handling

- Empty required onboarding fields show an inline Cantonese message and keep the user on the same step.
- Local-storage write failure shows a non-blocking warning and offers JSON export.
- Import accepts JSON only after validating the version and required top-level fields.
- Invalid imports never overwrite the current state.
- Timer state is recovered from timestamps after tab backgrounding; it does not depend on interval accuracy.
- Destructive actions such as clearing all data require an explicit confirmation.
- The app remains usable without network access after initial load.

## 8. Visual direction

- Primary green: `#143C2D`.
- Accent orange: `#DA8134`.
- Deep orange: `#9A3D1A`.
- White: `#FFFFFF`.
- Gold accent: `#D7AE5E`.
- Warm off-white background and subtle paper-like texture; avoid a corporate dashboard appearance.
- Rounded cards, strong numerical hierarchy and restrained motion.
- Text contrast must meet WCAG AA for normal text.
- Tap targets must be at least 44 by 44 CSS pixels.

## 9. Technical architecture

- Static, frontend-only app suitable for Cloudflare Pages.
- Vite, React and TypeScript.
- No backend and no mandatory third-party runtime service.
- State logic is isolated from views so XP, streak, import validation and timer calculations can be unit tested.
- Browser persistence is accessed through a small storage adapter rather than directly throughout the UI.
- The production build outputs static assets in `dist/`.

## 10. Verification

### Automated checks

- Unit tests for XP calculation, reversible quest completion, level calculation, streak updates, PIA readiness, import validation and timer restoration.
- Production build must complete without TypeScript errors.

### Browser acceptance checks

1. Complete onboarding in under five minutes.
2. Create and complete each quest type; confirm XP and skill progress.
3. Start, pause and restore a focus timer after a page reload.
4. Add a content idea, move it through all stages and satisfy PIA.
5. Save a 3-2-1 review and see it after reload.
6. Export state, change data, import the export and recover the prior state.
7. Reject malformed JSON without data loss.
8. Verify desktop and mobile navigation at common viewport sizes.

## 11. MVP completion boundary

The MVP is complete when all automated checks pass, the production build succeeds and the eight browser acceptance checks pass locally. Cloudflare deployment is a separate action unless explicitly requested after local acceptance.
