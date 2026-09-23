# Project Forge Foundation Implementation Plan

> **For agentic workers:** Implement each task in order and verify its observable result before moving on.

**Goal:** Establish a working pnpm workspace and the shared configuration boundary for Project Forge's first supported starter.

**Architecture:** The contracts package owns the versioned input schema. The template registry owns supported choices and compatibility explanations. Generator code and the browser/API consume these packages in later increments. This plan implements the foundation slice of the attached design, not its application template or enterprise features.

**Tech Stack:** TypeScript, pnpm workspace, Zod, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-23-project-forge-design.md`

## Global Constraints

- First supported stack: TypeScript, NestJS, Vue 3/Vite, PostgreSQL, Prisma, pnpm.
- Forge itself requires no database or Redis.
- Configuration is versioned and revalidated on the server when an API is added.
- Generated project archives must never contain credentials or user-controlled paths.

## Review Focus

- Unknown keys must fail validation rather than silently changing output.
- Unsafe project names must fail before they can become package or archive paths.
- Invalid colors must fail before they reach generated CSS.
- Unsupported stack combinations must return a reason the wizard can display.
- A feature dependency must be checked by the registry even when a caller bypasses the UI.

---

### Task 1: Workspace and source record

**Files:** `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `.gitignore`, `README.md`, `.claude/agents/fullstack-developer.md`, design spec.

- [x] Record the supplied design in `docs/superpowers/specs` and copy the linked agent to `.claude/agents`.
- [x] Add root scripts for tests and typechecking.
- [x] Verify `pnpm install` and `pnpm -r test` execute from the repository root.

### Task 2: Versioned configuration contract

**Files:** `packages/contracts/package.json`, `packages/contracts/src/index.ts`, `packages/contracts/src/index.test.ts`.

**Interface:** `projectConfigSchema.safeParse(input)` yields a normalized `ProjectConfig` or field-level Zod issues.

- [x] Write tests for a valid fullstack config, unsafe name, invalid color, and unknown top-level keys.
- [x] Run the tests and observe the missing schema failure.
- [x] Implement the schema and inferred type.
- [x] Run the contract tests and typecheck.

### Task 3: Template registry

**Files:** `packages/template-registry/package.json`, `packages/template-registry/src/index.ts`, `packages/template-registry/src/index.test.ts`.

**Interface:** `validateCompatibility(config: ProjectConfig): CompatibilityIssue[]` and `catalog` metadata.

- [x] Write tests for supported config and unsupported shape, layout, stack, and feature dependency combinations.
- [x] Run the tests and observe the missing registry failure.
- [x] Implement the first registry and machine-readable issue codes with human explanations.
- [x] Run all tests and typecheck.

### Task 4: Handoff for the next vertical slice

**Files:** `README.md`, this plan.

- [x] Document what works now and exact commands to run it.
- [x] Identify the next slice: API validation/archive endpoints and one generated template, then wizard and enterprise application foundation.
- [x] Run final workspace tests and typecheck; report any limitation precisely.
