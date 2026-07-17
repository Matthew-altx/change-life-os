import { createInitialState, type AppState } from "./domain";

export const STORAGE_KEY = "changeLifeOS";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const parseImportedState = (text: string): AppState => {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("檔案格式不正確");
  }
  if (!isRecord(value) || value.version !== 1) {
    throw new Error("不支援的備份版本");
  }
  const requiredRecords = ["profile", "humanScores", "dailyPriority", "resetPlan", "timer"];
  const requiredArrays = ["quests", "contentItems", "reviews", "activeDates"];
  if (
    requiredRecords.some((key) => !isRecord(value[key])) ||
    requiredArrays.some((key) => !Array.isArray(value[key]))
  ) {
    throw new Error("備份內容不完整");
  }
  return value as AppState;
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
