import { describe, expect, it } from "vitest";
import { createInitialState } from "./domain";
import { initialRootState, rootReducer, type RootState } from "./rootState";

const deepFreeze = <Value>(value: Value): Value => {
  if (value && typeof value === "object") {
    Object.values(value).forEach((item) => deepFreeze(item));
    Object.freeze(value);
  }
  return value;
};

const representativeAppState = () => {
  const appState = createInitialState("2026-07-18");
  appState.profile.antiVision = "唔想再停滯 / no more drift";
  appState.profile.vision = "Build 自由生活";
  appState.dailyPriority.text = "Call 陳先生 at 3pm";
  appState.quests.push({
    id: "mixed-quest",
    title: "完成 proposal 草稿",
    type: "main",
    skill: "writing",
    completed: false,
    createdAt: "2026-07-18",
  });
  appState.contentItems.push({
    id: "mixed-content",
    title: "香港客戶 onboarding notes",
    stage: "learn",
    pain: "流程太散 / too fragmented",
    insight: "先固定 one next action",
    action: "明早 publish v1",
  });
  appState.reviews.push({
    date: "2026-07-18",
    wins: ["完成訪談", "Shipped draft", "保留專注時間"],
    lessons: ["少即是多", "Ask before assuming"],
    intention: "聽朝 finish English outline",
  });
  return deepFreeze(appState);
};

describe("root state transitions", () => {
  it("changes locale without touching representative user data", () => {
    const appState = representativeAppState();
    const snapshot = structuredClone(appState);
    const preferences = Object.freeze({ locale: "zh-HK" as const, guideSeen: true });
    const state: RootState = { appState, preferences };

    const next = rootReducer(state, { type: "set-locale", locale: "en" });

    expect(next.appState).toBe(appState);
    expect(next.appState).toEqual(snapshot);
    expect(next.preferences).toEqual({ locale: "en", guideSeen: true });
    expect(next.preferences).not.toBe(preferences);
    expect(preferences).toEqual({ locale: "zh-HK", guideSeen: true });
    expect(next.appState.dailyPriority.text).toBe("Call 陳先生 at 3pm");
    expect(next.appState.quests[0]?.title).toBe("完成 proposal 草稿");
    expect(next.appState.contentItems[0]?.title).toBe("香港客戶 onboarding notes");
    expect(next.appState.reviews[0]?.intention).toBe("聽朝 finish English outline");
  });

  it("updates app state without changing preferences", () => {
    const appState = createInitialState("2026-07-18");
    const preferences = Object.freeze({ locale: "en" as const, guideSeen: true });
    const state: RootState = { appState, preferences };

    const next = rootReducer(state, {
      type: "update-app",
      update: (current) => ({
        ...current,
        dailyPriority: { ...current.dailyPriority, text: "Ship 今日版本" },
      }),
    });

    expect(next.appState).not.toBe(appState);
    expect(next.appState.dailyPriority.text).toBe("Ship 今日版本");
    expect(next.preferences).toBe(preferences);
  });

  it("marks the guide as seen without changing locale or user data", () => {
    const appState = representativeAppState();
    const snapshot = structuredClone(appState);
    const preferences = Object.freeze({ locale: "en" as const, guideSeen: false });
    const state: RootState = { appState, preferences };

    const next = rootReducer(state, {
      type: "set-guide-seen",
      guideSeen: true,
    });

    expect(next.appState).toBe(appState);
    expect(next.appState).toEqual(snapshot);
    expect(next.preferences).toEqual({ locale: "en", guideSeen: true });
    expect(next.preferences).not.toBe(preferences);
    expect(preferences).toEqual({ locale: "en", guideSeen: false });
  });

  it("hydrates app state and preferences together", () => {
    const appState = representativeAppState();
    const preferences = Object.freeze({ locale: "en" as const, guideSeen: true });

    const next = rootReducer(initialRootState, {
      type: "hydrate",
      appState,
      preferences,
    });

    expect(next).toEqual({ appState, preferences });
    expect(next.appState).toBe(appState);
    expect(next.preferences).toBe(preferences);
  });
});
