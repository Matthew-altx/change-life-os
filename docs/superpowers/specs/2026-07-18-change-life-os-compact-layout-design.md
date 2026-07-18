# Change-Life OS Compact Editorial Layout Design

## 1. Outcome

Refine the approved Editorial Focus interface so the most important action appears earlier, wide-screen page titles remain on one line whenever practical, and narrow tablet layouts no longer lose useful width to the desktop sidebar.

The change is a presentation-only refinement. It must preserve the existing Cantonese/English copy, user data, interactions, application state, navigation destinations and GitHub Pages release path.

## 2. Confirmed direction

- Use **Balanced Compression** rather than a dense dashboard redesign.
- Preserve the current warm-paper, dark-green, orange-action and restrained-gold visual system.
- Reduce vertical space by approximately 15–20% in page headers, hero cards and section transitions.
- Treat a one-line page title as the desktop and tablet preference, not an absolute rule that may cause overflow.
- On mobile, allow a balanced maximum of two title lines rather than shrinking text below a comfortable reading size.
- Apply the same layout rhythm to Today, Vision, Quests, Content and Reset.

## 3. Scope

### Included

- Application-shell spacing and responsive navigation breakpoint.
- Top utility height and padding.
- Page-title size, width, wrapping and supporting-copy spacing.
- Hero-card height, padding and grid gaps.
- Section separation and common card padding.
- Mobile bottom-navigation height and content clearance.
- Responsive verification at desktop, tablet, narrow tablet and mobile widths.
- Automated layout contracts for the new breakpoint and title rules.

### Excluded

- New features, routes, content or illustrations.
- Changes to translations or user-entered strings.
- Changes to storage, XP, timer, quest, content, reset or guide behaviour.
- Changes to the approved colour palette or overall Editorial Focus direction.
- A component rewrite when the same result can be achieved through the existing layout classes.

## 4. Application shell

### Desktop: wider than 900px

- Keep the existing 208px dark-green sidebar.
- Reduce the top utility from 72px to approximately 56px while retaining 44px minimum control targets.
- Reduce the screen's top padding from 48px to approximately 36–40px.
- Keep the current maximum content widths and centre alignment.

### Tablet and mobile: 900px and below

- Hide the desktop sidebar and use the existing bottom navigation.
- Remove the desktop left margin so the content uses the full viewport width.
- Keep the top utility compact and aligned with the content edge.
- Reserve sufficient bottom padding for the fixed navigation and device safe area.
- The document must have no horizontal overflow at 900px, 800px, 768px or 390px.

The 900px breakpoint deliberately replaces the previous 780px shell switch. This prevents a 208px sidebar from compressing titles and cards within the 781–900px range.

## 5. Page-header system

Every destination keeps the existing eyebrow, title and supporting statement, but uses a tighter shared hierarchy.

### Title behaviour

- Desktop title size: fluid within approximately 38–46px.
- Tablet title size: fluid within approximately 34–40px.
- Mobile title size: fluid within approximately 30–34px.
- Desktop and tablet titles should remain on one line when their actual translated copy fits the available width.
- Mobile titles may wrap to two balanced lines.
- Titles must never use ellipsis, clipping, horizontal scrolling or an unreadably small emergency size.
- Wrapping must avoid a single punctuation mark or isolated final character on its own line whenever browser line-breaking permits.

The Vision title shown in the supplied screenshot — `用願景拉動自己，唔係靠意志力推。` — is the primary regression example. It should render on one line at normal desktop widths after the change.

### Header rhythm

- Reduce title-to-description spacing to approximately 8–10px.
- Reduce page-header bottom spacing from 40px to approximately 28px.
- Keep supporting copy at a readable line height and cap its measure so it does not compete with the title.

## 6. Content density

- Reduce hero-card internal padding from 32px to approximately 24–28px.
- Reduce hero-card minimum height where content allows, without clipping level, streak, priority or form controls.
- Reduce common grid gaps from 16px to approximately 12–16px.
- Reduce major section separation from 48px to approximately 32–36px.
- Preserve breathing room inside forms and keep labels visually attached to their inputs.
- Preserve at least 44 by 44 CSS pixels for primary and score controls.

The intended result is roughly one additional meaningful action area visible in the first viewport, not a compressed analytics dashboard.

## 7. Module-specific behaviour

- **Today:** the level and priority cards remain the dominant first action; the HUMAN heading should enter the initial desktop viewport earlier.
- **Vision:** the long title remains one line at desktop widths, and the four vision cards retain a balanced two-column layout where space permits.
- **Quests:** the quest form and skill stack preserve their hierarchy; tighter spacing must not crowd delete or completion controls.
- **Content:** capture controls remain on one line at desktop and remain intact at 390px; the four-stage flywheel keeps its existing responsive column changes.
- **Reset:** review, protocol, detox and data controls retain clear separation despite reduced outer spacing.

## 8. Accessibility and edge cases

- Keep all existing keyboard focus indicators and contrast fixes.
- Keep primary touch targets at least 44 by 44 CSS pixels.
- Keep safe-area clearance for mobile bottom navigation and guide actions.
- Long English labels and long user-entered strings must wrap inside their own cards.
- The layout must remain usable at 200% browser zoom without horizontal page scrolling at common viewport widths.
- Reduced-motion behaviour remains unchanged.

## 9. Implementation boundaries

- Prefer changes in `app/globals.css` and layout contract tests.
- Modify React markup only if a semantic wrapper is required to achieve the approved responsive layout cleanly.
- Do not change `app/i18n.ts`, life-data storage or domain logic for this release.
- Preserve the existing untracked `.superpowers/` working material and unrelated files.

## 10. Verification

### Automated

- Existing application, Google-stack and GitHub Pages suites pass.
- A contract confirms that the application shell switches to bottom navigation at 900px.
- A contract confirms the reduced page-title range and non-destructive wrapping rules.
- A contract preserves 44px controls and safe bottom-navigation clearance.

### Browser acceptance

1. Verify Today, Vision, Quests, Content and Reset with realistic data at 1440px.
2. Confirm the Vision title stays on one line at 1440px and 1280px.
3. Confirm the sidebar is absent and content uses full width at 900px and 800px.
4. Confirm page width equals document scroll width at 1440px, 1024px, 900px, 800px and 390px.
5. Confirm mobile titles use no more than two balanced lines and do not sit under the bottom navigation.
6. Verify language switching, guide opening, timer controls, content capture and representative form actions still work.
7. Compare updated desktop and mobile screenshots against the approved Editorial Focus reference and record the result in `design-qa.md`.

## 11. Completion boundary

The refinement is complete only when the approved spacing and title behaviour are visible across all five modules, automated and browser checks pass, `design-qa.md` says `final result: passed`, the change is pushed to GitHub, the Pages workflow succeeds, and the public site is rechecked.
