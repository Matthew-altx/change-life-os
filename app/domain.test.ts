import { describe, expect, it } from "vitest";
import {
  calculateProgress,
  calculateStreak,
  completeDailyGrowth,
  completeQuest,
  createInitialGrowthState,
  guardianStageForSeeds,
  isPiaReady,
  questXp,
  rotateGrowthCycle,
  saveDailyCheckIn,
  suggestLifeDimension,
} from "./domain";
import type { DailyCheckIn, Quest } from "./domain";

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

const checkIn = (overrides: Partial<DailyCheckIn> = {}): DailyCheckIn => ({
  date: "2026-07-19",
  scores: { mind: 2, body: 3, spirit: 3, vocation: 4 },
  suggestedDimension: "mind",
  selectedDimension: "mind",
  questChoice: "short",
  questId: "mind-short-1",
  customAction: "",
  completedAt: null,
  ...overrides,
});

describe("growth system", () => {
  it("suggests by score, garden growth, least recent use, then fixed order", () => {
    expect(suggestLifeDimension(
      { mind: 2, body: 3, spirit: 4, vocation: 5 },
      { mind: 0, body: 0, spirit: 0, vocation: 0 },
      [],
    )).toBe("mind");

    expect(suggestLifeDimension(
      { mind: 2, body: 2, spirit: 4, vocation: 5 },
      { mind: 3, body: 1, spirit: 0, vocation: 0 },
      [],
    )).toBe("body");

    expect(suggestLifeDimension(
      { mind: 2, body: 2, spirit: 4, vocation: 5 },
      { mind: 1, body: 1, spirit: 0, vocation: 0 },
      [checkIn({ selectedDimension: "mind" })],
    )).toBe("body");
  });

  it("awards at most one seed per calendar day", () => {
    const saved = saveDailyCheckIn(createInitialGrowthState(), checkIn());
    const completed = completeDailyGrowth(saved, "2026-07-19", "2026-07-19T08:00:00Z");
    const duplicate = completeDailyGrowth(completed, "2026-07-19", "2026-07-19T09:00:00Z");
    expect(duplicate).toEqual(completed);
    expect(completed.garden.growth.mind).toBe(1);
    expect(completed.cycle.completedDates).toEqual(["2026-07-19"]);
  });

  it("uses 1, 3, 5 and 7 seed guardian stages", () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7].map(guardianStageForSeeds)).toEqual([
      0, 1, 1, 2, 2, 3, 3, 4,
    ]);
  });

  it("rotates after the inclusive 14-day window without losing garden growth", () => {
    const growth = {
      ...createInitialGrowthState(),
      cycle: {
        startedOn: "2026-07-01",
        completedDates: ["2026-07-01"],
        status: "active" as const,
        completedOn: null,
      },
      garden: {
        ...createInitialGrowthState().garden,
        growth: { mind: 1, body: 0, spirit: 0, vocation: 0 },
      },
    };
    expect(rotateGrowthCycle(growth, "2026-07-14").cycle.startedOn).toBe("2026-07-01");
    const rotated = rotateGrowthCycle(growth, "2026-07-15");
    expect(rotated.cycle.startedOn).toBe("2026-07-15");
    expect(rotated.cycle.completedDates).toEqual([]);
    expect(rotated.garden.growth.mind).toBe(1);
  });

  it("starts a fresh cycle on the next check-in after seven seeds", () => {
    let growth = createInitialGrowthState();
    for (let day = 1; day <= 7; day += 1) {
      const date = `2026-07-0${day}`;
      growth = saveDailyCheckIn(growth, checkIn({ date }));
      growth = completeDailyGrowth(growth, date, `${date}T08:00:00Z`);
    }
    expect(growth.cycle.status).toBe("completed");
    expect(growth.garden.growth.mind).toBe(7);

    const next = saveDailyCheckIn(growth, checkIn({ date: "2026-07-08", selectedDimension: "body" }));
    const reseeded = completeDailyGrowth(next, "2026-07-08", "2026-07-08T08:00:00Z");
    expect(reseeded.cycle.startedOn).toBe("2026-07-08");
    expect(reseeded.cycle.completedDates).toEqual(["2026-07-08"]);
    expect(reseeded.garden.growth).toEqual({ mind: 7, body: 1, spirit: 0, vocation: 0 });
    expect(reseeded.checkIns).toHaveLength(8);
  });
});
