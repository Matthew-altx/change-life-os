import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const code = await readFile(new URL("../google-app/Code.gs", import.meta.url), "utf8");
const repository = await readFile(new URL("../google-app/Repository.gs", import.meta.url), "utf8");
const manifest = JSON.parse(await readFile(new URL("../google-app/appsscript.json", import.meta.url), "utf8"));

test("every state operation verifies Firebase identity", () => {
  assert.match(code, /function bootstrap\(idToken\)[\s\S]*?verifyFirebaseToken_\(idToken\)/);
  assert.match(code, /function saveSnapshot\(idToken, state, expectedVersion\)[\s\S]*?verifyFirebaseToken_\(idToken\)/);
  assert.match(code, /function markGuideCompleted\(idToken\)[\s\S]*?verifyFirebaseToken_\(idToken\)/);
  assert.match(code, /identitytoolkit\.googleapis\.com\/v1\/accounts:lookup/);
});

test("writes use lock, optimistic versions and rollback", () => {
  assert.match(code, /LockService\.getScriptLock\(\)/);
  assert.match(code, /tryLock\(10000\)/);
  assert.match(code, /VERSION_CONFLICT/);
  assert.match(repository, /captureUserRows_/);
  assert.match(repository, /restoreUserRows_/);
  assert.match(repository, /ROLLBACK_FAILED/);
});

test("repository defines all approved tabs and ownership columns", () => {
  for (const tab of ["Users", "Profiles", "Daily", "Quests", "Content", "Reset", "Audit"]) {
    assert.match(repository, new RegExp(`\\b${tab}\\b`));
  }
  assert.match(repository, /uidColumn:\s*1/);
  assert.match(repository, /uidColumn:\s*2/);
});

test("manifest is Hong Kong scoped and minimally privileged", () => {
  assert.equal(manifest.timeZone, "Asia/Hong_Kong");
  assert.equal(manifest.runtimeVersion, "V8");
  assert.ok(manifest.oauthScopes.includes("https://www.googleapis.com/auth/spreadsheets"));
  assert.ok(manifest.oauthScopes.includes("https://www.googleapis.com/auth/script.external_request"));
  assert.ok(!manifest.oauthScopes.some((scope) => scope.includes("drive")));
});
