import { describe, expect, it } from "vitest";
import {
  gardenBackgroundAsset,
  gardenDimensionAsset,
  gardenGrowthLevel,
  guardianStageAsset,
} from "./gardenAssets";

describe("garden image assets", () => {
  it("maps themes and dimensions to web-ready image files", () => {
    expect(gardenBackgroundAsset("classic")).toMatch(/\/garden\/garden-classic\.webp$/);
    expect(gardenBackgroundAsset("first-light-garden")).toMatch(/\/garden\/garden-first-light\.webp$/);
    expect(gardenDimensionAsset("spirit")).toMatch(/\/garden\/dimension-spirit\.webp$/);
  });

  it("clamps guardian and dimension growth visuals", () => {
    expect(guardianStageAsset(-1)).toMatch(/guardian-0-alpha\.webp$/);
    expect(guardianStageAsset(8)).toMatch(/guardian-4-alpha\.webp$/);
    expect(gardenGrowthLevel(-3)).toBe(0);
    expect(gardenGrowthLevel(3.5)).toBe(.5);
    expect(gardenGrowthLevel(20)).toBe(1);
  });
});
