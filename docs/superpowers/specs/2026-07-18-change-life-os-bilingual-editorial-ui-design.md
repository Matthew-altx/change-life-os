# Change-Life OS Bilingual Editorial UI Design

## 1. Outcome

Upgrade the existing open-source GitHub Pages MVP into a bilingual, editorial-style personal operating system without changing or deleting existing user data.

The release succeeds when a Cantonese-first user can understand the daily loop immediately, switch the complete interface to English in one action, and open contextual guidance for every core module without leaving the app.

## 2. Confirmed product decisions

- Use a central, typed translation system rather than duplicating pages or embedding ad-hoc conditional strings.
- Default language is Traditional Chinese written for Hong Kong users.
- A visible `中 / EN` control switches the complete interface in place.
- The selected language persists on the current device.
- User-entered content is never translated, modified or duplicated when the interface language changes.
- The visual direction is **Editorial Focus**: warm paper, strong typography, generous whitespace and restrained colour.
- The guide depth is **Contextual Guidance**: every core module explains Why, How and Done when.
- The public runtime remains the existing static GitHub Pages application with local browser storage.

## 3. Scope

### Included

- Complete Cantonese and English interface copy for navigation, buttons, headings, field labels, statuses, validation, empty states, storage controls and guidance.
- A central translation dictionary with compile-time key parity.
- Persisted language preference with a safe Cantonese fallback.
- Editorial redesign of the application shell, dashboard hierarchy, cards, forms, progress displays and responsive navigation.
- Persistent guide entry point on desktop and mobile.
- First-use five-step orientation.
- Module-specific Why / How / Done when guidance for Today, Vision, Quests, Content and Reset.
- Accessibility and responsive behaviour improvements.
- Automated tests and live GitHub Pages verification.

### Excluded

- Machine translation of user content.
- Route-based `/zh` and `/en` copies of the site.
- Google login, Google Sheets sync or migration to the optional Google Apps Script stack.
- Changes to the persisted Change-Life OS user-state schema unless required for backward-compatible UI metadata.
- New AI generation, publishing, payment or analytics features.
- Preloaded demo data or a compulsory tutorial that blocks normal use.

## 4. Language architecture

### Locale model

The application supports exactly two locales in this release:

```text
zh-HK  Cantonese-first Traditional Chinese (default)
en     English
```

A small language provider owns the active locale and exposes a typed translation function. Interface messages and structured guide content live in one central module. Both locales must implement the same message shape so missing English or Chinese keys fail during development rather than appearing as blank production text.

The language preference is stored separately from the existing application data under a dedicated key. On startup:

1. Read the saved locale.
2. Accept it only if it is `zh-HK` or `en`.
3. Otherwise use `zh-HK`.
4. Set the document `lang` attribute to match the active locale.

If persistence fails, the current session still changes language and shows no destructive error. A reload may return to Cantonese.

### Translation boundary

Translated content includes all product-owned copy:

- navigation and page titles;
- actions, labels, placeholders and helper text;
- quest types, skill names and content stages;
- timer controls and progress messages;
- onboarding prompts and validation;
- empty, success, warning and confirmation states;
- guide steps and contextual module guidance.

User-owned strings remain exactly as entered. This includes visions, priorities, quest titles, content drafts and review answers.

## 5. Editorial Focus visual system

### Colour

- Primary green: `#143C2D` for navigation, key headings and dark surfaces.
- Action orange: `#DA8134` for primary actions and active controls.
- Deep orange: `#9A3D1A` for emphasis and high-attention states.
- White: `#FFFFFF` for clean card surfaces.
- Gold: `#D7AE5E` for progress and small achievement accents only.
- Warm paper background derived from off-white, with a subtle non-distracting texture.

Colour must communicate hierarchy rather than decorate every component. Orange is reserved for action; gold is reserved for progress or reward.

### Typography and spacing

- Editorial display typography is used for page titles, statements and key numbers.
- A highly legible sans-serif remains the default for controls, forms and body copy.
- The desktop layout uses generous whitespace and clear section breaks instead of dense dashboard grids.
- Spacing follows a consistent scale based on 4 and 8 pixel increments.
- Cards use a consistent anatomy: optional eyebrow, title, explanation, content and action area.

### Application shell

- Desktop retains a dark-green left navigation rail and gains a compact top utility area for language and guide controls.
- Mobile retains bottom navigation and exposes language and guide controls without covering content.
- The active destination is recognisable by text, shape and colour rather than colour alone.
- Content width is controlled so long editorial text remains readable on wide screens.

### Interaction quality

