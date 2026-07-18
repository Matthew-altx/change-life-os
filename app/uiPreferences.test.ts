import { describe, expect, it } from "vitest";
import {
  UI_PREFERENCES_KEY,
  loadUiPreferences,
  saveUiPreferences,
} from "./uiPreferences";

describe("UI preferences", () => {
  it("defaults to Cantonese and an unseen guide", () => {
    let key = "";
    expect(
      loadUiPreferences({
        getItem: (nextKey) => {
          key = nextKey;
          return null;
        },
      }),
    ).toEqual({
      locale: "zh-HK",
      guideSeen: false,
    });
    expect(key).toBe(UI_PREFERENCES_KEY);
  });

  it("restores only supported values", () => {
    const storage = {
      getItem: () => JSON.stringify({ locale: "en", guideSeen: true }),
    };
    expect(loadUiPreferences(storage)).toEqual({ locale: "en", guideSeen: true });

    const invalid = {
      getItem: () => JSON.stringify({ locale: "fr", guideSeen: "yes" }),
    };
    expect(loadUiPreferences(invalid)).toEqual({
      locale: "zh-HK",
      guideSeen: false,
    });
  });

  it.each([
    ["malformed JSON", "{"],
    ["null", "null"],
    ["number", "42"],
    ["string", '"en"'],
    ["array", '["en", true]'],
  ])("falls back safely for %s", (_fixture, raw) => {
    expect(loadUiPreferences({ getItem: () => raw })).toEqual({
      locale: "zh-HK",
      guideSeen: false,
    });
  });

  it("survives read and write failures", () => {
    expect(
      loadUiPreferences({
        getItem: () => {
          throw new Error("blocked");
        },
      }),
    ).toEqual({ locale: "zh-HK", guideSeen: false });
    expect(
      saveUiPreferences(
        {
          setItem: () => {
            throw new Error("full");
          },
        },
        { locale: "en", guideSeen: true },
      ),
    ).toBe(false);
  });

  it("writes only the dedicated UI key", () => {
    let key = "";
    let value = "";
    expect(
      saveUiPreferences(
        {
          setItem: (nextKey, nextValue) => {
            key = nextKey;
            value = nextValue;
          },
        },
        { locale: "en", guideSeen: true },
      ),
    ).toBe(true);
    expect(key).toBe(UI_PREFERENCES_KEY);
    expect(JSON.parse(value)).toEqual({ locale: "en", guideSeen: true });
  });

  it("writes only canonical preference fields", () => {
    let value = "";
    const preferences = Object.assign(
      { locale: "en" as const, guideSeen: true },
      { extra: "must not persist" },
    );

    expect(
      saveUiPreferences(
        {
          setItem: (_key, nextValue) => {
            value = nextValue;
          },
        },
        preferences,
      ),
    ).toBe(true);
    expect(JSON.parse(value)).toEqual({ locale: "en", guideSeen: true });
  });
});
