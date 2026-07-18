# Change-Life OS Compact Editorial Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Change-Life OS show more useful action in the first viewport, keep desktop and tablet page titles on one line whenever they fit, and switch from the sidebar to bottom navigation at 900px without changing product behaviour or data.

**Architecture:** Keep the existing React markup and domain state intact. Implement the refinement through the shared layout system in `app/globals.css`, protect the exact breakpoint, title and density rules with the existing Node contract suite, then repeat the reference-versus-implementation browser QA before pushing the static GitHub Pages release.

**Tech Stack:** React 19, TypeScript 5.9, CSS, Node test runner, Vitest 3, Vite 8, GitHub Actions and GitHub Pages.

## Global Constraints

- Preserve the approved Editorial Focus visual direction and these brand colours: green `#143C2D`, orange `#DA8134`, deep orange `#9A3D1A`, white `#FFFFFF`, and gold `#D7AE5E`.
- Keep Cantonese as the default and preserve the existing `中 / EN` language switch.
- Do not change or translate user-entered content.
- Do not change life-data storage, backup JSON, XP, timer, quest, content, reset or guide behaviour.
- Keep every primary and score control at least 44 by 44 CSS pixels.
- Desktop and tablet titles prefer one line; mobile titles may use no more than two balanced lines.
- Never use ellipsis, clipping, horizontal scrolling or an unreadably small emergency title size.
- Hide the 208px sidebar and show the existing bottom navigation at exactly 900px and below.
- The page must have no horizontal overflow at 1440px, 1280px, 1024px, 900px, 800px or 390px.
- Preserve unrelated work and never add the untracked `.superpowers/` directory to a commit.

---

## File map

- Modify `tests/pages-contract.test.mjs` — parse media-query blocks and protect the compact shell, title, module-density and mobile-clearance rules.
- Modify `app/globals.css` — implement the approved title scale, compact spacing, 900px shell switch and 700px single-column breakpoint.
- Modify `design-qa.md` — record the new reference comparison, browser measurements, interactions and final QA result.
- Create `design-qa/evidence/implementation-compact-today-desktop-1440.png` — final populated Today desktop state.
- Create `design-qa/evidence/implementation-compact-vision-desktop-1280.png` — final Vision title regression state.
- Create `design-qa/evidence/implementation-compact-tablet-800.png` — full-width bottom-navigation tablet state.
- Create `design-qa/evidence/implementation-compact-mobile-390.png` — final mobile title and first-fold state.
- Create `design-qa/evidence/comparison-compact-reference-vs-desktop.png` — selected Editorial Focus source beside the final desktop implementation.

---

### Task 1: Compact shell, title scale and responsive navigation

**Files:**
- Modify: `tests/pages-contract.test.mjs:15-93`
- Modify: `app/globals.css:83-107,265-326`

**Interfaces:**
- Consumes: existing `.sidebar`, `.main-wrap`, `.top-utility`, `.screen`, `.page-head`, `.mobile-nav`, `.hero-grid` and `.human-grid` class names.
- Produces: `cssBlock(source: string, token: string): string` in the contract test, a desktop title range of `38px–46px`, and shell changes at `900px` with single-column content changes at `700px`.

- [ ] **Step 1: Add the CSS block parser and failing compact-shell contract**

Add this helper below `cssHex` in `tests/pages-contract.test.mjs`:

```js
const cssBlock = (source, token) => {
  const tokenIndex = source.indexOf(token);
  assert.notEqual(tokenIndex, -1, `Missing CSS token: ${token}`);

  const openingBrace = source.indexOf("{", tokenIndex);
  assert.notEqual(openingBrace, -1, `Missing opening brace for: ${token}`);

  let depth = 0;
  for (let index = openingBrace; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(openingBrace + 1, index);
  }

  assert.fail(`Missing closing brace for: ${token}`);
};
```

Add this test immediately after `Editorial Focus shell keeps utilities and responsive guidance in the content area`:

