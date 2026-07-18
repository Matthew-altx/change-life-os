import { createInitialState, type AppState } from "./domain";
import { withLocale, type UiPreferences } from "./uiPreferences";
import type { Locale } from "./i18n";

export type RootState = {
  appState: AppState;
  preferences: UiPreferences;
};

export type RootAction =
  | { type: "hydrate"; appState: AppState; preferences: UiPreferences }
  | { type: "update-app"; update: (current: AppState) => AppState }
  | { type: "set-locale"; locale: Locale }
  | { type: "set-guide-seen"; guideSeen: boolean };

export const initialRootState: RootState = {
  appState: createInitialState(),
  preferences: { locale: "zh-HK", guideSeen: false },
};

export const rootReducer = (state: RootState, action: RootAction): RootState => {
  switch (action.type) {
    case "hydrate":
      return { appState: action.appState, preferences: action.preferences };
    case "update-app":
      return { appState: action.update(state.appState), preferences: state.preferences };
    case "set-locale":
      return {
        appState: state.appState,
        preferences: withLocale(state.preferences, action.locale),
      };
    case "set-guide-seen":
      return {
        appState: state.appState,
        preferences: {
          locale: state.preferences.locale,
          guideSeen: action.guideSeen,
        },
      };
  }
};
