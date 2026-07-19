# Change-Life OS Garden Image Assets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the HTML/CSS-drawn life garden with a coherent, responsive set of original GPT-generated image assets while preserving all growth, theme, privacy, and accessibility behavior.

**Architecture:** A pure `gardenAssets` module maps garden state to versioned local asset URLs. `GrowthGarden` renders a background plus decorative image layers and keeps semantic labels as HTML. The completion-card module reuses the same manifest to compose a private PNG locally with Canvas.

**Tech Stack:** React 19, TypeScript 5.9, CSS, Vitest, browser Canvas, local WebP/PNG assets, GPT Web image generation.

## Global Constraints

- Art direction is warm Japanese storybook plus refined fantasy garden.
- Use `#143C2D`, `#DA8134`, `#9A3D1A`, white, and gold as the core palette.
- The guardian is gender-neutral and non-religious; do not include scripture, logos, realistic people, or recognisable third-party IP.
- HTML may provide layout, labels, values, and interaction, but must not draw the garden, motifs, or guardian with geometric CSS.
- Growth stages are `0 = dormant`, `1–2 = sprout`, `3–4 = growing`, `5+ = bloom`; guardian stages remain `0–4`.
- Generated masters live in `outputs/`; web-ready assets live in `public/garden/`; do not use an external CDN.
- Preserve `prefers-reduced-motion`, screen-reader labels, 390px support, supporter preview, and all game/payment rules.
- The completion card must not include scores, quests, custom actions, vision, or review text.

---

### Task 1: Generate and prepare the art pack

**Files:**
- Create: `outputs/garden-style-reference-<timestamp>.png`
- Create: `outputs/garden-source-*.png`
- Create: `public/garden/classic-background.webp`
- Create: `public/garden/first-light-background.webp`
- Create: `public/garden/{mind,body,spirit,vocation}-{0,1,2,3}.webp`
- Create: `public/garden/guardian-{0,1,2,3,4}.webp`
- Create: `public/garden/first-light-effects.webp`

**Interfaces:**
- Consumes: approved visual direction and existing garden composition.
- Produces: 24 local image files with stable names for `gardenAssets.ts`.

- [ ] **Step 1: Generate the style reference in a fresh GPT Web chat**

Use this prompt without visible text:

```text
Create one original 16:10 game garden illustration for Change-Life OS. Warm Japanese storybook gouache combined with refined fantasy concept art, clean shapes, tactile paper grain, elegant but not childish. A tranquil valley garden divided naturally into four readable zones: still water and floating book pages at upper left; roots and living plants at upper right; wind ribbons and tiny lights at lower left; a winding path and small ember at lower right. Leave a calm central clearing for a small gender-neutral guardian. Palette anchored in deep forest green #143C2D, orange #DA8134, deep orange #9A3D1A, warm white and muted gold. No text, no UI, no logo, no scripture, no religious symbol, no photorealistic person, no copyrighted character. Front-facing game scene, layered depth, readable at mobile size.
```

- [ ] **Step 2: Generate two background masters using the selected reference**

Classic prompt: remove all guardian and growth motifs, retain dusk ambience and four empty readable planting zones. First Light prompt: same camera and geometry, sunrise sky, golden water, subtle moon/sun light, no objects that convey growth advantage.

- [ ] **Step 3: Generate transparent stage sheets**

Generate one four-stage transparent sheet per dimension and one five-stage guardian sheet. Require identical camera, footprint, lighting direction, and spacing between stages. The guardian progresses through detail and confidence only; its body identity and scale stay consistent.

- [ ] **Step 4: Prepare deterministic web assets**

Crop, remove only uniform backgrounds if required, resize the two backgrounds to 1600×1000 and transparent layers to a maximum 900×900 canvas, then encode lossless-alpha WebP. Do not redraw subjects. Verify each output with `file` and an image viewer.

- [ ] **Step 5: Commit the approved art pack**

```bash
git add public/garden outputs
git commit -m "assets: add generated life garden art pack"
```

### Task 2: Add a typed garden asset manifest

**Files:**
- Create: `app/gardenAssets.ts`
- Create: `app/gardenAssets.test.ts`

**Interfaces:**
- Consumes: `LifeDimension`, `GardenThemeId`, and `GardenState` from `app/domain.ts`.
- Produces: `growthVisualStage(value: number): 0 | 1 | 2 | 3`, `gardenBackground(theme)`, `dimensionAsset(dimension, value)`, `guardianAsset(stage)`, and `gardenLayerSpec(garden, theme)`.