```js
test("compact editorial shell protects title measure and responsive navigation", () => {
  assert.match(styles, /\.top-utility \{[^}]*min-height: 56px/);
  assert.match(styles, /\.screen \{[^}]*padding: 40px clamp\(24px, 4vw, 56px\) 80px/);
  assert.match(styles, /\.page-head \{[^}]*margin-bottom: 28px/);
  assert.match(
    styles,
    /\.page-head h1 \{[^}]*font-size: clamp\(38px, 3\.2vw, 46px\);[^}]*line-height: 1\.1;[^}]*text-wrap: balance/,
  );
  assert.doesNotMatch(styles, /\.page-head h1 \{[^}]*(?:text-overflow: ellipsis|overflow: hidden|white-space: nowrap)/);

  const tabletShell = cssBlock(styles, "@media (max-width: 900px)");
  assert.match(tabletShell, /\.sidebar \{ display: none; \}/);
  assert.match(tabletShell, /\.main-wrap \{ margin-left: 0; \}/);
  assert.match(tabletShell, /\.mobile-nav \{[^}]*display: grid/);
  assert.match(tabletShell, /\.page-head h1 \{ font-size: clamp\(34px, 4\.4vw, 40px\); \}/);

  const mobileStack = cssBlock(styles, "@media (max-width: 700px)");
  assert.match(mobileStack, /\.page-head h1 \{ font-size: clamp\(30px, 8\.4vw, 34px\); \}/);
  assert.match(mobileStack, /\.hero-grid, \.work-grid, \.vision-grid, \.reset-grid, \.human-grid \{ grid-template-columns: 1fr; \}/);
  assert.doesNotMatch(styles, /@media \(max-width: 780px\)/);
});
```

In the existing Editorial Focus test, replace the old `humanStackRule` assertions with:

```js
  const tabletShell = cssBlock(styles, "@media (max-width: 900px)");
  const mobileStack = cssBlock(styles, "@media (max-width: 700px)");
  assert.match(tabletShell, /\.sidebar \{ display: none; \}/);
  assert.match(tabletShell, /\.mobile-nav \{[^}]*display: grid/);
  assert.match(mobileStack, /\.human-grid \{ grid-template-columns: 1fr; \}/);
```

- [ ] **Step 2: Run the focused contract and confirm the approved rules are absent**

Run:

```bash
node --test tests/pages-contract.test.mjs
```

Expected: FAIL in `compact editorial shell protects title measure and responsive navigation` because the current utility is `72px`, the title reaches `52px`, the shell still changes at `780px`, and no `700px` media block exists.

- [ ] **Step 3: Implement the desktop shell and title rules**

Replace the matching desktop rules in `app/globals.css` with:

```css
.top-utility { min-height: 56px; padding: 6px clamp(24px, 4vw, 56px); display: flex; align-items: center; justify-content: flex-end; gap: var(--space-3); border-bottom: 1px solid var(--line); background: rgba(245,241,232,.96); }
.language-switch { min-height: 48px; padding: 2px; display: inline-flex; align-items: center; justify-content: center; gap: 2px; border: 1px solid var(--line); border-radius: 999px; color: var(--muted); background: var(--paper); }
.main-wrap { min-width: 0; min-height: 100vh; min-height: 100dvh; margin-left: 208px; }
.screen { width: min(1180px, 100%); min-width: 0; margin: 0 auto; padding: 40px clamp(24px, 4vw, 56px) 80px; }
.screen.wide { width: min(1380px, 100%); }
.page-head { margin-bottom: 28px; display: flex; align-items: flex-end; justify-content: space-between; gap: var(--space-5); }
.page-head > div:first-child { min-width: 0; max-width: 1040px; flex: 1; }
.page-head h1 { margin: 0; font-family: Georgia, "Noto Serif TC", serif; font-size: clamp(38px, 3.2vw, 46px); line-height: 1.1; letter-spacing: -.035em; text-wrap: balance; }
.page-head > div > p:last-child { max-width: 760px; margin: 9px 0 0; color: var(--muted); line-height: 1.65; }
```

- [ ] **Step 4: Replace the old 900px and 780px responsive blocks**

Keep the existing `@media (max-width: 1050px)` flywheel, quest and PIA rules, but remove its `.hero-grid` override. Replace the complete current `900px` and `780px` blocks with:

