import { describe, expect, it } from "vitest";
import { createInitialState } from "./domain";
import { exportState, parseImportedState } from "./storage";

describe("state import", () => {
  it("round-trips a valid state", () => {
    const state = createInitialState("2026-07-17");
    expect(parseImportedState(exportState(state))).toEqual(state);
  });

  it("rejects malformed or incompatible data", () => {
    expect(() => parseImportedState("not-json")).toThrow("檔案格式不正確");
    expect(() => parseImportedState(JSON.stringify({ version: 2 }))).toThrow(
      "不支援的備份版本",
    );
    expect(() => parseImportedState(JSON.stringify({ version: 1 }))).toThrow(
      "備份內容不完整",
    );
  });
});
