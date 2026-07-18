import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const app = fs.readFileSync("app/ChangeLifeOS.tsx", "utf8");
const styles = fs.readFileSync("app/globals.css", "utf8");
const guide = fs.readFileSync("app/GuideDialog.tsx", "utf8");
const i18n = fs.readFileSync("app/i18n.ts", "utf8");
const preferences = fs.readFileSync("app/uiPreferences.ts", "utf8");
const rootState = fs.readFileSync("app/rootState.ts", "utf8");
const storage = fs.readFileSync("app/storage.ts", "utf8");
const workflow = fs.readFileSync(".github/workflows/pages.yml", "utf8");
const viteConfig = fs.readFileSync("vite.pages.config.ts", "utf8");

const relativeLuminance = (hex) => hex
  .match(/[a-f\d]{2}/gi)
  .map((channel) => Number.parseInt(channel, 16) / 255)
  .map((channel) => channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4)
  .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);

const contrastRatio = (first, second) => {
  const luminance = [relativeLuminance(first), relativeLuminance(second)].sort((a, b) => b - a);
  return (luminance[0] + 0.05) / (luminance[1] + 0.05);
};

const cssHex = (token) => {
  const match = styles.match(new RegExp(`--${token}:\\s*(#[a-f\\d]{6})`, "i"));
  assert.ok(match, `Missing --${token} colour token`);
  return match[1];
};

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

test("GitHub Pages build uses the repository subpath", () => {
  assert.match(viteConfig, /GITHUB_REPOSITORY/);
  assert.match(viteConfig, /base: repositoryName/);
  assert.match(viteConfig, /dist-pages/);
});

test("public version keeps user data in browser storage", () => {
  assert.match(storage, /localStorage|Storage/);
  assert.doesNotMatch(storage, /fetch\(|XMLHttpRequest|google\.script\.run/);
});

test("public version ships a Cantonese-first bilingual interface", () => {
  assert.match(i18n, /"zh-HK"/);
  assert.match(i18n, /\ben\b/);
  assert.match(i18n, /Turn life into a game worth playing/);
  assert.match(app, /document\.documentElement\.lang/);
  assert.match(app, /aria-pressed/);
  assert.match(app, /useReducer\(rootReducer, initialRootState\)/);
  assert.match(rootState, /withLocale\(state\.preferences, action\.locale\)/);
});

test("UI preferences stay separate from life data", () => {
  assert.match(preferences, /changeLifeOSUi/);
  assert.doesNotMatch(preferences, /changeLifeOS(?:"|')/);
  assert.match(storage, /STORAGE_KEY = "changeLifeOS"/);
});

test("usage guide is reopenable from the main application", () => {
  assert.match(app, /copy\.utility\.guide/);
  assert.match(app, /setGuideOpen\(true\)/);
});

test("Editorial Focus shell keeps utilities and responsive guidance in the content area", () => {
  assert.match(app, /<div className="main-wrap">\s*<header className="top-utility">/);
  assert.match(styles, /--canvas: #F5F1E8/);
  assert.match(styles, /--muted: #58675F/);
  assert.match(styles, /:focus-visible \{ outline: 3px solid var\(--deep-orange\)/);
  assert.match(styles, /\.human-grid \{[^}]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(styles, /\.score-row \{[^}]*grid-template-columns: repeat\(5, minmax\(44px, 1fr\)\)/);
  assert.match(styles, /\.score-row button \{[^}]*min-width: 44px;[^}]*min-height: 44px/);
  const tabletShell = cssBlock(styles, "@media (max-width: 900px)");
  const mobileStack = cssBlock(styles, "@media (max-width: 700px)");
  assert.match(tabletShell, /\.sidebar \{ display: none; \}/);
  assert.match(tabletShell, /\.mobile-nav \{[^}]*display: grid/);
  assert.match(mobileStack, /\.human-grid \{ grid-template-columns: 1fr; \}/);
  assert.match(styles, /\.sidebar nav button\.active \{[^}]*border-left: 3px solid var\(--orange\)/);
  assert.match(styles, /\.sidebar nav button\.active span \{ color: var\(--orange\); \}/);
  assert.match(styles, /\.mobile-nav button\.active \{[^}]*var\(--orange\)/);
  assert.match(styles, /\.mobile-nav button\.active span \{ color: var\(--orange\); \}/);
  assert.doesNotMatch(styles, /\.(?:sidebar nav button|mobile-nav button)\.active(?: span)? \{[^}]*var\(--gold\)/);
  assert.match(styles, /\.capture \.button \{[^}]*min-width: 104px;[^}]*white-space: nowrap;[^}]*word-break: normal;[^}]*overflow-wrap: normal/);
  assert.match(styles, /\.capture \{ min-width: 0; width: 100%; display: grid; grid-template-columns: minmax\(0, 1fr\) auto; \}/);
  assert.match(styles, /\.detox-card \.card-kicker small \{ color: #DCE7E1; \}/);
  assert.match(styles, /\.detox-card label span \{ color: #ED974C;/);
  assert.doesNotMatch(styles, /\.detox-card[^{]*\{[^}]*var\(--gold\)/);
  assert.match(styles, /\.sidebar :focus-visible, \.onboarding-utility :focus-visible, \.vision-card\.dark :focus-visible, \.detox-card :focus-visible \{ outline-color: var\(--white\); \}/);
  assert.ok(contrastRatio(cssHex("white"), cssHex("green")) >= 3, "Dark-surface focus outline needs at least 3:1 contrast");
  assert.doesNotMatch(styles, /\.guide-list/);
  assert.match(styles, /\.guide-modal \{[^}]*height: 100dvh/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(styles, /gradient\(/);
});

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

test("contextual guide is keyboard accessible and reopenable", () => {
  assert.match(guide, /role="dialog"/);
  assert.match(guide, /aria-modal="true"/);
  assert.match(guide, /event\.key === "Escape"/);
  assert.match(guide, /event\.key !== "Tab"/);
  assert.match(guide, /event\.shiftKey/);
  assert.match(guide, /focus\(\)/);
  assert.match(guide, /previouslyFocused/);
  assert.match(guide, /copy\.guide\.modules\[screen\]/);
  assert.match(guide, /event\.target === event\.currentTarget/);
  assert.match(app, /setGuideOpen\(true\)/);
  assert.match(app, /type: "set-guide-seen"/);
  assert.match(app, /if \(!storedPreferences\.guideSeen\)/);
  assert.match(app, /setGuideMode\("orientation"\)/);
  assert.match(app, /setGuideMode\("module"\)/);
  assert.match(app, /id="screen-title" tabIndex=\{-1\}/);
  assert.match(rootState, /case "set-guide-seen"/);
});

test("workflow has least-privilege GitHub Pages deployment permissions", () => {
  assert.match(workflow, /contents: read/);
  assert.match(workflow, /pages: write/);
  assert.match(workflow, /id-token: write/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
});