```css
@media (max-width: 900px) {
  .sidebar { display: none; }
  .main-wrap { margin-left: 0; }
  .top-utility { min-height: 56px; padding: 4px 20px; justify-content: flex-end; background: var(--canvas); }
  .language-switch { min-height: 48px; }
  .screen { padding: 28px 20px calc(96px + env(safe-area-inset-bottom)); }
  .page-head { align-items: stretch; flex-direction: column; gap: 16px; margin-bottom: 24px; }
  .page-head h1 { font-size: clamp(34px, 4.4vw, 40px); }
  .level-card { padding: var(--space-5); grid-template-columns: auto minmax(0, 1fr); }
  .level-ring { width: 76px; height: 76px; }
  .level-ring strong { font-size: 34px; }
  .streak { grid-column: 1 / -1; justify-content: center; border-top: 1px solid rgba(255,255,255,.1); padding-top: 12px; }
  .quest-layout { grid-template-columns: 1fr; }
  .skill-card { position: static; }
  .pia-grid { grid-template-columns: 1fr; }
  .flywheel { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .mobile-nav { position: fixed; inset: auto 0 0; z-index: 30; min-height: 72px; padding: 6px 8px max(6px, env(safe-area-inset-bottom)); display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); border-top: 1px solid var(--line); background: rgba(255,253,248,.97); backdrop-filter: blur(16px); }
  .mobile-nav button { min-width: 0; min-height: 52px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; border: 0; border-radius: 10px; color: var(--muted); background: transparent; font-size: 10px; }
  .mobile-nav button span { color: var(--muted); font-family: Georgia, serif; font-size: 9px; }
  .mobile-nav button.active { color: white; background: #0F3024; box-shadow: inset 3px 0 0 var(--orange); }
  .mobile-nav button.active span { color: var(--orange); }
}

@media (max-width: 700px) {
  .screen { padding: 24px 16px calc(92px + env(safe-area-inset-bottom)); }
  .page-head h1 { font-size: clamp(30px, 8.4vw, 34px); }
  .hero-grid, .work-grid, .vision-grid, .reset-grid, .human-grid { grid-template-columns: 1fr; }
  .human-card { padding: 16px; }
  .section-title { align-items: flex-start; flex-direction: column; gap: 6px; }
  .boss-banner { grid-template-columns: 1fr; }
  .form-row { grid-template-columns: 1fr; }
  .capture { min-width: 0; width: 100%; display: grid; grid-template-columns: minmax(0, 1fr) auto; }
  .flywheel { grid-template-columns: 1fr; }
  .data-card { align-items: flex-start; flex-direction: column; }
  .data-actions { justify-content: flex-start; }
  .onboarding-brand { position: static; align-self: flex-start; margin-bottom: 16px; }
  .onboarding-utility { position: static; align-self: flex-end; margin-bottom: 16px; }
  .onboarding-shell { justify-content: flex-start; padding: 24px 16px; }
  .onboarding-card { padding: 26px 20px; border-radius: 22px; }
  .step-track { margin-bottom: 28px; }
  .privacy-note { text-align: center; }
  .notice { top: 72px; right: 16px; left: 16px; }
  .guide-backdrop { padding: 0; place-items: end stretch; }
  .guide-modal { width: 100%; height: 100vh; height: 100dvh; max-height: none; padding: 24px 18px calc(24px + env(safe-area-inset-bottom)); border: 0; border-radius: 0; }
  .context-guide { grid-template-columns: 1fr; }
  .context-guide .done-when { grid-column: auto; }
  .guide-footer { align-items: stretch; flex-direction: column; }
  .guide-tabs { display: grid; grid-template-columns: 1fr 1fr; }
  .guide-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
```

- [ ] **Step 5: Run the focused contract and production Pages gate**

Run:

```bash
node --test tests/pages-contract.test.mjs
npm run test:pages
```

Expected: all 9 Pages contract tests pass, all 29 client-core tests pass, strict typecheck passes, and Vite produces `dist-pages/` successfully.

- [ ] **Step 6: Commit the compact shell**

```bash
git add app/globals.css tests/pages-contract.test.mjs
git commit -m "style: compact editorial shell and titles"
```

---

### Task 2: Consistent first-fold density across all five modules

**Files:**
- Modify: `tests/pages-contract.test.mjs`
- Modify: `app/globals.css:102-236`

**Interfaces:**
- Consumes: the Task 1 shell and existing card class names.
- Produces: exact shared spacing values for page cards and sections without changing React markup.

