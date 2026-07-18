import { normalizeLocale, type Locale } from "./i18n";

export const UI_PREFERENCES_KEY = "changeLifeOSUi";

export type UiPreferences = {
  locale: Locale;
  guideSeen: boolean;
};

export const withLocale = (
  current: Readonly<UiPreferences>,
  locale: Locale,
): UiPreferences => ({ locale, guideSeen: current.guideSeen });

const defaults = (): UiPreferences => ({ locale: "zh-HK", guideSeen: false });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const loadUiPreferences = (
  storage: Pick<Storage, "getItem">,
): UiPreferences => {
  try {
    const raw = storage.getItem(UI_PREFERENCES_KEY);
    if (!raw) return defaults();
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value)) return defaults();
    return {
      locale: normalizeLocale(value.locale),
      guideSeen: value.guideSeen === true,
    };
  } catch {
    return defaults();
  }
};

export const saveUiPreferences = (
  storage: Pick<Storage, "setItem">,
  preferences: UiPreferences,
): boolean => {
  try {
    storage.setItem(
      UI_PREFERENCES_KEY,
      JSON.stringify({
        locale: preferences.locale,
        guideSeen: preferences.guideSeen,
      }),
    );
    return true;
  } catch {
    return false;
  }
};
