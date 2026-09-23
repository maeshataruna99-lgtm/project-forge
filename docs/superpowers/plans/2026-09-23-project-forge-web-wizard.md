# Project Forge Web Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser wizard that configures a supported Project Forge starter, validates and previews its file plan, and downloads the generated archive.

**Architecture:** Extend the shared catalog from the template registry so it describes every wizard selection and availability. Add a Vue 3/Vite application in `apps/web` that consumes shared contracts and the existing API, stores a local draft, and drives the existing validate/archive endpoints; server validation remains authoritative.

**Tech Stack:** pnpm 9 workspace, TypeScript, Zod shared contracts, NestJS API, Vue 3, Vite, Tailwind CSS, Vitest, Vue Test Utils, Playwright or Vite browser test setup if needed for browser-level coverage.

**Spec:** `docs/superpowers/specs/2026-09-23-project-forge-web-wizard-design.md`

## Global Constraints

- The initial default is the valid minimal configuration represented by `examples/minimal-config.json`.
- Unsupported choices remain visible but disabled, with a short reason obtained from the catalog where available.
- The API remains authoritative for schema and compatibility validation.
- The current configuration is saved in browser local storage; draft persistence is local to that browser.
- The review step displays the generated file tree and validation feedback.
- Generate stays unavailable until validation succeeds.
- The web app proxies `/generator` and `/health` to the API on port 3000 for local development.
- Production deployment assumes a same-origin reverse proxy routes these paths to the API.
- The app uses Vue 3, Vite, TypeScript, and Tailwind CSS in `apps/web`.
- The UI has clear labels, keyboard-operable controls, visible focus indicators, and responsive layouts.
- Do not implement new starter templates or enable currently unsupported generator configurations in this slice.

## Review Focus

- Invalid or stale local-storage data must be discarded safely and replaced by defaults; Task 4 tests malformed, outdated, and structurally invalid stored values.
- A stale or contradictory catalog must never permit unsupported configurations to reach generation; Task 2 tests unavailable choices and Task 5 tests validation errors.
- API failures and field errors must preserve user input and show correlation IDs when supplied; Task 5 tests validation and archive failures.
- Archive response filenames may be missing or malformed; Task 5 tests safe fallback naming and successful ZIP download behavior.
- Keyboard users must be able to move through steps and understand disabled options and errors; Task 3 tests rendered semantics and keyboard step navigation.

---

## File Structure

- `packages/template-registry/src/index.ts`: source of catalog choice labels, availability, and reasons.
- `packages/template-registry/src/index.test.ts`: registry compatibility and complete-catalog tests.
- `packages/contracts/src/index.ts`: shared catalog types/schema consumed by API and web app.
- `packages/contracts/src/index.test.ts`: catalog response contract tests.
- `apps/api/src/app.test.ts`: endpoint assertions for the expanded catalog.
- `apps/web/package.json`, `apps/web/tsconfig.json`, `apps/web/vite.config.ts`, `apps/web/tailwind.config.ts`, `apps/web/postcss.config.js`, `apps/web/index.html`: app and dev/test/build setup.
- `apps/web/src/main.ts`, `apps/web/src/App.vue`, `apps/web/src/style.css`: app entry and shell styling.
- `apps/web/src/api/generator.ts`: typed catalog, validation, and archive HTTP operations.
- `apps/web/src/domain/default-config.ts`, `apps/web/src/domain/draft-storage.ts`, `apps/web/src/domain/wizard-state.ts`: valid defaults, safe local persistence, and step state.
- `apps/web/src/components/WizardStepper.vue`, `apps/web/src/components/ChoiceField.vue`, `apps/web/src/components/ThemePreview.vue`, `apps/web/src/components/FileTree.vue`: reusable accessible UI components.
- `apps/web/src/steps/ProjectStep.vue`, `StackStep.vue`, `OrganizationStep.vue`, `ThemeStep.vue`, `ReviewStep.vue`: focused step forms and review.
- `apps/web/src/App.test.ts`, `apps/web/src/domain/*.test.ts`, `apps/web/src/api/*.test.ts`: component, domain, and API tests.
- `apps/web/README.md`: local development, proxy, and production same-origin routing instructions.
- `package.json`: workspace-level web dev/build/test/typecheck scripts where needed.

