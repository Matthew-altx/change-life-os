import type { GardenThemeId, LifeDimension } from "./domain";

const baseUrl = (import.meta.env.BASE_URL || "/").replace(/\/?$/, "/");
const gardenAsset = (fileName: string) => `${baseUrl}garden/${fileName}`;

export const gardenBackgroundAsset = (theme: GardenThemeId) => gardenAsset(
  theme === "first-light-garden" ? "garden-first-light.webp" : "garden-classic.webp",
);

export const gardenDimensionAsset = (dimension: LifeDimension) => gardenAsset(`dimension-${dimension}.webp`);

export const guardianStageAsset = (stage: number) => gardenAsset(
  `guardian-${Math.max(0, Math.min(4, Math.round(stage)))}-alpha.webp`,
);

export const gardenGrowthLevel = (amount: number) => Math.max(0, Math.min(1, amount / 7));
