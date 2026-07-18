import { describe, expect, it } from "vitest";
import { createInitialState } from "./domain";
import {
  UI_PREFERENCES_KEY,
  loadUiPreferences,
  saveUiPreferences,
  withLocale,
} from "./uiPreferences";

describe("UI preferences", () => {
  it("defaults to Cantonese and an unseen guide", () => {
    let key = "";
    expect(
      loadUiPreferences({
        getItem: (nextKey) => {
          key = nextKey;
          return null;
        },
      }),
    ).toEqual({
      locale: "zh-HK",
      guideSeen: false,
    });
    expect(key).toBe(UI_PREFERENCES_KEY);
  });

  it("restores only supported values", () => {
    const storage = {
      getItem: () => JSON.stringify({ locale: "en", guideSeen: true }),
    };
    expect(loadUiPreferences(storage)).toEqual({ locale: "en", guideSeen: true });

    const invalid = {
      getItem: () => JSON.stringify({ locale: "fr", guideSeen: "yes" }),
    };
    expect(loadUiPreferences(invalid)).toEqual({
      locale: "zh-HK",
      guideSeen: false,
    });
  });

  it.each([
    ["malformed JSON", "{"],
    ["null", "null"],
    ["number", "42"],
    ["string", '"en"'],
    ["array", '["en", true]'],
  ])("falls back safely for %s", (_fixture, raw) => {
    expect(loadUiPreferences({ getItem: () => raw })).toEqual({
      locale: "zh-HK",
      guideSeen: false,
    });
  });

  it("survives read and write failures", () => {
    expect(
      loadUiPreferences({
        getItem: () => {
          throw new Error("blocked");
        },
      }),
    ).toEqual({ locale: "zh-HK", guideSeen: false });
    expect(
      saveUiPreferences(
        {
          setItem: () => {
            throw new Error("full");
          },
        },
        { locale: "en", guideSeen: true },
      ),
    ).toBe(false);
  });

  it("writes only the dedicated UI key", () => {
    let key = "";
    let value = "";
    expect(
      saveUiPreferences(
        {
          setItem: (nextKey, nextValue) => {
            key = nextKey;
            value = nextValue;
          },
        },
        { locale: "en", guideSeen: true },
      ),
    ).toBe(true);
    expect(key).toBe(UI_PREFERENCES_KEY);
    expect(JSON.parse(value)).toEqual({ locale: "en", guideSeen: true });
  });

  it("writes only canonical preference fields", () => {
    let value = "";
    const preferences = Object.assign(
      { locale: "en" as const, guideSeen: true },
      { extra: "must not persist" },
    );

    expect(
      saveUiPreferences(
        {
          setItem: (_key, nextValue) => {
            value = nextValue;
          },
        },
        preferences,
      ),
    ).toBe(true);
    expect(JSON.parse(value)).toEqual({ locale: "en", guideSeen: true });
  });

  it("changes only locale without mutating preferences or life data", () => {
    const current = Object.freeze({ locale: "zh-HK" as const, guideSeen: true });
    const lifeState = createInitialState("2026-07-18");
    lifeState.profile.antiVision = "唔想再停滯 / no more drift";
    lifeState.profile.vision = "Build 自由生活";
    lifeState.dailyPriority.text = "Call 陳先生 at 3pm";
    lifeState.quests.push({
      id: "mixed-quest",
      title: "完成 proposal 草稿",
      type: "main",
      skill: "writing",
      completed: false,
      createdAt: "2026-07-18",
    });
    lifeState.contentItems.push({
      id: "mixed-content",
      title: "香港客戶 onboarding notes",
      stage: "learn",
      pain: "流程太散 / too fragmented",
      insight: "先固定 one next action",
      action: "明早 publish v1",
    });
    lifeState.reviews.push({
      date: "2026-07-18",
      wins: ["完成訪談", "Shipped draft", "保留專注時間"],
      lessons: ["少即是多", "Ask before assuming"],
      intention: "聽朝 finish English outline",
    });
    const lifeStateReference = lifeState;
    const lifeStateSnapshot = structuredClone(lifeState);

    const next = withLocale(current, "en");

    expect(next).toEqual({ locale: "en", guideSeen: true });
    expect(next).not.toBe(current);
    expect(current).toEqual({ locale: "zh-HK", guideSeen: true });
    expect(lifeState).toBe(lifeStateReference);
    expect(lifeState).toEqual(lifeStateSnapshot);
    expect(lifeState.dailyPriority.text).toBe("Call 陳先生 at 3pm");
    expect(lifeState.quests[0]?.title).toBe("完成 proposal 草稿");
    expect(lifeState.contentItems[0]?.title).toBe("香港客戶 onboarding notes");
    expect(lifeState.reviews[0]?.intention).toBe("聽朝 finish English outline");
  });
});
