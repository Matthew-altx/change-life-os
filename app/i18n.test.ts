import { describe, expect, it } from "vitest";
import { COPY, formatDate, getCopy, normalizeLocale } from "./i18n";

const structuralShape = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(structuralShape);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, structuralShape(child)]),
    );
  }
  return typeof value;
};

const functionPaths = (value: unknown, path: string[] = []): string[] => {
  if (typeof value === "function") return [path.join(".")];
  if (Array.isArray(value)) {
    return value.flatMap((child, index) => functionPaths(child, [...path, String(index)]));
  }
  if (value !== null && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) =>
      functionPaths(child, [...path, key]),
    );
  }
  return [];
};

describe("locale copy", () => {
  it("falls back to Cantonese for unsupported values", () => {
    expect(normalizeLocale("zh-HK")).toBe("zh-HK");
    expect(normalizeLocale("en")).toBe("en");
    expect(normalizeLocale("fr")).toBe("zh-HK");
    expect(normalizeLocale(null)).toBe("zh-HK");
  });

  it("keeps both dictionaries structurally identical", () => {
    expect(Object.keys(COPY.en)).toEqual(Object.keys(COPY["zh-HK"]));
    expect(Object.keys(COPY.en.nav)).toEqual(Object.keys(COPY["zh-HK"].nav));
    expect(Object.keys(COPY.en.guide.modules)).toEqual(
      Object.keys(COPY["zh-HK"].guide.modules),
    );
    expect(structuralShape(COPY.en)).toEqual(structuralShape(COPY["zh-HK"]));
    expect(Object.isFrozen(COPY)).toBe(true);
  });

  it("returns complete language-specific core labels", () => {
    expect(getCopy("zh-HK").nav.today).toBe("今日");
    expect(getCopy("en").nav.today).toBe("Today");
    expect(getCopy("zh-HK").guide.why).toBe("點解做");
    expect(getCopy("en").guide.doneWhen).toBe("Done when");
  });

  it("owns the complete current interface copy", () => {
    const zh = getCopy("zh-HK");
    const en = getCopy("en");

    expect(zh.onboarding.steps).toHaveLength(4);
    expect(zh.human.mind.prompt).toBe("今日思緒有幾清晰？");
    expect(zh.vision.fields.ninetyDayOutcome.title).toBe("今季唯一勝利");
    expect(zh.today.timer.running).toBe("而家只需要留喺呢一件事。");
    expect(zh.today.timer.presetLabel(25)).toBe("25m");
    expect(zh.content.stages.sell.note).toBe("轉成價值");
    expect(zh.content.pia.action.help).toBe("讀完之後下一步做咩");
    expect(zh.resetPage.review.winPlaceholder(2)).toBe("2. 今日有咩值得保留？");
    expect(zh.resetPage.protocol.steps).toHaveLength(4);
    expect(zh.resetPage.detox.title).toContain("Monk Mode");
    expect(zh.notices.backupRestored).toBe("備份已成功還原。");
    expect(zh.confirmations.clearAll).toContain("無法復原");

    const zhOrientation = zh.guide.orientation.map(({ title, body }) => `${title} ${body}`);
    expect(zhOrientation[0]).toMatch(/90 日.*Boss Fight/);
    expect(zhOrientation[1]).toContain("每日唯一優先");
    expect(zhOrientation[2]).toContain("專注工作");
    expect(zhOrientation[3]).toMatch(/Learn.*Teach.*Sell.*PIA/);
    expect(zhOrientation[4]).toContain("3-2-1 復盤");

    expect(en.onboarding.steps).toHaveLength(4);
    expect(en.human.mind.prompt).toBe("How clear is your mind today?");
    expect(en.today.timer.presetLabel(90)).toBe("90m");
    expect(en.today.humanEyebrow).toBe("HUMAN 3.0");
    expect(en.today.humanTitle).toBe("Four-dimensional check-in");
    expect(en.guide.acknowledge).toBe("Got it");
    expect(en.guide.start).toBe("Start now");

    const orientation = en.guide.orientation.map(({ title, body }) => `${title} ${body}`);
    expect(orientation).toHaveLength(5);
    expect(orientation[0]).toMatch(/90-day.*Boss Fight/i);
    expect(orientation[1]).toMatch(/daily priority/i);
    expect(en.guide.orientation[1].body).toContain("Finish the highest-leverage action");
    expect(orientation[2]).toMatch(/focused work session/i);
    expect(orientation[3]).toMatch(/Learn.*Teach.*Sell.*PIA/);
    expect(orientation[4]).toMatch(/3-2-1 review/i);
    expect(en.content.pia.action.help).toContain("next");
    expect(en.resetPage.detox.title).toContain("Monk Mode");
  });

  it("smoke-tests every dynamic label helper", () => {
    const expectedPaths = [
      "growth.cycleProgress",
      "growth.cycleWindow",
      "growth.guardianHud",
      "growth.guardianLabel",
      "guide.moduleTab",
      "guide.moduleTitle",
      "human.scoreLabel",
      "onboarding.stepProgress",
      "quests.typeOption",
      "resetPage.review.lessonPlaceholder",
      "resetPage.review.winPlaceholder",
      "today.levelLabel",
      "today.streak",
      "today.timer.presetLabel",
      "today.xpRemaining",
    ];

    expect(functionPaths(COPY["zh-HK"]).sort()).toEqual(expectedPaths);
    expect(functionPaths(COPY.en).sort()).toEqual(expectedPaths);

    expect([
      COPY["zh-HK"].onboarding.stepProgress(2, 4),
      COPY["zh-HK"].today.levelLabel(3),
      COPY["zh-HK"].today.xpRemaining(120),
      COPY["zh-HK"].today.streak(7),
      COPY["zh-HK"].today.timer.presetLabel(25),
      COPY["zh-HK"].quests.typeOption("主線", 50),
      COPY["zh-HK"].resetPage.review.winPlaceholder(1),
      COPY["zh-HK"].resetPage.review.lessonPlaceholder(2),
      COPY["zh-HK"].human.scoreLabel("心智", 4),
      COPY["zh-HK"].guide.moduleTab("今日"),
      COPY["zh-HK"].guide.moduleTitle("今日"),
      COPY["zh-HK"].growth.cycleProgress(4),
      COPY["zh-HK"].growth.cycleWindow("2026-07-19", "2026-08-01"),
      COPY["zh-HK"].growth.guardianLabel(2),
      COPY["zh-HK"].growth.guardianHud(2),
    ]).toEqual([
      "第 2 步，共 4 步",
      "LEVEL 3",
      "距離下一級仲有 120 XP",
      "7 日連續行動",
      "25m",
      "主線 · 50 XP",
      "1. 今日有咩值得保留？",
      "2. 今日學到咩？",
      "心智 4 分",
      "今日指南",
      "今日：點解做、點做、完成標準",
      "今輪 4 / 7 粒生命種子",
      "2026-07-19 至 2026-08-01",
      "守護靈成長階段 2 / 4",
      "守護靈 2 / 4",
    ]);

    expect([
      COPY.en.onboarding.stepProgress(2, 4),
      COPY.en.today.levelLabel(3),
      COPY.en.today.xpRemaining(120),
      COPY.en.today.streak(7),
      COPY.en.today.timer.presetLabel(25),
      COPY.en.quests.typeOption("Main", 50),
      COPY.en.resetPage.review.winPlaceholder(1),
      COPY.en.resetPage.review.lessonPlaceholder(2),
      COPY.en.human.scoreLabel("Mind", 4),
      COPY.en.guide.moduleTab("Today"),
      COPY.en.guide.moduleTitle("Today"),
      COPY.en.growth.guardianHud(2),
    ]).toEqual([
      "Step 2 of 4",
      "LEVEL 3",
      "120 XP to the next level",
      "7-day action streak",
      "25m",
      "Main · 50 XP",
      "1. What from today is worth keeping?",
      "2. What did you learn today?",
      "Mind: 4 points",
      "Today guide",
      "Today: why, how and done when",
      "Guardian 2 / 4",
    ]);
  });

  it("formats dates using the active locale", () => {
    const date = new Date(2026, 6, 18, 12);
    const zhDate = formatDate("zh-HK", date);
    const enDate = formatDate("en", date);

    expect(zhDate).toMatch(/7月|七月/);
    expect(zhDate).toMatch(/18/);
    expect(zhDate).toMatch(/星期六|週六|周六/);
    expect(enDate).toMatch(/July/);
    expect(enDate).toMatch(/18/);
    expect(enDate).toMatch(/Saturday/);
  });
});
