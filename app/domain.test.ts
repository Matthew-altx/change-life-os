import { describe, expect, it } from "vitest";
import {
  calculateProgress,
  calculateStreak,
  completeQuest,
  isPiaReady,
  questXp,
} from "./domain";
import type { Quest } from "./domain";

const quest = (overrides: Partial<Quest>): Quest => ({
  id: "q1",
  title: "推出 MVP",
  type: "main",
  skill: "writing",
  completed: false,
  createdAt: "2026-07-17",
  ...overrides,
});

describe("quest progression", () => {
  it("awards XP by quest type", () => {
    expect(questXp("side")).toBe(20);
    expect(questXp("main")).toBe(50);
    expect(questXp("boss")).toBe(100);
  });

  it("derives level and skill progress from completed quests", () => {
    const quests = Array.from({ length: 5 }, (_, index) =>
      quest({ id: `b${index}`, type: "boss", completed: true }),
    );
    expect(calculateProgress(quests)).toEqual({
      lifetimeXp: 500,
      level: 2,
      levelXp: 0,
      skills: { writing: 500, speaking: 0, marketing: 0, sales: 0 },
    });
  });

  it("makes completion reversible without XP drift", () => {
    const completed = completeQuest([quest({})], "q1");
    expect(completed[0].completed).toBe(true);
    expect(calculateProgress(completed).lifetimeXp).toBe(50);
    const reversed = completeQuest(completed, "q1");
    expect(reversed[0].completed).toBe(false);
    expect(calculateProgress(reversed).lifetimeXp).toBe(0);
  });
});

describe("daily systems", () => {
  it("counts only consecutive active days ending today", () => {
    expect(
      calculateStreak(
        ["2026-07-17", "2026-07-16", "2026-07-14"],
        "2026-07-17",
      ),
    ).toBe(2);
  });

  it("requires non-whitespace Pain, Insight and Action", () => {
    expect(isPiaReady({ pain: "拖延", insight: " ", action: "先做 10 分鐘" })).toBe(false);
    expect(isPiaReady({ pain: "拖延", insight: "阻力來自模糊", action: "先做 10 分鐘" })).toBe(true);
  });
});