- [ ] **Step 1: Add a failing module-density contract**

Add this test after the compact-shell test:

```js
test("compact editorial cards expose more useful first-fold content", () => {
  assert.match(styles, /\.card-kicker \{[^}]*margin-bottom: 16px/);
  assert.match(styles, /\.hero-grid \{[^}]*gap: var\(--space-3\)/);
  assert.match(styles, /\.level-card \{[^}]*min-height: 160px;[^}]*padding: var\(--space-6\)/);
  assert.match(styles, /\.priority-card \{ padding: var\(--space-6\)/);
  assert.match(styles, /\.section-block \{ margin-top: 36px; \}/);
  assert.match(styles, /\.human-grid \{[^}]*gap: var\(--space-3\)/);
  assert.match(styles, /\.work-grid \{[^}]*margin-top: var\(--space-3\);[^}]*gap: var\(--space-3\)/);
  assert.match(styles, /\.timer-card, \.quest-preview \{ min-height: 300px; padding: var\(--space-6\); \}/);
  assert.match(styles, /\.vision-card \{[^}]*min-height: 320px;[^}]*padding: var\(--space-6\)/);
  assert.match(styles, /\.reset-grid \{[^}]*gap: var\(--space-3\)/);
  assert.match(styles, /\.review-card, \.protocol-card, \.detox-card \{ padding: var\(--space-6\); \}/);
});
```

- [ ] **Step 2: Run the focused contract and confirm the old density values fail**

Run:

```bash
node --test tests/pages-contract.test.mjs
```

Expected: FAIL in `compact editorial cards expose more useful first-fold content` because the current section margin is `48px`, hero gap is `16px`, level card is `176px`, and timer cards are `330px`.

- [ ] **Step 3: Apply the exact shared density rules**

Replace the matching rules in `app/globals.css` with:

```css
.card-kicker { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.hero-grid { display: grid; grid-template-columns: 1.05fr 1fr; gap: var(--space-3); }
.level-card { min-height: 160px; padding: var(--space-6); display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: var(--space-5); color: white; background: var(--green); }
.priority-card { padding: var(--space-6); background: var(--paper); }
.section-block { margin-top: 36px; }
.human-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-3); }
.human-card { padding: 18px; }
.work-grid { margin-top: var(--space-3); display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-3); }
.timer-card, .quest-preview { min-height: 300px; padding: var(--space-6); }
.timer-display { display: block; margin: 16px 0 2px; font-family: Georgia, serif; font-size: clamp(54px, 6vw, 76px); line-height: 1; letter-spacing: -.04em; }
.timer-actions { display: flex; justify-content: center; gap: 10px; margin-top: 18px; }
.vision-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-3); }
.vision-card { min-width: 0; min-height: 320px; padding: var(--space-6); border: 1px solid var(--line); border-radius: 16px; background: var(--paper); box-shadow: var(--shadow); }
.boss-banner { margin-top: var(--space-3); padding: var(--space-5) var(--space-6); display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr); align-items: center; gap: var(--space-6); }
.quest-layout { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: var(--space-3); align-items: start; }
.quest-form { padding: 20px; }
.skill-card { position: sticky; top: 20px; padding: var(--space-6); }
.stage { min-height: 390px; border: 1px solid var(--line); border-radius: 18px; background: rgba(255,255,255,.38); }
.pia-editor { margin-top: 16px; padding: var(--space-6); }
.reset-grid { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, .85fr); gap: var(--space-3); align-items: start; }
.review-card, .protocol-card, .detox-card { padding: var(--space-6); }
.data-card { margin-top: var(--space-3); padding: var(--space-6); display: flex; align-items: center; justify-content: space-between; gap: var(--space-6); }
```

- [ ] **Step 4: Run all local gates**

Run:

```bash
npm test
npm run test:google
npm run test:pages
npm run lint
git diff --check
```

Expected: 36 Vitest tests and the rendered HTML test pass; 14 Google tests pass; 29 client-core tests, 10 Pages contracts, strict typecheck and the Pages build pass; lint reports 0 errors with only the two existing `google-app/Core.js` warnings; `git diff --check` has no output.

- [ ] **Step 5: Commit the shared density system**

```bash
git add app/globals.css tests/pages-contract.test.mjs
git commit -m "style: tighten editorial module rhythm"
```