- [ ] **Step 1: Write the failing boundary tests**

```ts
import { describe, expect, it } from "vitest";
import { dimensionAsset, gardenBackground, growthVisualStage, guardianAsset } from "./gardenAssets";

describe("gardenAssets", () => {
  it("maps permanent growth to four visual stages", () => {
    expect([0, 1, 2, 3, 4, 5, 12].map(growthVisualStage)).toEqual([0, 1, 1, 2, 2, 3, 3]);
  });

  it("returns stable local image paths", () => {
    expect(gardenBackground("classic")).toBe("/change-life-os/garden/classic-background.webp");
    expect(dimensionAsset("mind", 5)).toBe("/change-life-os/garden/mind-3.webp");
    expect(guardianAsset(4)).toBe("/change-life-os/garden/guardian-4.webp");
  });
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npx vitest run app/gardenAssets.test.ts --config vitest.config.ts`

Expected: FAIL because `app/gardenAssets.ts` does not exist.

- [ ] **Step 3: Implement the pure manifest**

```ts
import type { GardenState, GardenThemeId, LifeDimension } from "./domain";

const BASE = "/change-life-os/garden";
export type GrowthVisualStage = 0 | 1 | 2 | 3;

export const growthVisualStage = (value: number): GrowthVisualStage =>
  value <= 0 ? 0 : value <= 2 ? 1 : value <= 4 ? 2 : 3;

export const gardenBackground = (theme: GardenThemeId) =>
  `${BASE}/${theme === "first-light-garden" ? "first-light" : "classic"}-background.webp`;

export const dimensionAsset = (dimension: LifeDimension, value: number) =>
  `${BASE}/${dimension}-${growthVisualStage(value)}.webp`;

export const guardianAsset = (stage: GardenState["guardianStage"]) =>
  `${BASE}/guardian-${stage}.webp`;

export const gardenLayerSpec = (garden: GardenState, theme: GardenThemeId) => ({
  background: gardenBackground(theme),
  dimensions: (Object.keys(garden.growth) as LifeDimension[]).map((dimension) => ({
    dimension,
    src: dimensionAsset(dimension, garden.growth[dimension]),
  })),
  guardian: guardianAsset(garden.guardianStage),
  effects: theme === "first-light-garden" ? `${BASE}/first-light-effects.webp` : null,
});
```

- [ ] **Step 4: Run the focused test and verify pass**

Run: `npx vitest run app/gardenAssets.test.ts --config vitest.config.ts`

Expected: 3 tests PASS, including a filesystem existence assertion for every referenced asset.

- [ ] **Step 5: Commit the manifest**

```bash
git add app/gardenAssets.ts app/gardenAssets.test.ts
git commit -m "feat: map garden growth to generated assets"
```

### Task 3: Replace CSS drawings with image layers

**Files:**
- Modify: `app/GrowthGarden.tsx`
- Modify: `app/globals.css`
- Create: `app/GrowthGarden.test.tsx`

**Interfaces:**
- Consumes: `gardenLayerSpec(garden, theme)` from Task 2.
- Produces: a responsive `GardenScene` that renders one background, four dimension images, one guardian image, and an optional supporter-effects image.

- [ ] **Step 1: Write a failing component contract test**

Render `GrowthGarden` from an initial app state and assert:

```ts
expect(container.querySelectorAll(".garden-art-layer")).toHaveLength(6);
expect(container.querySelector(".garden-motif")).toBeNull();
expect(container.querySelector(".guardian-head")).toBeNull();
expect(screen.getByLabelText(copy.growth.gardenLabel)).toBeTruthy();
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npx vitest run app/GrowthGarden.test.tsx --config vitest.config.ts`

Expected: FAIL because the current component still renders CSS motifs.

- [ ] **Step 3: Replace the scene markup**

Render the manifest as decorative images:

```tsx
const theme = (themeOverride ?? garden.activeThemeId) as GardenThemeId;
const layers = gardenLayerSpec(garden, theme);

<figure className={`life-garden theme-${theme === "first-light-garden" ? "first-light" : "classic"}`} aria-label={copy.growth.gardenLabel}>
  <img className="garden-background" src={layers.background} alt="" />
  {layers.dimensions.map(({ dimension, src }) => (
    <img className={`garden-art-layer garden-layer-${dimension}`} src={src} alt="" key={dimension} />
  ))}
  <img className="garden-art-layer garden-guardian" src={layers.guardian} alt="" />
  {layers.effects && <img className="garden-effects" src={layers.effects} alt="" />}
  <div className="garden-label-grid">{/* existing localized labels and amounts */}</div>
  <figcaption>{/* existing total seed label */}</figcaption>
</figure>
```

