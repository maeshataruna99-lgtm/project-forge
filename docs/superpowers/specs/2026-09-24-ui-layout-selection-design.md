# Project Forge UI Layout Selection Design

**Status:** Draft for user review  
**Date:** 2026-09-24  
**Repository:** `project-forge`

## 1. Purpose

Let users choose the structure of the Vue interface their Project Forge starter generates. Make each option understandable through a visual card and a live preview, and ensure the selected option changes the generated application rather than only changing the wizard preview.

## 2. User outcome

After choosing a Vue frontend, a user can select one of six layouts, preview the arrangement, continue configuring the project, and receive a generated Vue application whose page structure matches that selection. The selected layout is saved in the local draft and shown on the review step. API-only projects do not apply a UI layout.

## 3. Layout choices

The first release supports these six structural layouts:

| Value | Display name | Generated structure |
| --- | --- | --- |
| `single-column` | Single Column | Centered, vertically ordered starter content. |
| `two-column` | Two Column | Sidebar navigation beside the main workspace. |
| `grid` | Grid | Header and responsive cards arranged in a grid. |
| `split-screen` | Split Screen | Two balanced panels for introduction and primary action. |
| `magazine` | Magazine | A featured content area with supporting items and clear hierarchy. |
| `hero-landing` | Hero Landing | Prominent hero, supporting features, and a primary call to action. |

F-Pattern and Z-Pattern describe common reading flows rather than distinct page structures, so they are not top-level layout values. Masonry and full-screen storytelling are excluded from this slice because the current starter content does not need their content model or immersive behavior.

## 4. Wizard interaction

Add a **UI Layout** step immediately after **Stack**. Show the six choices as a responsive grid of keyboard-operable radio cards. Each card contains a small schematic preview, name, and one-line description; the selected card has a clear border and selected state that does not rely on color alone. A larger preview updates when the selection changes and uses the current theme tokens.

If the selected stack has no frontend, keep the step understandable, show that layout selection requires a Vue frontend, and disable the cards. Continue navigation remains available. When a Vue frontend is selected again, the current layout selection is restored.

The review step names the selected layout when the project includes a frontend. Existing step navigation, draft saving, validation, and archive generation behavior remain in place.

## 5. Configuration, catalog, and drafts

Add `ui.layout` to `ProjectConfig` and add a typed `uiLayouts` category to `GeneratorCatalog`. The six values are available when `stack.frontend` is `vue-vite`; otherwise they are unavailable with a concise catalog reason. The API remains the authority for compatibility validation.

Increment the configuration schema version from 3 to 4. New drafts use a v4 storage key. Migrate valid v3 drafts by adding `ui.layout: "single-column"`, and retain the existing v2-to-v3 migration by composing it with v3-to-v4 migration. Invalid or malformed drafts continue to fall back to defaults through the existing recovery path.

Default new projects to `single-column` so their initial generated result remains familiar.

## 6. Generated output

Extend the generation plan with the resolved UI layout. Register one explicit Vue page structure per layout and select it from the plan; do not interpolate arbitrary file paths from configuration. All layout variants use the same project name, starter content, selected theme tokens, and existing optional auth insertion points. They differ in page structure and layout-specific styles. Each variant works at narrow and wide viewport sizes, with columns stacking in a readable order on small screens.

Apply the selected layout to every currently supported generated Vue frontend path. Do not enable a blueprint, shape, stack, or feature that is currently unavailable. When no frontend is generated, the layout value has no output effect and is omitted from the user-facing review summary.

## 7. Scope boundaries

Included:

- The UI Layout wizard step, accessible visual cards, and theme-aware live preview.
- The configuration and API catalog field, availability rules, schema v4, and v2/v3 draft migration.
- Generation-plan selection of the six registered Vue layouts.
- Review summary support for the selected layout.

Excluded:

- F-Pattern and Z-Pattern as layout values.
- Masonry, full-screen storytelling, new theme controls, new frameworks, and new starter blueprints.
- A general visual redesign of the other wizard steps.

## 8. Acceptance criteria

1. The catalog returns all six layout values with availability determined by frontend selection.
2. A user can select layouts by mouse or keyboard; the selected card and larger preview update together.
3. The preview responds to theme changes and does not present the schematic alone as the generated app.
4. The choice survives refresh through local draft storage, including migration from valid schema v2 and v3 drafts.
5. API-only projects explain that layout selection is unavailable and produce no layout-specific frontend files.
6. Every currently supported Vue output uses the selected structure in the generated archive.
7. Generated variants retain starter content, existing theme tokens, and optional auth insertion points, and remain usable on narrow screens.
8. The review step shows the chosen layout only when a frontend is generated.

## 9. Risks and mitigations

- **Layout labels can imply unsupported behavior.** Keep descriptions focused on visual structure and reuse the same starter content across variants.
- **Drafts can be lost during the schema change.** Explicitly migrate v2 and v3 values and keep the existing invalid-draft fallback.
- **Templates can drift.** Generate all variants from registered sources and preserve shared substitutions and optional feature markers consistently.
- **Theme preview can differ from output.** Use the same theme token resolver and generated CSS variables for card previews and output.