---

### Task 3: Responsive browser QA and visual evidence

**Files:**
- Modify: `design-qa.md`
- Create: `design-qa/evidence/implementation-compact-today-desktop-1440.png`
- Create: `design-qa/evidence/implementation-compact-vision-desktop-1280.png`
- Create: `design-qa/evidence/implementation-compact-tablet-800.png`
- Create: `design-qa/evidence/implementation-compact-mobile-390.png`
- Create: `design-qa/evidence/comparison-compact-reference-vs-desktop.png`

**Interfaces:**
- Consumes: the selected source `design-qa/evidence/reference-editorial-focus.png`, realistic existing local user data and the completed CSS from Tasks 1–2.
- Produces: browser evidence and a root `design-qa.md` whose final line remains exactly `final result: passed`.

- [ ] **Step 1: Start or confirm the Pages development server**

Run:

```bash
curl -sS -o /dev/null -w '%{http_code}\n' http://localhost:4173/
```

Expected: `200`. If no server is running, start the existing Pages development command:

```bash
npm run dev:pages -- --host 0.0.0.0 --port 4173 --strictPort
```

Expected: Vite reports the local server on port `4173` and keeps running.

- [ ] **Step 2: Verify desktop Today and Vision states in the in-app Browser**

Use the in-app Browser at 1440×1000 and 1280×900 with the existing realistic profile. Confirm:

```text
Today 1440:
- document width equals scroll width
- page title is one line
- HUMAN 3.0 heading enters the first 1000px viewport
- level, priority, score and timer controls remain usable

Vision 1280:
- "用願景拉動自己，唔係靠意志力推。" is one line
- title bounding-box height is no more than 1.3 times its computed font size
- vision cards do not overlap or clip
```

Save the screenshots to the exact desktop evidence paths listed in this task.

- [ ] **Step 3: Verify the 900px shell boundary and the 800px tablet layout**

At 900×900 and 800×900 confirm:

```text
- .sidebar is not visible
- .main-wrap has zero left margin
- .mobile-nav is visible and does not cover page controls
- document width equals scroll width
- page title is one line when its translated copy fits
- two-column cards remain inside their parent bounds
```

Save the final 800px state as `design-qa/evidence/implementation-compact-tablet-800.png`.

- [ ] **Step 4: Verify the 390px mobile state and core interactions**

At 390×844 confirm:

```text
- title uses no more than two lines
- document width and scroll width are both 390px
- top language and guide controls fit on one row
- fixed bottom navigation does not cover the last interactive control
- English Capture remains one line and at least 104×44px
- language switch, guide open/close, timer start/pause and Content capture respond
- browser console has no errors or warnings
```

Save the final screenshot as `design-qa/evidence/implementation-compact-mobile-390.png`.

- [ ] **Step 5: Create the combined comparison and update the QA report**

Place the selected reference and the final 1440px Today implementation side by side, save the result as `design-qa/evidence/comparison-compact-reference-vs-desktop.png`, and add this section before `Remaining differences` in `design-qa.md`:

```markdown
## Compact layout refinement — 2026-07-18

- Desktop Today title is one line and the HUMAN section enters the first 1000px viewport.
- Vision regression title `用願景拉動自己，唔係靠意志力推。` remains one line at 1440px and 1280px.
- The sidebar switches to bottom navigation at 900px; 900px and 800px document widths equal their viewport widths.
- Mobile titles use no more than two balanced lines at 390×844, with no covered controls or horizontal overflow.
- Language switching, contextual guide, timer and Content capture remain functional.
- Final browser console check contains no errors or warnings.

Evidence:

- `design-qa/evidence/implementation-compact-today-desktop-1440.png`
- `design-qa/evidence/implementation-compact-vision-desktop-1280.png`
- `design-qa/evidence/implementation-compact-tablet-800.png`
- `design-qa/evidence/implementation-compact-mobile-390.png`
- `design-qa/evidence/comparison-compact-reference-vs-desktop.png`
```

Open the reference and final comparison together. Fix every visible P0, P1 or P2 issue, recapture the affected state, and repeat until the last line of `design-qa.md` is exactly:

```text
final result: passed
```

- [ ] **Step 6: Commit the verified visual evidence**