## Task 1: Define the complete wizard catalog contract

**Files:**
- Modify: `packages/contracts/src/index.ts`
- Test: `packages/contracts/src/index.test.ts`
- Modify: `packages/template-registry/src/index.ts`
- Test: `packages/template-registry/src/index.test.ts`
- Test: `apps/api/src/app.test.ts`

**Interfaces:**
- Produces: `catalogSchema` and inferred `GeneratorCatalog` in contracts, with categories for profiles, blueprints, shapes, layouts, language, backend, frontend, database, ORM, package manager, task runner, company mode, super-admin scope, auth, RBAC, navigation, audit, Redis, Docker, and themes.
- Each catalog choice is `{ value: string; label: string; available: boolean; reason?: string }`; boolean features use explicit `enabledByDefault` semantics only if needed by the API design, otherwise UI derives values from config defaults.
- `catalog` in template registry conforms to `GeneratorCatalog`; API returns this typed value unchanged.

- [ ] **Step 1: Add failing contract and catalog tests**

Test that the complete catalog parses through `catalogSchema`, every selectable field has an entry for each schema enum/boolean state, and `available` choices match the minimal configuration supported by `validateCompatibility`.

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `pnpm --filter @project-forge/contracts test && pnpm --filter @project-forge/template-registry test && pnpm --filter @project-forge/api test`

Expected: FAIL because the shared catalog schema/categories and registry entries do not exist yet.

- [ ] **Step 3: Add the shared catalog schema and registry choices**

Define reusable Zod choice and category schemas in contracts. Add choices for each schema enum and boolean feature to the registry. Mark the current minimal configuration available and all unsupported stack/company/feature choices unavailable with concrete reasons. Do not change `validateCompatibility` to accept any newly listed option.

- [ ] **Step 4: Verify catalog types and API response**

Run the three focused package tests and `pnpm --filter @project-forge/contracts typecheck && pnpm --filter @project-forge/template-registry typecheck && pnpm --filter @project-forge/api typecheck`.

Expected: PASS; API catalog response includes every setting the wizard renders.

- [ ] **Step 5: Commit the catalog slice**

```bash
git add packages/contracts packages/template-registry apps/api/src/app.test.ts
git commit -m "feat: expose complete generator catalog"
```

## Task 2: Scaffold the Vue/Vite application and typed generator client

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/tailwind.config.ts`
- Create: `apps/web/postcss.config.js`
- Create: `apps/web/index.html`
- Create: `apps/web/src/main.ts`
- Create: `apps/web/src/App.vue`
- Create: `apps/web/src/style.css`
- Create: `apps/web/src/api/generator.ts`
- Create: `apps/web/src/api/generator.test.ts`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: `GeneratorCatalog` and `ProjectConfig` from `@project-forge/contracts`.
- Produces: `fetchCatalog(): Promise<GeneratorCatalog>`, `validateConfig(config: ProjectConfig): Promise<GenerationPlan>` where `GenerationPlan` is inferred from the validate API response (`projectName`, `profile`, `files`, and `theme`), and `downloadArchive(config: ProjectConfig): Promise<{ blob: Blob; filename: string }>`.
- API failures expose `{ status?: number; code?: string; issues?: Array<{ path: string; message: string }>; correlationId?: string }` through a typed `GeneratorApiError`.

- [ ] **Step 1: Add failing API client tests**

Mock `fetch` to verify catalog parsing, JSON request bodies for validate/archive, readable non-2xx errors, extraction of `Content-Disposition` filenames, and fallback to `<project.name>.zip` when the header is absent or unsafe.

- [ ] **Step 2: Run the focused web test and confirm failure**

Run: `pnpm --filter @project-forge/web test`

Expected: FAIL because `apps/web` and its API client are not present.

- [ ] **Step 3: Scaffold the app and implement the API client**

Create the Vue/Vite/Tailwind setup, add workspace dependency on `@project-forge/contracts`, and configure Vite to proxy `/generator` and `/health` to `http://localhost:3000`. Implement the three client operations, parse response payloads with shared schemas, and sanitize download filenames to a basename ending in `.zip`.

- [ ] **Step 4: Verify app tooling and HTTP behavior**

