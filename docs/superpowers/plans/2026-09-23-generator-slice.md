# First Generator Slice Implementation Plan

> **For agentic workers:** Use test-driven development and verify each task before continuing.

**Goal:** Accept one explicitly minimal Blank Fullstack configuration, preview its file plan, and download a runnable NestJS/Vue/Prisma starter ZIP.

**Architecture:** Shared contracts parse untrusted input; the registry rejects combinations without a complete template. Generator core reads only registered files from the bundled template, applies narrowly typed substitutions, checks paths and archive limits, and emits an in-memory ZIP. A NestJS API exposes catalog, validation, and archive endpoints without storing requests or output.

**Tech Stack:** pnpm, TypeScript, Zod, Vitest, NestJS, fflate, Vue 3/Vite, Prisma 6.

**Spec:** `docs/superpowers/specs/2026-09-23-project-forge-design.md`

## Global Constraints

- The supported output is Blank Fullstack, TypeScript, NestJS, Vue/Vite, PostgreSQL/Prisma, pnpm monorepo.
- The configuration uses schemaVersion 2 because an explicit project profile is now required.
- Minimal profile must be explicitly chosen. Enterprise options remain unavailable until their security behavior exists in the generated application.
- Every API request is validated again on the server; files and archives are created only from registered template assets.
- No generated project, user configuration, or credential is persisted by Forge.

## Review Focus

- Unknown nested input and malformed JSON return a structured 400 response.
- A project name cannot escape the archive root or inject content into generated files.
- A renamed/symlinked template asset cannot be read outside the template root.
- Repeated generation with the same config yields the same file names and contents.
- Missing template files produce a safe server error and release the concurrency slot.

---

### Task 1: Gate the minimal profile

**Files:** `packages/contracts/src/index.ts`, its tests, `packages/template-registry/src/index.ts`, its tests.

**Interfaces:** `projectConfigSchema.safeParse(input)`; `validateCompatibility(config)`.

- [x] Add failing tests: explicit minimal profile accepted; enterprise profile, enterprise features, multi-company/global root rejected by registry.
- [x] Run tests and observe failure because profile handling is absent.
- [x] Add `project.profile` and compatibility issues with paths and explanations.
- [x] Run package tests and typecheck.

### Task 2: Safe generator core

**Files:** `packages/generator-core/src/index.ts`, tests, `templates/typescript-nest-vue/*`.

**Interfaces:** `createPlan(input: unknown): GenerationPlan`; `createArchive(input: unknown): Uint8Array`. Both throw `ConfigurationError` with field issues; archive also throws `GenerationError` for template/size failures.

- [x] Add failing tests for valid file plan, rejected config, path safety, ZIP contents, token parity, and repeated output.
- [x] Run tests and observe the missing module failure.
- [x] Implement a fixed manifest, safe template reads, typed substitutions, bounded in-memory ZIP, and errors.
- [x] Run core tests and typecheck.

### Task 3: NestJS generation API

**Files:** `apps/api/src/main.ts`, `apps/api/src/app.module.ts`, `apps/api/src/generator.controller.ts`, endpoint tests.

**Interfaces:** `GET /health`, `GET /generator/catalog`, `POST /generator/validate`, `POST /generator/archive`.

- [x] Add failing endpoint tests for catalog, invalid config, plan summary, ZIP headers and bytes, and oversized JSON.
- [x] Run tests and observe missing API module failure.
- [x] Implement controllers with bounded JSON body, correlation IDs, safe errors, and archive concurrency limit.
- [x] Run API tests and typecheck.

### Task 4: Generated starter and end-to-end verification

**Files:** registered template assets, root README, CI workflow.

- [x] Include generated workspace scripts, Nest API health route, Vue app with theme tokens, Prisma schema, `.env.example`, and setup instructions.
- [x] Generate and unpack a ZIP; check all paths, install its dependencies, run its documented build/test commands, and validate the Prisma schema.
- [x] Run all Forge tests and typecheck; record any verification that requires a live PostgreSQL service.

Verification note: The generated starter passed `pnpm install`, `pnpm build`, `pnpm test`, and `prisma validate`. Its NestJS health endpoint also responded at runtime. `pnpm db:migrate` was not run because no PostgreSQL service was available in this workspace.

Review fixes: Windows reserved device names are rejected before archiving. ZIP compression runs in a bounded worker with a five-second deadline, and concurrent HTTP requests verify the busy response.