```bash
git add design-qa.md \
  design-qa/evidence/implementation-compact-today-desktop-1440.png \
  design-qa/evidence/implementation-compact-vision-desktop-1280.png \
  design-qa/evidence/implementation-compact-tablet-800.png \
  design-qa/evidence/implementation-compact-mobile-390.png \
  design-qa/evidence/comparison-compact-reference-vs-desktop.png
git commit -m "docs: verify compact editorial layout"
```

---

### Task 4: Final regression, GitHub push and public Pages verification

**Files:**
- Verify only: `.github/workflows/pages.yml`, generated `dist-pages/`, public GitHub Pages assets.

**Interfaces:**
- Consumes: the three completed implementation and QA commits.
- Produces: pushed `main`, a successful `Deploy GitHub Pages` workflow and a live public layout verified in the in-app Browser.

- [ ] **Step 1: Run the complete release gate from a clean tracked worktree**

Run:

```bash
git status --short
npm test
npm run test:google
npm run test:pages
npm run lint
git diff --check
```

Expected: only the existing untracked `.superpowers/` directory remains; all tests and builds pass; lint has 0 errors and only the two existing Google Core warnings; `git diff --check` has no output.

- [ ] **Step 2: Push the verified main branch**

Run:

```bash
git push origin main
```

Expected: Git reports that `main` advanced on `https://github.com/Matthew-altx/change-life-os.git`.

- [ ] **Step 3: Watch the GitHub Pages release**

Run:

```bash
work/gh-cli-v2.96.0/gh_2.96.0_macOS_arm64/bin/gh run list \
  --repo Matthew-altx/change-life-os \
  --branch main \
  --limit 1 \
  --json databaseId,name,status,conclusion,url,headSha
```

Capture the returned `databaseId` and watch that exact run:

```bash
CHANGE_LIFE_RUN_ID=$(work/gh-cli-v2.96.0/gh_2.96.0_macOS_arm64/bin/gh run list \
  --repo Matthew-altx/change-life-os \
  --branch main \
  --limit 1 \
  --json databaseId \
  --jq '.[0].databaseId')
work/gh-cli-v2.96.0/gh_2.96.0_macOS_arm64/bin/gh run watch "$CHANGE_LIFE_RUN_ID" \
  --repo Matthew-altx/change-life-os \
  --exit-status
```

Expected: both `build` and `deploy` complete successfully. `CHANGE_LIFE_RUN_ID` exists only in this release shell and is resolved from the immediately preceding GitHub query.

- [ ] **Step 4: Verify the public HTML and hashed assets**

Run:

```bash
python3 - <<'PY'
import re
import urllib.parse
import urllib.request

url = "https://matthew-altx.github.io/change-life-os/"
with urllib.request.urlopen(url, timeout=20) as response:
    html = response.read().decode("utf-8")
    assert response.status == 200
    assets = re.findall(r'(?:src|href)="([^"]+\.(?:js|css))"', html)
    assert len(assets) == 2
    for asset in assets:
        with urllib.request.urlopen(urllib.parse.urljoin(url, asset), timeout=20) as item:
            assert item.status == 200
    print("public Pages HTML and assets: passed")
PY
```

Expected: `public Pages HTML and assets: passed`.

- [ ] **Step 5: Perform the final public browser smoke test**

Open `https://matthew-altx.github.io/change-life-os/` in the in-app Browser and confirm:

```text
- Cantonese onboarding or Today loads without visual corruption
- 中 / EN changes the product-owned copy and survives reload
- desktop title measure matches the local build
- 900px uses bottom navigation
- 390px has no horizontal overflow
- browser console has no errors or warnings
```

Keep the final public tab as the deliverable and reset temporary viewport overrides before handoff.

---

## Plan self-review

- **Spec coverage:** Tasks 1–2 cover shell, title, spacing, five-module density, breakpoint and touch-target requirements. Task 3 covers every required viewport, interaction and visual comparison. Task 4 covers all release and public verification conditions.
- **Placeholder scan:** Every change, command, expected result and verification state is explicit; no deferred validation or unspecified test instruction remains.
- **Type and selector consistency:** The plan reuses the current `.page-head`, `.sidebar`, `.main-wrap`, `.mobile-nav`, card and grid selectors. No new runtime type or React interface is introduced.
