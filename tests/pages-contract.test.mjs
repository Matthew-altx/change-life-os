import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const app = fs.readFileSync("app/ChangeLifeOS.tsx", "utf8");
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

test("usage guide is reopenable from the main application", () => {
  assert.match(app, /GUIDE_STEPS/);
  assert.match(app, /使用指南/);
  assert.match(app, /setGuideOpen\(true\)/);
});

test("workflow has least-privilege GitHub Pages deployment permissions", () => {
  assert.match(workflow, /contents: read/);
  assert.match(workflow, /pages: write/);
  assert.match(workflow, /id-token: write/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
});
