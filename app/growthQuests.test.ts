import { describe, expect, it } from "vitest";
import { LIFE_DIMENSIONS } from "./domain";
import { GROWTH_QUESTS, growthQuestsFor, pickGrowthQuest } from "./growthQuests";

describe("growth quest library", () => {
  it("contains exactly 56 unique bilingual quests", () => {
    expect(GROWTH_QUESTS).toHaveLength(56);
    expect(new Set(GROWTH_QUESTS.map((item) => item.id)).size).toBe(56);
    GROWTH_QUESTS.forEach((item) => {
      expect(item.title["zh-HK"].trim()).not.toBe("");
      expect(item.title.en.trim()).not.toBe("");
      expect(item.doneWhen["zh-HK"].trim()).not.toBe("");
      expect(item.doneWhen.en.trim()).not.toBe("");
    });
  });

  it("provides seven short and seven medium quests for every dimension", () => {
    LIFE_DIMENSIONS.forEach((dimension) => {
      expect(growthQuestsFor(dimension, "short")).toHaveLength(7);
      expect(growthQuestsFor(dimension, "medium")).toHaveLength(7);
    });
  });

  it("selects the same daily quest deterministically", () => {
    expect(pickGrowthQuest("mind", "short", "2026-07-19").id).toBe(
      pickGrowthQuest("mind", "short", "2026-07-19").id,
    );
  });
});