Run: `pnpm install --offline; pnpm --filter @project-forge/web test; pnpm --filter @project-forge/web typecheck; pnpm --filter @project-forge/web build`

Expected: PASS with the scaffold app rendering and API client tests passing. If a required package is not cached, use the configured package manager install with network approval workflow rather than silently substituting an unrelated library.

- [ ] **Step 5: Commit the app foundation**

```bash
git add apps/web package.json pnpm-lock.yaml
git commit -m "feat: scaffold project forge web app"
```

## Task 3: Build accessible wizard navigation and choice steps

**Files:**
- Create: `apps/web/src/components/WizardStepper.vue`
- Create: `apps/web/src/components/ChoiceField.vue`
- Create: `apps/web/src/steps/ProjectStep.vue`
- Create: `apps/web/src/steps/StackStep.vue`
- Create: `apps/web/src/steps/OrganizationStep.vue`
- Create: `apps/web/src/steps/ThemeStep.vue`
- Create: `apps/web/src/App.test.ts`
- Modify: `apps/web/src/App.vue`
- Modify: `apps/web/src/style.css`

**Interfaces:**
- Consumes: `GeneratorCatalog`, `ProjectConfig`, and app callbacks for `next`, `back`, and config updates.
- Produces: five-step navigation with typed updates to config; choice controls show unavailable reasons and cannot select unavailable values.

- [ ] **Step 1: Add failing navigation and accessibility tests**

Test the five visible steps, next/back behavior, project-name input and constraints, disabled catalog options with reasons, and keyboard operation of step navigation and choices.

- [ ] **Step 2: Run the focused UI tests and confirm failure**

Run: `pnpm --filter @project-forge/web test`

Expected: FAIL because the stepper and form components are missing.

- [ ] **Step 3: Implement the stepper and form components**

Create semantic `nav`/`ol` step navigation, labeled inputs/selects, disabled choices with adjacent explanation text, validation messages associated by `aria-describedby`, and Back/Continue controls. Keep project, stack, organization/features, and theme forms focused in their own step components.

- [ ] **Step 4: Verify keyboard and responsive behavior**

Run: `pnpm --filter @project-forge/web test; pnpm --filter @project-forge/web typecheck; pnpm --filter @project-forge/web build`

Expected: PASS. Keyboard focus remains visible and all required labels and disabled reasons are exposed in rendered DOM.

- [ ] **Step 5: Commit the wizard navigation slice**

```bash
git add apps/web/src
git commit -m "feat: add project configuration wizard steps"
```

## Task 4: Add valid defaults, wizard state, and draft persistence

**Files:**
- Create: `apps/web/src/domain/default-config.ts`
- Create: `apps/web/src/domain/draft-storage.ts`
- Create: `apps/web/src/domain/draft-storage.test.ts`
- Create: `apps/web/src/domain/wizard-state.ts`
- Create: `apps/web/src/domain/wizard-state.test.ts`
- Modify: `apps/web/src/App.vue`
- Modify: `apps/web/src/App.test.ts`

**Interfaces:**
- Produces: `createDefaultConfig(projectName?: string): ProjectConfig`, `loadDraft(storage: Storage): ProjectConfig`, `saveDraft(storage: Storage, config: ProjectConfig): void`, and `clearDraft(storage: Storage): void`.
- Produces wizard state that persists config updates, tracks the active step, and resets to a valid default.

- [ ] **Step 1: Add failing domain tests**

Verify defaults equal the valid minimal example, storage round-trips valid config, malformed JSON and schemaVersion 1 data fall back to defaults, structurally invalid data is rejected, and reset clears storage and restores defaults.

- [ ] **Step 2: Run focused domain tests and confirm failure**

Run: `pnpm --filter @project-forge/web test`

Expected: FAIL because the config and draft state modules do not exist.

- [ ] **Step 3: Implement safe persistence and wizard state**

Parse restored data through `projectConfigSchema`; catch storage access and JSON parse failures; never write an invalid config; default to `minimal-config.json` values encoded in the typed factory. Wire config changes to save immediately. Add a reset button that asks for confirmation before discarding a saved draft.

- [ ] **Step 4: Verify persistence and reset interactions**

Run: `pnpm --filter @project-forge/web test; pnpm --filter @project-forge/web typecheck`

