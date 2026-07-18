import { normalizeLocale, type Locale } from "./i18n";

export const UI_PREFERENCES_KEY = "changeLifeOSUi";

export type UiPreferences = {
  locale: Locale;
  guideSeen: boolean;
};

const defaults = (): UiPreferences => ({ locale: "zh-HK", guideSeen: false });

export const loadUiPreferences = (
  storage: Pick<Storage, "getItem">,
): UiPreferences => {
  try {
    const raw = storage.getItem(UI_PREFERENCES_KEY);
    if (!raw) return defaults();
    const value = JSON.parse(raw) as Record<string, unknown>;
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
    storage.setItem(UI_PREFERENCES_KEY, JSON.stringify(preferences));
    return true;
  } catch {
    return false;
  }
};
