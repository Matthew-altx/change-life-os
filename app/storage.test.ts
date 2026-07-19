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
    expect(() => parseImportedState(JSON.stringify({ version: 3 }))).toThrow(
      "不支援的備份版本",
    );
    expect(() => parseImportedState(JSON.stringify({ version: 1 }))).toThrow(
      "備份內容不完整",
    );
  });

  it("migrates a complete v1 backup without changing existing content", () => {
    const state = createInitialState("2026-07-17");
    const legacy = JSON.parse(JSON.stringify(state)) as Record<string, unknown>;
    delete legacy.growth;
    const restored = parseImportedState(JSON.stringify({ ...legacy, version: 1 }));
    expect(restored.version).toBe(2);
    expect(restored.profile).toEqual(state.profile);
    expect(restored.quests).toEqual(state.quests);
    expect(restored.growth.garden.growth).toEqual({
      mind: 0,
      body: 0,
      spirit: 0,
      vocation: 0,
    });
  });
});