- All primary touch targets are at least 44 by 44 CSS pixels.
- Focus indicators are visible for keyboard users.
- Normal text and controls meet WCAG AA contrast.
- Reduced-motion preference disables non-essential movement.
- Hover states never contain information unavailable to touch or keyboard users.

## 6. Information hierarchy

The existing five destinations remain unchanged to protect user familiarity:

1. **今日 / Today** — daily priority, HUMAN 3.0 check-in, focus session and active work.
2. **願景 / Vision** — anti-vision, ideal direction, niche and 90-day outcome.
3. **任務 / Quests** — main quests, side quests, boss fights and skill progress.
4. **內容 / Content** — Idea, Learn, Teach, Sell and PIA creation flow.
5. **重置 / Reset** — 3-2-1 reflection, life reset, detox commitment and data controls.

Each screen begins with one clear editorial statement, one short explanation and one dominant next action. Secondary statistics and settings sit lower in the hierarchy.

## 7. Contextual guidance system

### First-use orientation

On first use, a five-step guide explains the complete loop:

1. Face the cost of staying unchanged and define a 90-day direction.
2. Choose one daily high-leverage priority.
3. protect attention with a focused work session.
4. Turn experience into Learn–Teach–Sell output.
5. Close the day with the 3-2-1 review.

The guide can be completed or skipped and never blocks product use. It remains available from the persistent guide control.

### Module guide contract

Every primary destination supplies three short sections:

- **Why / 點解做** — the problem the module solves and its place in the operating system.
- **How / 點做** — a short ordered action sequence using the controls on that screen.
- **Done when / 完成標準** — an observable result, not a vague motivation statement.

The guide opens as a centred accessible dialog on desktop and a full-height sheet on narrow screens. It includes a progress indicator, previous/next controls, close control and a direct action that returns the user to the relevant module.

Guide completion is UI metadata only. If it is not persisted successfully, the guide remains manually accessible and no user-state data is affected.

## 8. Data flow and compatibility

- Existing Change-Life OS state continues to load through the current storage adapter.
- Language and guide UI preferences are stored separately from life-management data.
- No migration may overwrite profile, priority, quest, content, review, reset or progress records.
- Switching language re-renders product copy only.
- Export and import continue to represent user data; transient UI language does not need to alter the existing backup contract.
- Invalid stored preferences fall back safely without surfacing an error screen.

## 9. Component boundaries

Implementation should separate these responsibilities:

- locale types, dictionaries and translation helpers;
- language provider and switcher;
- reusable application shell and navigation;
- reusable editorial page heading and card patterns;
- guide content, guide trigger and responsive guide dialog;
- existing domain views and state logic.

The redesign must not combine domain calculations with translation or visual components. XP, streak, timer, PIA and persistence behaviour remain testable independently from presentation.

## 10. Error and edge behaviour

- Missing or invalid locale preference uses Cantonese.
- A storage exception does not prevent language switching or guide use in the active session.
- Long English labels wrap without clipping controls.
- Long Cantonese and user-entered content wraps without breaking cards or navigation.
- The guide traps focus while open, closes with Escape, restores focus to its trigger and labels its controls for assistive technology.
- No untranslated key identifier may appear in the production interface.
- Empty user data produces a translated next action rather than an unexplained blank panel.

## 11. Verification

### Automated checks

- Both locale dictionaries satisfy the same typed message contract.
- The default locale is `zh-HK`.
- Valid saved language is restored; invalid language falls back to `zh-HK`.
- Switching language changes product copy without changing representative user-entered content.
- The guide opens, navigates, closes and can be reopened.
- Existing state and GitHub Pages contract tests continue to pass.
- Production build succeeds with the repository base path.

### Browser acceptance checks

1. Open a clean session and see Cantonese plus the first-use guide.
2. Complete or skip the guide, reopen it and navigate to each module's contextual guidance.
3. Switch to English and verify all five destinations, onboarding, dialog copy, controls, empty states and validations.
4. Reload and retain the English preference.
5. Enter mixed Chinese and English user content, switch languages and confirm the content is unchanged.
6. Verify desktop shell, tablet layout and mobile bottom navigation without clipping or overlap.
7. Navigate the language switch and guide by keyboard and verify focus restoration.
8. Confirm existing saved user state still loads after the release.
9. Verify the final GitHub Pages HTML, JavaScript and CSS return HTTP 200 from the public URL.

## 12. Completion boundary

The release is complete only when the automated suite and production build pass, the browser acceptance checks pass locally, changes are pushed to the public repository, the GitHub Pages workflow succeeds and the live public site is rechecked.
