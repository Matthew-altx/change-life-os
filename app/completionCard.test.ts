import { describe, expect, it } from "vitest";
import { createInitialGrowthState } from "./domain";
import { createCompletionCardSvg } from "./completionCard";

describe("completion card", () => {
  it("contains only dates, completion count, product labels and a garden visual", () => {
    const svg = createCompletionCardSvg({
      startDate: "2026-07-19",
      endDate: "2026-08-01",
      garden: {
        ...createInitialGrowthState().garden,
        growth: { mind: 2, body: 2, spirit: 1, vocation: 2 },
      },
      locale: "zh-HK",
    });
    expect(svg).toContain("7／14 生命花園完成");
    expect(svg).toContain("2026-07-19");
    expect(svg).toContain("2026-08-01");
    expect(svg).toContain("7 / 14");
    expect(svg).not.toContain(">2<");
    expect(svg).not.toContain(">1<");
    expect(svg).not.toContain("score");
    expect(svg).not.toContain("quest");
    expect(svg).not.toContain("review");
  });
});
