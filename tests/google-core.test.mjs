import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const source = await readFile(new URL("../google-app/Core.js", import.meta.url), "utf8");
const context = {};
vm.createContext(context);
vm.runInContext(source, context);
const core = context.GoogleCore;

const today = "2026-07-17";
const now = "2026-07-17T12:00:00.000Z";

function sampleState() {
  return {
    version: 1,
    profile: {
      antiVision: "困喺冇成長嘅工作",
      vision: "每日做四小時高價值工作",
      niche: "幫香港人建立一人公司",
      ninetyDayOutcome: "推出第一個產品",
      bossFight: "公開預售頁",
      onboarded: true,
    },
    humanScores: { mind: 4, body: 3, spirit: 4, vocation: 5, updatedAt: today },
    dailyPriority: { date: today, text: "完成 Apps Script", completed: false },
    quests: [{ id: "q1", title: "推出 MVP", type: "main", skill: "marketing", completed: false, createdAt: today }],
    contentItems: [{ id: "c1", title: "心理熵", stage: "idea", pain: "迷失", insight: "注意力失序", action: "寫低唯一目標" }],
    reviews: [{ date: today, wins: ["開始", "聚焦", "完成"], lessons: ["先做核心", "保持簡單"], intention: "完成部署" }],
    resetPlan: { commitments: ["每日步行"], startDate: today, completedDays: [], resetSteps: [true, false, false, false] },
    activeDates: [today],
    timer: { durationSeconds: 3000, remainingSeconds: 2700, runningSince: null },
  };
}

test("accepts a complete valid state", () => {
  assert.equal(core.validateState(sampleState()), true);
});

test("rejects enum, length and count tampering", () => {
  const enumState = sampleState();
  enumState.quests[0].type = "admin";
  assert.throws(() => core.validateState(enumState), /VALIDATION_ERROR/);

  const titleState = sampleState();
  titleState.quests[0].title = "x".repeat(301);
  assert.throws(() => core.validateState(titleState), /VALIDATION_ERROR/);

  const countState = sampleState();
  countState.contentItems = Array.from({ length: 501 }, (_, index) => ({ ...sampleState().contentItems[0], id: `c${index}` }));
  assert.throws(() => core.validateState(countState), /VALIDATION_ERROR/);
});

test("requires a verified enabled Firebase user", () => {
  assert.deepEqual(
    JSON.parse(JSON.stringify(core.validateTokenUser({ localId: "uid-a", email: "a@example.com", emailVerified: true, displayName: "A" }))),
    { uid: "uid-a", email: "a@example.com", displayName: "A", photoUrl: "" },
  );
  assert.throws(() => core.validateTokenUser({ localId: "uid-a", email: "a@example.com", emailVerified: false }), /VALIDATION_ERROR/);
  assert.throws(() => core.validateTokenUser({ localId: "uid-a", email: "a@example.com", emailVerified: true, disabled: true }), /VALIDATION_ERROR/);
});

test("maps every owned row to the verified uid", () => {
  const rows = core.toSheetRows("verified-uid", sampleState(), now);
  assert.equal(rows.profile[0][0], "verified-uid");
  assert.ok(rows.daily.every((row) => row[0] === "verified-uid"));
  assert.ok(rows.quests.every((row) => row[1] === "verified-uid"));
  assert.ok(rows.content.every((row) => row[1] === "verified-uid"));
  assert.equal(rows.reset[0][0], "verified-uid");
});

test("round-trips normalized rows without losing OS data", () => {
  const state = sampleState();
  const rows = core.toSheetRows("verified-uid", state, now);
  const restored = core.fromSheetRows(rows, today);
  assert.deepEqual(JSON.parse(JSON.stringify(restored.profile)), state.profile);
  assert.deepEqual(JSON.parse(JSON.stringify(restored.quests)), state.quests);
  assert.deepEqual(JSON.parse(JSON.stringify(restored.contentItems)), state.contentItems);
  assert.deepEqual(JSON.parse(JSON.stringify(restored.reviews)), state.reviews);
  assert.deepEqual(JSON.parse(JSON.stringify(restored.resetPlan)), state.resetPlan);
  assert.deepEqual(JSON.parse(JSON.stringify(restored.activeDates)), state.activeDates);
});
