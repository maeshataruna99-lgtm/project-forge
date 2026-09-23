# Project Forge Web Wizard Design

**Status:** Approved
**Date:** 2026-09-23

## Goal

Add a browser-based Project Forge wizard that helps a user configure a starter project, see the resulting plan, validate the configuration, and download the generated ZIP archive. The wizard is the user interface for the existing generator API; it does not replace generator rules or make unsupported configurations available.

## User experience

The app presents a guided, responsive flow with a persistent step indicator and Back/Continue controls. The steps are:

1. **Project** — enter a project name and choose a blueprint, project shape, profile, and repository layout.
2. **Stack** — choose the language, backend, frontend, database, ORM, package manager, and task runner.
3. **Organization and features** — choose company mode and super-admin scope, then review optional capabilities.
4. **Theme** — choose the theme preset, light/dark mode, primary and accent colors, and see a live preview.
5. **Review and generate** — inspect the normalized configuration and file tree, run validation, and download the ZIP.

The page uses clear labels, keyboard-operable controls, visible focus indicators, and responsive layouts. Unsupported choices remain visible but disabled, with a short reason obtained from the catalog where available. The initial default is the valid minimal configuration represented by `examples/minimal-config.json`.

The review step shows the project name, selected options, the generated file tree, and validation feedback. Generate stays unavailable until validation succeeds. While archive generation is running, the UI shows progress state and prevents duplicate submissions. On success, the browser downloads the archive using a safe filename derived from the response `Content-Disposition` header, falling back to the project name.

## Draft persistence and errors

The current configuration is saved in browser local storage and restored when the user returns. Draft persistence is local to that browser; there is no account or server-side draft storage. Provide a reset action with a clear confirmation step before discarding the saved draft.

Client-side feedback catches basic missing or malformed input. The API remains authoritative for schema and compatibility validation. API validation errors should be shown next to the relevant setting when field information is available; otherwise show a readable summary. Preserve the draft on network, validation, or archive errors, and display the API correlation ID when provided.

## API and catalog

Use the existing endpoints:

- `GET /generator/catalog` to populate choices and availability.
- `POST /generator/validate` before presenting a downloadable result; use its returned plan/file tree on the review step.
- `POST /generator/archive` only after successful validation; stream or read the ZIP response as a browser download.

The UI must not hard-code a choice as available when the API says it is unsupported. The current catalog exposes profiles, blueprints, shapes, layouts, optional features, and themes. Extend the catalog contract/API response to include the stack choices, organization choices, and feature toggles needed by the wizard, including availability and reasons. Keep the catalog typed from the shared contracts package. API-side validation remains the final authority if catalog and validation ever disagree.

For local development, the web app proxies `/generator` and `/health` to the API on port 3000. Production deployment assumes a same-origin reverse proxy routes these paths to the API; document this requirement in the web app README/configuration.

## Application structure

Add `apps/web` as a Vue 3 and Vite application, using TypeScript and Tailwind CSS, consistent with the repository's pnpm workspace. Keep the UI organized around the wizard shell, step views, typed API client, catalog/config state, local draft persistence, and theme preview. Share the existing configuration and catalog contracts rather than duplicating their types. The web app is a separate user-facing app and does not alter files generated for starter projects.

## Scope boundaries

Included: the wizard UI, catalog additions for its choices, draft persistence, live theme preview, configuration validation, file-tree review, ZIP download, and concise setup documentation.

Excluded: implementing new starter templates or enabling currently unsupported enterprise/e-commerce/API-only/frontend-only/single-app configurations; GitHub or Git-provider integration; user accounts or remote saved drafts; deployment automation; and changes to generated application behavior beyond what the existing generator already supports.

## Acceptance criteria

1. A user can open the web app and configure a valid minimal project through all wizard steps.
2. The initial form values produce a configuration accepted by the shared schema and API.
3. Catalog-supported options are populated from the API. Unsupported options are disabled and explain why.
4. The project name is checked before proceeding, and API compatibility errors are presented without losing entered values.
5. The theme preview updates when mode or colors change.
6. The review step displays the validated file tree and selected configuration.
7. The user can download a ZIP only after validation succeeds; archive/API failures are recoverable and preserve the draft.
8. Refreshing or reopening the browser restores the draft; reset returns to the valid defaults.
9. The UI is usable with keyboard navigation and adapts to narrow screens.
10. Workspace lint/typecheck/test commands cover the web app, and a documented local development path starts web and API together.

## Decisions to confirm in review

- The wizard begins with the existing minimal configuration and presents unsupported catalog choices as disabled options.
- Drafts are stored only in local storage.
- Production serves the web app and API behind a same-origin route.
- No new generator templates are part of this implementation slice.
