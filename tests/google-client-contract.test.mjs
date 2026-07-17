import assert from "node:assert/strict";
import { parse } from "@babel/parser";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../google-app/App.html", import.meta.url), "utf8");
const index = await readFile(new URL("../google-app/Index.html", import.meta.url), "utf8");
const styles = await readFile(new URL("../google-app/Styles.html", import.meta.url), "utf8");

test("client JSX parses successfully", () => {
  assert.doesNotThrow(() => parse(app, { sourceType: "script", plugins: ["jsx"] }));
});

test("uses Firebase Google login and fresh tokens for Apps Script RPC", () => {
  assert.match(app, /GoogleAuthProvider/);
  assert.match(app, /signInWithPopup/);
  assert.match(app, /getIdToken\(true\)/);
  assert.match(app, /google\.script\.run/);
  assert.match(index, /window\.FIREBASE_CONFIG/);
});

test("includes all OS destinations and a reopenable guide", () => {
  for (const label of ["今日", "願景", "任務", "內容", "重置", "指南"]) assert.match(app, new RegExp(label));
  for (const guideText of ["反願景", "唯一優先", "深度工作", "Learn", "3-2-1"]) assert.match(app, new RegExp(guideText));
});

test("implements explicit sync and conflict states", () => {
  for (const state of ["syncing", "saved", "offline", "conflict", "error"]) assert.match(app, new RegExp(`\\b${state}\\b`));
  assert.match(app, /VERSION_CONFLICT/);
  assert.match(app, /使用雲端版本/);
  assert.match(app, /以本機版本覆蓋/);
  assert.match(app, /localStorage/);
});

test("is safe to embed and mobile responsive", () => {
  assert.match(index, /width=device-width/);
  assert.match(index, /target="_blank"/);
  assert.match(styles, /@media\s*\(max-width:\s*760px\)/);
  assert.match(styles, /overflow-x:\s*hidden/);
  assert.match(styles, /min-height:\s*44px/);
});