- [ ] **Step 4: Replace drawing CSS with positioning CSS**

Keep `.life-garden`, labels, focus behavior, and responsive breakpoints. Delete `.garden-sky`, `.garden-sun`, `.garden-moon`, `.garden-water`, `.garden-landscape`, `.garden-motif`, `.guardian-head`, `.guardian-body`, `.guardian-halo`, and generated-particle pseudo-element rules. Add object-fit image layers with fixed percentage positions and opacity transitions; disable transitions under reduced motion.

- [ ] **Step 5: Run component and full client tests**

Run: `npx vitest run app/GrowthGarden.test.tsx app/gardenAssets.test.ts --config vitest.config.ts && npm run typecheck:client-core`

Expected: PASS with zero TypeScript errors.

- [ ] **Step 6: Commit the scene replacement**

```bash
git add app/GrowthGarden.tsx app/GrowthGarden.test.tsx app/globals.css
git commit -m "feat: render life garden from image layers"
```

### Task 4: Compose completion cards from the image manifest

**Files:**
- Modify: `app/completionCard.ts`
- Modify: `app/completionCard.test.ts`
- Modify: `app/GrowthGarden.tsx`

**Interfaces:**
- Consumes: `gardenLayerSpec(garden, theme)`.
- Produces: `createCompletionCardBlob(input): Promise<Blob>` and `downloadCompletionCard(blob, filename): void`.

- [ ] **Step 1: Update the privacy contract test**

Test a pure `completionCardSpec` first. Assert the spec contains only product/version, completion count, dates, locale, theme, and local image paths. Assert serialized output does not contain score keys, quest text, custom actions, vision, or reviews.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npx vitest run app/completionCard.test.ts --config vitest.config.ts`

Expected: FAIL because the current module returns SVG markup.

- [ ] **Step 3: Implement local Canvas composition**

Create a 1200×675 canvas, load all same-origin image paths, draw the background and current garden layers, add only the approved title, `7 / 14`, cycle dates, and product version, then return `canvas.toBlob(..., "image/png")`. Reject with a generic error if an image or Canvas export fails.

- [ ] **Step 4: Make the download handler asynchronous**

```ts
const downloadCard = async () => {
  if (!state.growth.cycle.startedOn || !state.growth.cycle.completedOn) return;
  const blob = await createCompletionCardBlob({
    startDate: state.growth.cycle.startedOn,
    endDate: state.growth.cycle.completedOn,
    garden: state.growth.garden,
    locale,
  });
  downloadCompletionCard(blob, `change-life-os-7-of-14-${state.growth.cycle.completedOn}.png`);
};
```

- [ ] **Step 5: Run privacy tests**

Run: `npx vitest run app/completionCard.test.ts --config vitest.config.ts`

Expected: PASS and no private gameplay keys in the serialised card specification.

- [ ] **Step 6: Commit completion-card integration**

```bash
git add app/completionCard.ts app/completionCard.test.ts app/GrowthGarden.tsx
git commit -m "feat: compose completion card from garden artwork"
```

### Task 5: Verify, visually QA, and deploy

**Files:**
- Modify only if QA reveals a scoped defect in the files from Tasks 2–4.

**Interfaces:**
- Consumes: completed local implementation.
- Produces: verified GitHub Pages deployment; Cloudflare Worker and Stripe production state remain unchanged.

- [ ] **Step 1: Run the production Pages gate**

Run: `npm run test:pages`

Expected: typecheck, Vitest suite, 10 Pages contract tests, and Pages production build all PASS.

- [ ] **Step 2: Run local browser QA**

At 390×844, tablet, and desktop, verify classic and First Light themes, stages 0–3, guardian 0–4, no horizontal overflow, no console errors, correct alt semantics, and reduced-motion behavior. Confirm the network log contains only same-origin static assets during play.

- [ ] **Step 3: Verify the completion card**

Generate one completed-cycle PNG locally and inspect it. Confirm it contains the new artwork, dates, `7 / 14`, and version only.

- [ ] **Step 4: Push and deploy through main**

Push the feature branch, open or update a pull request, merge after all checks pass, and verify the automatic `Deploy GitHub Pages` workflow concludes `success`.

- [ ] **Step 5: Verify the live surface**

Open `https://matthew-altx.github.io/change-life-os/`, verify HTTP 200 and visually inspect the deployed garden at 390px. Confirm checkout remains disabled and no Stripe/Worker request occurs.
