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
    expect(zh.content.stages.sell.note).toBe("轉成價值");
    expect(zh.content.pia.action.help).toBe("讀完之後下一步做咩");
    expect(zh.resetPage.review.winPlaceholder(2)).toBe("2. 今日有咩值得保留？");
    expect(zh.resetPage.protocol.steps).toHaveLength(4);
    expect(zh.resetPage.detox.title).toContain("Monk Mode");
    expect(zh.notices.backupRestored).toBe("備份已成功還原。");
    expect(zh.confirmations.clearAll).toContain("無法復原");

    expect(en.onboarding.steps).toHaveLength(4);
    expect(en.human.mind.prompt).toBe("How clear is your mind today?");
    expect(en.content.pia.action.help).toContain("next");
    expect(en.resetPage.detox.title).toContain("Monk Mode");
  });

  it("formats dates using the active locale", () => {
    const date = new Date("2026-07-18T04:00:00.000Z");
    expect(formatDate("zh-HK", date)).toMatch(/7月|七月/);
    expect(formatDate("en", date)).toMatch(/July/);
  });
});
