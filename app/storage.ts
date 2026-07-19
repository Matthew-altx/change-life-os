import {
  createInitialGrowthState,
  createInitialState,
  type AppState,
} from "./domain";

export const STORAGE_KEY = "changeLifeOS";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const hasLegacyShape = (value: Record<string, unknown>) => {
  const requiredRecords = ["profile", "humanScores", "dailyPriority", "resetPlan", "timer"];
  const requiredArrays = ["quests", "contentItems", "reviews", "activeDates"];
  return (
    requiredRecords.every((key) => isRecord(value[key])) &&
    requiredArrays.every((key) => Array.isArray(value[key]))
  );
};

const hasGrowthShape = (value: Record<string, unknown>) => {
  if (!isRecord(value.growth)) return false;
  return (
    Array.isArray(value.growth.checkIns) &&
    isRecord(value.growth.cycle) &&
    isRecord(value.growth.garden)
  );
};

export const migrateState = (value: Record<string, unknown>): AppState => {
  if (!hasLegacyShape(value)) throw new Error("備份內容不完整");
  if (value.version === 1) {
    return {
      ...(value as unknown as Omit<AppState, "version" | "growth">),
      version: 2,
      growth: createInitialGrowthState(),
    };
  }
  if (value.version === 2 && hasGrowthShape(value)) return value as unknown as AppState;
  throw new Error(value.version === 2 ? "備份內容不完整" : "不支援的備份版本");
};

export const parseImportedState = (text: string): AppState => {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("檔案格式不正確");
  }
  if (!isRecord(value) || (value.version !== 1 && value.version !== 2)) {
    throw new Error("不支援的備份版本");
  }
  return migrateState(value);
};

export const exportState = (state: AppState) => JSON.stringify(state, null, 2);

export const loadState = (storage: Pick<Storage, "getItem">): AppState => {
  try {
    const saved = storage.getItem(STORAGE_KEY);
    return saved ? parseImportedState(saved) : createInitialState();
  } catch {
    return createInitialState();
  }
};

export const saveState = (
  storage: Pick<Storage, "setItem">,
  state: AppState,
): { ok: true } | { ok: false; message: string } => {
  try {
    storage.setItem(STORAGE_KEY, exportState(state));
    return { ok: true };
  } catch {
    return { ok: false, message: "未能儲存到瀏覽器，請先匯出備份。" };
  }
};
