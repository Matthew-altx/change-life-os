# Mobile Garden UI Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將手機花園改成沉浸式輕 HUD，移除守護靈深綠底板、減輕四維卡重量，並改善 390px iOS Safari 畫面節奏。

**Architecture:** 保留現有 `GardenScene` 資料流，只新增透明守護靈衍生資產及一個短 HUD 文案鍵。視覺改動集中於 `app/globals.css`，現有種子、主題、四維成長及守護靈階段邏輯完全不變。

**Tech Stack:** React 19、TypeScript、Vite、Vitest、Sharp 0.34.5、WebP、Playwright CLI、GitHub Pages。

## Global Constraints

- 只處理 UI、排版及現有圖像資產嘅顯示方式；不修改玩法、種子規則、成長速度、付費權益、儲存格式或文案語意。
- 網站主色維持深綠 `#143C2D`、橙 `#DA8134`、深橙 `#9A3D1A`、白色及金色。
- 不加入新圖像生成服務、動畫框架或分析追蹤。
- 手機主要驗收尺寸為 390×844，另檢查 360px、430px、平板及桌面。
- `prefers-reduced-motion` 必須停用守護靈動畫。
- 付款功能保持關閉。

---

### Task 1: 產生透明守護靈資產

**Files:**
- Create: `scripts/build-guardian-alpha.mjs`
- Create: `public/garden/guardian-0-alpha.webp`
- Create: `public/garden/guardian-1-alpha.webp`
- Create: `public/garden/guardian-2-alpha.webp`
- Create: `public/garden/guardian-3-alpha.webp`
- Create: `public/garden/guardian-4-alpha.webp`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `app/gardenAssets.test.ts`
- Modify: `app/gardenAssets.ts`

**Interfaces:**
- Consumes: `public/garden/guardian-{0..4}.webp`, each 300×400 with a connected dark-green background.
- Produces: `guardianStageAsset(stage: number): string` resolving to `guardian-{0..4}-alpha.webp`, each 300×400 WebP with alpha.

- [ ] **Step 1: Change the asset mapping test so it requires transparent filenames**

```ts
expect(guardianStageAsset(-1)).toMatch(/guardian-0-alpha\.webp$/);
expect(guardianStageAsset(8)).toMatch(/guardian-4-alpha\.webp$/);
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run: `npx vitest run app/gardenAssets.test.ts --config vitest.config.ts`

Expected: FAIL because the current helper still returns `guardian-0.webp` and `guardian-4.webp`.

- [ ] **Step 3: Add Sharp as an explicit development dependency**

Run: `npm install --save-dev sharp@0.34.5`

Expected: `package.json` contains `"sharp": "^0.34.5"` under `devDependencies` and the lockfile updates without audit errors blocking installation.

- [ ] **Step 4: Create the connected-background removal script**

Create `scripts/build-guardian-alpha.mjs` with this complete pipeline:

```js
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const assetDir = "public/garden";
const width = 300;
const height = 400;
const isBackground = (r, g, b) => r < 70 && g < 105 && b < 90 && g >= r * .85 && g >= b * .8;

await mkdir(assetDir, { recursive: true });

for (let stage = 0; stage <= 4; stage += 1) {
  const input = `${assetDir}/guardian-${stage}.webp`;
  const output = `${assetDir}/guardian-${stage}-alpha.webp`;
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.width !== width || info.height !== height || info.channels !== 4) {
    throw new Error(`Unexpected guardian dimensions: ${input}`);
  }

  const visited = new Uint8Array(width * height);
  const queue = [];
  const enqueue = (x, y) => {
    const pixel = y * width + x;
    if (visited[pixel]) return;
    const offset = pixel * 4;
    if (!isBackground(data[offset], data[offset + 1], data[offset + 2])) return;
    visited[pixel] = 1;
    queue.push(pixel);
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const pixel = queue[cursor];
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    if (x > 0) enqueue(x - 1, y);
    if (x < width - 1) enqueue(x + 1, y);
    if (y > 0) enqueue(x, y - 1);
    if (y < height - 1) enqueue(x, y + 1);
  }

  for (let pixel = 0; pixel < visited.length; pixel += 1) {
    if (visited[pixel]) data[pixel * 4 + 3] = 0;
  }

  await sharp(data, { raw: info })
    .webp({ quality: 92, alphaQuality: 100 })
    .toFile(output);
}