Expected: PASS; invalid persisted data cannot crash app startup, and reset restores the supported default.

- [ ] **Step 5: Commit draft persistence**

```bash
git add apps/web/src
git commit -m "feat: persist project wizard drafts"
```

## Task 5: Implement theme preview, review, validation, and archive download

**Files:**
- Create: `apps/web/src/components/ThemePreview.vue`
- Create: `apps/web/src/components/FileTree.vue`
- Create: `apps/web/src/steps/ReviewStep.vue`
- Create: `apps/web/src/api/generator.integration.test.ts`
- Modify: `apps/web/src/App.vue`
- Modify: `apps/web/src/App.test.ts`
- Modify: `apps/web/README.md`
- Modify: `package.json`

**Interfaces:**
- Consumes: `validateConfig(config)` and `downloadArchive(config)` from Task 2; `GenerationPlan` defined by the typed validate API response in Task 2.
- Produces: review state with `{ plan?: GenerationPlan; validationError?: GeneratorApiError; archiveState: 'idle' | 'downloading' | 'error' | 'complete' }`.

- [ ] **Step 1: Add failing tests for review and download**

Test theme preview updates for color/mode changes; validation success renders plan file paths; validation failure presents field messages and correlation ID while retaining values; archive cannot start before validation; successful download uses safe filename; missing/unsafe filename falls back to `<project.name>.zip`; archive failure returns to retryable state without clearing config.

- [ ] **Step 2: Run focused review tests and confirm failure**

Run: `pnpm --filter @project-forge/web test`

Expected: FAIL because review, file tree, and theme preview components are missing.

- [ ] **Step 3: Implement review and generation flow**

Render a live preview driven by CSS variables for primary/accent and light/dark mode. On entering Review, call validate and display the returned plan. Disable archive generation unless validation succeeded for the current config; invalidate the prior plan when config changes. Trigger browser download from the archive blob and revoke its object URL after use. Keep controls retryable after errors and surface API correlation IDs.

- [ ] **Step 4: Document local and production routing; verify the flow**

Document `pnpm install`, `pnpm --filter @project-forge/api dev`, and `pnpm --filter @project-forge/web dev`, plus the same-origin production proxy. Run: `pnpm --filter @project-forge/web test; pnpm --filter @project-forge/web typecheck; pnpm --filter @project-forge/web build; pnpm --filter @project-forge/api test`.

Expected: PASS; mock/API integration tests cover catalog through ZIP response and user-visible recovery states.

- [ ] **Step 5: Commit review and generation flow**

```bash
git add apps/web package.json
git commit -m "feat: validate and download generated projects"
```

## Task 6: Verify the complete workspace and document the web app

**Files:**
- Modify: `README.md`
- Modify: `.github/workflows/ci.yml` if existing CI does not run root workspace scripts.
- Modify: `apps/web/README.md` if verification reveals a missing setup detail.

**Interfaces:**
- Consumes: all prior tasks.
- Produces: root documentation describing how to start the API and web app and the supported first-slice choices.

- [ ] **Step 1: Run complete workspace verification**

Run: `pnpm test; pnpm typecheck; pnpm --filter @project-forge/web build; pnpm smoke:extract`

Expected: PASS; generator core remains compatible and existing starter archive smoke extraction still succeeds.

- [ ] **Step 2: Run the application locally and verify the main journey**

Start API and web dev servers in separate terminals. Open the web app, confirm the catalog loads, set a valid project name, proceed through all steps, confirm the file tree, generate the ZIP, and inspect that the downloaded archive opens. Also confirm unsupported selections stay disabled and an API validation error leaves the draft intact.

- [ ] **Step 3: Update root README and CI if needed**

Add web app startup commands, local API proxy behavior, production same-origin routing expectation, and the current supported minimal configuration. Ensure CI invokes the new web package test/typecheck/build scripts when its current workflow does not cover root scripts.

- [ ] **Step 4: Re-run final verification and commit documentation**

Run: `pnpm test; pnpm typecheck; pnpm --filter @project-forge/web build; pnpm smoke:extract`

Expected: PASS across existing packages and new web app.

```bash
git add README.md apps/web/README.md .github/workflows/ci.yml
git commit -m "docs: document project forge web wizard"
```
