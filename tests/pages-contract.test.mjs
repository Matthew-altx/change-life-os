import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const app = fs.readFileSync("app/ChangeLifeOS.tsx", "utf8");
const i18n = fs.readFileSync("app/i18n.ts", "utf8");
const preferences = fs.readFileSync("app/uiPreferences.ts", "utf8");
const rootState = fs.readFileSync("app/rootState.ts", "utf8");
const storage = fs.readFileSync("app/storage.ts", "utf8");
const workflow = fs.readFileSync(".github/workflows/pages.yml", "utf8");
const viteConfig = fs.readFileSync("vite.pages.config.ts", "utf8");

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
  assert.match(app, /copy\.guide\.orientation/);
  assert.match(app, /copy\.utility\.guide/);
  assert.match(app, /setGuideOpen\(true\)/);
});

test("workflow has least-privilege GitHub Pages deployment permissions", () => {
  assert.match(workflow, /contents: read/);
  assert.match(workflow, /pages: write/);
  assert.match(workflow, /id-token: write/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
});