console.log("Transparent guardian assets generated.");
```

- [ ] **Step 5: Generate and inspect the assets**

Run: `node scripts/build-guardian-alpha.mjs`

Run: `node -e "import('sharp').then(async ({default:sharp})=>{for(let i=0;i<5;i++){const m=await sharp('public/garden/guardian-'+i+'-alpha.webp').metadata();console.log(i,m.width,m.height,m.hasAlpha)}})"`

Expected: five lines containing `300 400 true`. Inspect stage 0 and stage 4 against a checkerboard or contrasting background; the cloak, black face, eyes, gold halo and particles remain intact.

- [ ] **Step 6: Point the runtime helper at transparent assets**

```ts
export const guardianStageAsset = (stage: number) => gardenAsset(
  `guardian-${Math.max(0, Math.min(4, Math.round(stage)))}-alpha.webp`,
);
```

- [ ] **Step 7: Run the focused test and commit**

Run: `npx vitest run app/gardenAssets.test.ts --config vitest.config.ts`

Expected: PASS, 2 tests.

```bash
git add package.json package-lock.json scripts/build-guardian-alpha.mjs app/gardenAssets.ts app/gardenAssets.test.ts public/garden/guardian-*-alpha.webp
git commit -m "feat: add transparent guardian artwork"
```

---

### Task 2: 建立輕量種子 HUD

**Files:**
- Modify: `app/i18n.ts`
- Modify: `app/i18n.test.ts`
- Modify: `app/GrowthGarden.tsx`

**Interfaces:**
- Consumes: `garden.guardianStage`, `totalSeeds`, `copy.growth.seeds`.
- Produces: `copy.growth.guardianHud(stage: number): string` and a single-line `.garden-hud` figcaption.

- [ ] **Step 1: Add the bilingual HUD copy contract to the i18n test**

Add `"growth.guardianHud"` to the required function-key list and assert:

```ts
expect(COPY["zh-HK"].growth.guardianHud(2)).toBe("守護靈 2 / 4");
expect(COPY.en.growth.guardianHud(2)).toBe("Guardian 2 / 4");
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run: `npx vitest run app/i18n.test.ts --config vitest.config.ts`

Expected: FAIL because `guardianHud` does not exist.

- [ ] **Step 3: Add the copy implementations**

Chinese growth copy:

```ts
guardianHud: (stage: number) => `守護靈 ${stage} / 4`,
```

English growth copy:

```ts
guardianHud: (stage) => `Guardian ${stage} / 4`,
```

- [ ] **Step 4: Replace the old seed box markup with one HUD row**

Replace the existing figcaption content in `GardenScene` with:

```tsx
<figcaption className="garden-hud">
  <span><strong>{totalSeeds}</strong>{copy.growth.seeds}</span>
  <i aria-hidden="true">·</i>
  <span>{copy.growth.guardianHud(garden.guardianStage)}</span>
</figcaption>
```

Keep the guardian container `role="img"` and its existing `guardianLabel` unchanged.

- [ ] **Step 5: Run i18n and type tests and commit**

Run: `npx vitest run app/i18n.test.ts app/gardenAssets.test.ts --config vitest.config.ts`

Run: `npm run typecheck:client-core`

Expected: both commands PASS.

```bash
git add app/i18n.ts app/i18n.test.ts app/GrowthGarden.tsx
git commit -m "feat: simplify garden progress HUD"
```

---

### Task 3: 重排沉浸式花園 UI

**Files:**
- Modify: `app/globals.css:166-198`
- Modify: `app/globals.css:430-456`
- Test: `tests/pages-contract.test.mjs`

**Interfaces:**
- Consumes: `.garden-hud`, `.guardian-image`, `.garden-image-zone`, `.zone-{dimension}`, `.theme-first-light`.
- Produces: a 470px-high mobile garden at `<=460px`, transparent floating guardian, lighter dimension cards and non-overlapping supporter badge.

- [ ] **Step 1: Add CSS contract assertions for the approved mobile layout**

Add assertions to the Editorial Focus contract test:

```js
assert.match(css, /\.garden-hud\s*\{/);
assert.match(css, /\.guardian-image\s*\{[^}]*background:\s*transparent/s);
assert.match(css, /@media \(max-width: 460px\)[\s\S]*\.life-garden\s*\{[^}]*min-height:\s*470px/);
assert.doesNotMatch(css, /\.guardian-image\s*\{[^}]*overflow:\s*hidden/s);
```

- [ ] **Step 2: Run the Pages contract and confirm it fails**

Run: `node --test tests/pages-contract.test.mjs`

Expected: FAIL on missing `.garden-hud`, transparent guardian and 470px mobile height.

- [ ] **Step 3: Make the guardian float without a container**

Apply these base rules, retaining the existing stage-4 animation:

```css
.guardian-image {
  position: absolute;
  z-index: 4;
  width: 156px;
  height: 208px;
  left: 50%;
  top: 53%;
  overflow: visible;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  transform: translate(-50%, -50%);
  filter: drop-shadow(0 18px 24px rgba(8,31,23,.34));
}
.guardian-image img { width: 100%; height: 100%; display: block; object-fit: contain; }
.theme-first-light .guardian-image {
  border: 0;
  box-shadow: none;
  filter: drop-shadow(0 18px 28px rgba(96,63,21,.32)) drop-shadow(0 0 15px rgba(255,223,141,.38));
}
```

- [ ] **Step 4: Restyle the HUD and lighter dimension cards**

Use a compact horizontal HUD with no CSS gradient:

```css
.garden-hud {
  position: absolute;
  z-index: 6;
  top: 18px;
  left: 20px;
  min-height: 36px;
  padding: 7px 12px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid rgba(255,255,255,.38);
  border-radius: 999px;
  color: white;
  background: rgba(8,31,23,.54);
  box-shadow: 0 8px 22px rgba(8,31,23,.18);
  backdrop-filter: blur(10px);
}
.garden-hud span { display: inline-flex; align-items: baseline; gap: 5px; font-size: 10px; font-weight: 800; }
.garden-hud strong { font-family: Georgia, serif; font-size: 18px; line-height: 1; }
.garden-hud i { color: rgba(255,255,255,.55); font-style: normal; }
.garden-image-zone { height: 108px; border-color: rgba(255,255,255,.3); background: rgba(20,60,45,.72); box-shadow: 0 10px 26px rgba(8,31,23,.2); }
.garden-image-zone::after { box-shadow: inset 0 -58px 42px -30px rgba(8,31,23,.84); }
.garden-image-zone > b { min-width: 24px; height: 24px; padding: 0 6px; font-size: 10px; }
```

- [ ] **Step 5: Apply the 390px mobile composition**

Inside `@media (max-width: 460px)` use:

```css
.life-garden { min-height: 470px; }
.garden-hud { top: 12px; left: 50%; transform: translateX(-50%); white-space: nowrap; }
.garden-image-zone { width: calc(50% - 17px); height: 92px; }
.garden-image-zone.zone-mind, .garden-image-zone.zone-body { top: 62px; }
.garden-image-zone.zone-mind, .garden-image-zone.zone-spirit { left: 10px; }
.garden-image-zone.zone-body, .garden-image-zone.zone-vocation { right: 10px; }
.garden-image-zone.zone-spirit, .garden-image-zone.zone-vocation { bottom: 12px; }
.garden-zone-copy { right: 9px; bottom: 7px; left: 9px; }
.garden-zone-copy strong { font-size: 15px; }
.guardian-image { width: 132px; height: 176px; top: 52%; }
.supporter-mark { top: 12px; right: 12px; width: 32px; height: 32px; }
```

Add `padding-bottom: calc(100px + env(safe-area-inset-bottom))` to the mobile `.screen` rule only if the final action card cannot scroll completely above the fixed navigation during Playwright inspection.

- [ ] **Step 6: Run contract, type and full Pages tests**

Run: `node --test tests/pages-contract.test.mjs`

Run: `npm run test:pages`

Expected: 10 Pages contract tests and all Vitest tests PASS; the Pages production build succeeds and CSS still contains no `gradient(`.

- [ ] **Step 7: Commit the layout**

```bash
git add app/globals.css tests/pages-contract.test.mjs
git commit -m "style: refine immersive mobile garden"
```

---

### Task 4: 實機視覺驗收及交付

**Files:**
- Verify: `app/GrowthGarden.tsx`
- Verify: `app/globals.css`
- Verify: `public/garden/guardian-*-alpha.webp`
- Artifacts: `output/playwright/mobile-garden-360.png`
- Artifacts: `output/playwright/mobile-garden-390.png`
- Artifacts: `output/playwright/mobile-garden-430.png`
- Artifacts: `output/playwright/mobile-garden-first-light.png`

**Interfaces:**
- Consumes: completed Tasks 1–3 and the local GitHub Pages preview.
- Produces: visual evidence, clean console, final commit state and a deployment-ready branch.

- [ ] **Step 1: Start the Pages preview**

Run: `npm run dev:pages -- --host 127.0.0.1`

Expected: Vite serves `http://127.0.0.1:5173/`.

- [ ] **Step 2: Reuse a test-only localStorage state and inspect 360px, 390px and 430px**

Use Playwright CLI. At each width, snapshot before interaction and capture the garden figure. Confirm:

- HUD remains one line and does not overlap the supporter badge.
- Guardian has no rectangular or pill-shaped background.
- Top and bottom dimension cards do not touch the guardian.
- All four labels and seed counts remain readable.
- The next action card can scroll above the fixed mobile navigation.

- [ ] **Step 3: Inspect classic, First Light and guardian stages**

Capture classic stage 0, complete one test seed to view stage 1, and use test state to inspect stage 4. Toggle the First Light preview and confirm both backgrounds preserve readable HUD and card contrast.

- [ ] **Step 4: Check accessibility and console output**

Verify the snapshot still exposes `figure "你嘅四維生命花園"`, all four dimension labels/counts, and `img "守護靈成長階段 N / 4"`. Run Playwright console inspection; expect 0 errors and 0 warnings caused by the garden.

- [ ] **Step 5: Run the final clean-tree gate**

Run: `npm run test:pages && git diff --check && git status -sb`

Expected: all tests/build pass, no whitespace errors, and only intentional committed changes remain.

- [ ] **Step 6: Prepare the release handoff**

Report the branch, commits, screenshots, tests and the fact that commerce remains disabled. Push/open a PR and merge to GitHub Pages only when deployment is explicitly included in the active user instruction.
