# Project Forge — Design Specification

**Status:** Draft for user review
**Date:** 2026-09-23
**Repository name:** `project-forge`

## 1. Purpose

Project Forge is a web-based GUI that helps developers configure and generate a ready-to-extend application starter project. Users choose a project blueprint, technology stack, optional capabilities, company model, access-control behavior, deployment profile, and frontend theme. Forge validates the selections, previews the resulting project, then packages it as a ZIP archive.

The first release is a useful, bounded generator—not a general-purpose code-generation platform. It will establish a modular monorepo and one coherent TypeScript full-stack output template. Additional languages, frameworks, blueprints, and direct GitHub repository creation can be added through explicit later phases.

## 2. Goals

- Offer a guided, browser-based project configuration flow.
- Enforce compatibility between languages, frameworks, databases, ORMs, and optional features.
- Generate a maintainable full-stack monorepo with consistent shared contracts and configuration.
- Provide foundational application capabilities in the generated project: authentication, role/permission protection, dynamic navigation, audit trail, company scope, and repeatable initial seed data.
- Produce design tokens and a selected UI theme in generated frontend code, not just in the Forge preview.
- Generate a downloadable ZIP without requiring Forge itself to persist user projects or credentials.
- Keep Forge's own runtime and deployment requirements modest; no database or Redis is required for the first release.

## 3. Non-goals for the first release

- Supporting every language/framework combination at launch.
- Executing the generated project or its install scripts on Forge's server.
- Storing generated projects, source code, secrets, or user configuration in a Forge database.
- Creating/pushing GitHub repositories directly. This may be designed later using an authorized GitHub integration.
- Providing a production SaaS identity/billing system for Forge itself.
- Generating complete business applications for every blueprint. Blueprints provide starter modules and navigation, not finished domain products.
- Adding microservices, Kubernetes, GraphQL, CQRS, or a mandatory Redis service without a concrete template requirement.

## 4. Users and success criteria

The primary user is a developer who wants a repeatable, understandable project foundation without manually wiring common infrastructure. A successful first release lets the user configure the supported template, see exactly what will be generated, download it, install dependencies, apply migrations, seed initial data, and run the application using the README instructions.

Success is measured by:

1. Invalid stack combinations are blocked with an understandable explanation.
2. Repeating the same configuration produces the same logical project structure and defaults.
3. Generated files contain no embedded secrets or unsafe user-controlled paths.
4. The generated starter passes its documented lint, typecheck, and test commands.
5. Authorization is enforced at the API layer even when a menu is hidden in the frontend.
6. Single-company and multi-company modes have explicit, testable data-isolation behavior.

## 5. Product flow

The wizard uses progressive disclosure and retains a configuration draft in browser memory/local browser storage. The configuration is validated before generation.

1. **Project blueprint and shape** — choose a blueprint (initially E-commerce and Blank Fullstack) and API-only, frontend-only, or fullstack output. Fullstack defaults to a monorepo; single-app output remains available where applicable.
2. **Technology stack** — choose from supported language, backend, frontend, database, ORM, and package manager options. Unsupported combinations are hidden or disabled with a reason.
3. **Capabilities** — the enterprise-capable starter enables authentication, RBAC, dynamic navigation, global audit, and company scoping by default. Users select integrations such as Redis, queue, realtime, Docker, API documentation, SMTP, uploads, tests, logging, and CI/CD where supported. A separate minimal profile may omit enterprise foundations only when that profile is explicitly selected.
4. **Company and root access** — select Single Company or Multi Company; specify whether the generated Super Admin is a global root or company-scoped.
5. **Deployment and data mode** — choose supported local/Docker/Vercel/VPS profiles and API-backed or demo storage only when compatible with the selected project shape.
6. **UI and branding** — select a theme preset, light/dark mode, primary/accent colors, and supported visual tokens. Show a live preview.
7. **Review** — show stack, enabled capabilities, generated modules, security model, and a representative file tree. Allow navigation back to edit selections.
8. **Generate** — create files from validated templates, package them in a ZIP, and return the archive to the browser. Display next steps and a configuration summary.

The first template is TypeScript + NestJS API + Vue 3/Vite/Tailwind frontend + PostgreSQL + Prisma in a pnpm workspace. Redis, Docker, and other integrations are optional when enabled by the template registry. PHP/Laravel and other stack families are later template packs, not implicit promises of the first release.

## 6. Architecture and repository layout

Project Forge is itself a pnpm-workspace TypeScript monorepo. The recommended initial structure is:

```text
project-forge/
├── apps/
│   ├── web/                       # Vue 3 + Vite + Tailwind wizard and preview
│   └── api/                       # NestJS configuration and generation API
├── packages/
│   ├── contracts/                 # Shared request/response and config schemas
│   ├── generator-core/            # Validation, planning, rendering, packaging
│   ├── template-registry/         # Blueprint/stack metadata and compatibility rules
│   └── config/                    # Shared TypeScript/lint/tooling configuration
├── templates/
│   └── typescript-nest-vue/        # First generated application template
├── docs/
│   └── superpowers/specs/
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

Each unit has a narrow responsibility:

- `apps/web` collects choices, renders the live theme preview, and presents validation errors and the generated archive.
- `apps/api` exposes the minimal health and generation endpoints. It delegates all configuration decisions and generation work to packages.
- `packages/contracts` defines the versioned configuration schema shared across browser and API boundaries.
- `packages/template-registry` declares supported choices, dependencies, and incompatibility rules as data rather than scattered UI conditionals.
- `packages/generator-core` transforms validated configuration into a generation plan, safely renders templates, and packages output.
- `templates/` contains application output assets and feature fragments, separate from Forge's own application code.

Use pnpm workspaces initially. Turborepo is not required for the first release; it can be introduced if build/test orchestration or caching warrants it.

### Approaches considered

1. **Static browser-only generator:** easiest deployment, but large templates, server-side archive generation, and safe template composition become awkward. Not recommended for the intended modular template catalog.
2. **Web wizard plus generation API and shared TypeScript core (recommended):** keeps the browser focused on configuration and preview while generation rules are reusable, testable packages. It adds an API service, but avoids duplicating rules between UI and generator.
3. **CLI-first generator with a web wrapper:** strong local developer workflow, but makes the requested browser-first experience secondary and introduces package distribution concerns early.

## 7. Configuration model and compatibility

The wizard submits one versioned configuration document. The schema is the source of truth for allowed values and feature dependencies. The API revalidates every request; frontend validation is for user feedback only.

Illustrative configuration:

```json
{
  "schemaVersion": 1,
  "project": { "name": "commerce-app", "blueprint": "ecommerce", "shape": "fullstack" },
  "repository": { "layout": "monorepo", "packageManager": "pnpm", "taskRunner": "none" },
  "stack": {
    "language": "typescript",
    "backend": "nestjs",
    "frontend": "vue-vite",
    "database": "postgresql",
    "orm": "prisma"
  },
  "company": { "mode": "multi", "superAdminScope": "global" },
  "features": { "auth": true, "rbac": true, "navigation": "dynamic", "audit": true, "redis": false, "docker": true },
  "theme": { "preset": "modern-saas", "mode": "light", "primary": "#2563EB", "accent": "#F59E0B" }
}
```

Compatibility rules include, but are not limited to:

- ORM choices are limited to those supported by the selected backend/language.
- Socket.IO/realtime modules are offered only for compatible Node.js templates.
- Queue features declare their required queue adapter and infrastructure; Redis is recommended/required according to the selected implementation rather than silently assumed.
- Fullstack monorepo options require compatible frontend and backend packages.
- LocalStorage demo mode is not represented as secure multi-tenant persistence and cannot be combined with claims of server-enforced API authorization.
- A generated feature's files, dependencies, environment keys, navigation, permissions, tests, and docs are included or excluded together.

The registry reports a machine-readable reason for each disabled choice and validates dependency conflicts before generation.

## 8. Generated application foundation

The first full-stack template includes a clear monorepo boundary:

```text
generated-app/
├── apps/api/
├── apps/web/
├── packages/contracts/
├── packages/config/
├── prisma/
├── infra/                         # only when selected
├── pnpm-workspace.yaml
├── .env.example
└── README.md
```

The API is the authority for authentication, tenant resolution, role/permission enforcement, and audit events. Shared packages contain contracts/types, not privileged authorization decisions. The frontend may hide unavailable navigation entries for usability, but this is never treated as an authorization boundary.

### 8.1 Authentication, roles, and API protection

When enabled, generated API routes use a consistent guard sequence:

```text
Authentication → tenant/company scope → permission check → validation → handler → audit
```

Authentication uses configured token/session strategy, with secrets supplied through environment configuration. The initial template may provide JWT access/refresh tokens; token storage and rotation behavior must be documented and tested. API protection includes authentication guards, permission guards, input validation, centralized error handling, and configurable rate limiting where supported.

Permissions are resource/action based. The base action vocabulary is `VIEW`, `READ`, `CREATE`, `UPDATE`, and `DELETE`:

- `VIEW` gates visibility of a page/menu in the client.
- `READ` gates API data reads.
- `CREATE`, `UPDATE`, and `DELETE` gate the corresponding API mutations.
- Optional actions such as `APPROVE`, `EXPORT`, `IMPORT`, and `RESTORE` are declared by a blueprint/feature when needed.

Naming example: `catalog.product.view`, `catalog.product.read`, `catalog.product.create`, `catalog.product.update`, and `catalog.product.delete`. Backend enforcement is mandatory for every protected endpoint. Tests must verify denied requests even if callers invoke the API directly.

### 8.2 Dynamic Module, Menu, and Submenu

When dynamic navigation is enabled, the generated data model supports:

```text
Module → Menu → Submenu
```

Modules group functional areas. Menus and submenus have stable codes, labels, routes, optional icons, sort order, and active state. A parent reference represents nested menu items; hierarchy depth is bounded/documented for the first template. Navigation is returned for the authenticated user after role and permission filtering. Blueprint seeds populate initial navigation, while authorized administrators can manage navigation if the generated administration endpoints/UI are enabled.

Menu visibility and API permissions are separate: `VIEW` affects navigation; `READ/CREATE/UPDATE/DELETE` protect API operations.

### 8.3 Single Company and Multi Company

The configuration asks the user to choose Single Company or Multi Company.

- **Single Company:** one default company, no company switcher by default, and users operate within its scope.
- **Multi Company:** users may be associated with one or more companies; the UI provides a company switcher when permitted; APIs resolve and verify the active company on every tenant-scoped request.

The first relational template keeps a company key on tenant-scoped business records in both modes, so Single Company can evolve without a schema redesign. Users are linked to companies through memberships rather than assuming one user equals one company. Global records are explicitly classified as global; tenant-owned records must be filtered and authorized by company scope. Cross-company access is available only to a deliberately configured global root role and must be auditable.

The `superAdminScope` choice is `global` (root across companies) or `company` (administrator scoped to their company). A global root is modeled as a role/scope with explicit permissions, not as an unchecked boolean bypass. Tests cover cross-tenant read/write denial and root access boundaries.

### 8.4 Global Audit Trail

Global audit is part of the first enterprise-capable starter foundation and is enabled by default; it is not treated as an incidental UI feature. The generated application records security-relevant and business mutation events in an append-only audit log. Events include actor, action, entity/type, entity ID, company scope when applicable, timestamp, request/correlation ID, outcome, and safe metadata. Before/after snapshots may be included for configured fields; secrets, passwords, tokens, and other sensitive values must be redacted.

Login success/failure, permission/role changes, company switching, and create/update/delete actions are audited, so administrators can review what a user did and when. Not every ordinary `GET` is logged by default; sensitive reads and exports can be explicitly configured. Audit records are not editable/deletable through ordinary application APIs. The UI/API for viewing audit records is permission-protected. Audit writes should be transactionally consistent with the operation when possible, or use a documented reliable mechanism. The minimal profile may omit this enterprise foundation only if selected explicitly.

### 8.5 Seed and first admin setup

The generated project provides repeatable, idempotent seed commands for system roles, permissions, modules, menus/submenus, a default company, and blueprint-specific demo records. Stable codes/keys are used for upserts so rerunning seed does not duplicate records.

An initial admin is created from environment variables for development/bootstrap only, for example `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`. `.env` is ignored and never generated with a real password; `.env.example` contains placeholders and setup instructions. Passwords are hashed. Production guidance must require changing/removing bootstrap credentials or using an explicit first-run setup flow before exposing the service publicly.

Seed components are conditional: a disabled feature does not leave orphaned permissions or navigation. API-backed mode uses database seeds; a frontend-only demo may provide clearly labeled non-secure demo data and must not claim server-enforced RBAC, audit, or multi-company isolation.

## 9. Theme and generated frontend

The UI wizard offers theme presets such as Modern SaaS, E-commerce Store, Admin Dashboard, POS, Warehouse Industrial, Soft Pastel, Dark Developer, and Corporate. The MVP need not ship all presets; it should define a registry contract and one polished preset.

Color controls include curated palettes and a color picker; hue/saturation/brightness sliders are optional alternate controls, not the only way to choose color. Users can set primary/accent colors and light/dark mode. A live preview shows representative navigation, cards, tables, forms, and buttons. Contrast feedback should flag likely accessibility problems. The same validated tokens are emitted into the generated frontend (CSS custom properties and/or the selected styling system).

Theme controls may include border radius, shadow strength, and density only if the initial component system can apply them consistently. Avoid controls that change the preview but do not affect generated code.

## 10. Generation API and security

The API accepts a versioned config, validates it, creates an in-memory generation plan, renders only registered template files/fragments, and streams a ZIP response. The first release does not persist configurations or output archives.

Security requirements:

- Validate project names, package names, colors, enum values, and all config fields server-side.
- Resolve generated paths beneath an isolated output root; reject traversal, absolute paths, symlinks, and collisions.
- Escape template values according to file format; do not interpolate raw input into executable shell fragments.
- Never execute generated scripts, package managers, or user-provided code on the generator server.
- Exclude `.env`, credentials, and private user data from generated archives; emit placeholders only.
- Apply request size, generation-time, concurrency, and archive-size limits; clean temporary output after response/failure.
- Avoid logging source contents, secrets, or complete sensitive configuration payloads.
- Return structured validation errors and a correlation ID; do not expose stack traces in production responses.

Initial API surface:

- `GET /health`
- `GET /generator/catalog` — supported blueprints, stack options, feature rules, and themes.
- `POST /generator/validate` — validate and return normalized configuration/plan summary.
- `POST /generator/archive` — validate, generate, and return ZIP.

## 11. Error handling and user experience

Validation errors identify the affected choice and explain a resolution, e.g. “This ORM is not available for the selected backend.” Generation failures return a safe error code and correlation ID; the UI preserves the wizard configuration for retry. The review screen distinguishes required and optional capabilities and clearly labels demo-only or non-production choices.

The ZIP response includes a generated README with prerequisites, setup commands, migration/seed steps, environment configuration, test commands, and deployment limitations for the selected profile.

## 12. Testing strategy

- Unit tests for configuration schemas, compatibility rules, generation plans, path safety, token generation, and template composition.
- API tests for validation, archive response, error handling, request limits, and absence of persisted credentials.
- Generated-template integration tests for migrations, idempotent seeds, authentication, permission guards, tenant isolation, audit emission/redaction, and navigation filtering.
- Golden/structural tests for selected generated files and feature inclusion/exclusion.
- Frontend tests for wizard dependencies, review summary, accessible form controls, theme preview/token parity, and error recovery.
- End-to-end smoke test: configure supported full-stack template, generate ZIP, unpack to a temporary directory, install/check/build/test it in CI, and confirm README commands match actual scripts.

## 13. Delivery phases

1. **Foundation:** repository conventions, pnpm workspace, TypeScript/lint/test config, contracts, registry types, CI, documentation.
2. **First generation vertical slice:** one TypeScript NestJS + Vue/Vite + PostgreSQL/Prisma template, config validation, deterministic plan, safe ZIP output, README.
3. **Wizard and live preview:** project choices, stack compatibility, feature toggles, review/tree preview, one theme preset and tokens.
4. **Application foundation:** auth, RBAC, dynamic navigation, single/multi-company scope, root-scope option, global audit, idempotent seeds, and generated-template tests.
5. **Expansion:** additional blueprints and optional integrations (Redis, queue, realtime, SMTP, uploads, CI/deployment profiles), then other language/framework template packs.
6. **GitHub output (later):** create repository/push only through explicit user-authorized GitHub integration, with secure OAuth/token handling and a separate design review.

Phases 1–4 form the initial product target, but should be delivered as small vertical increments; all modules need not be generated in the first commit.

## 14. Open product decisions

These do not block the architecture but must be resolved before their relevant implementation phase:

- Whether initial-admin setup remains environment-seed-only or includes a first-run setup UI.
- Exact MVP blueprint choice beyond Blank Fullstack and the proposed E-commerce template.
- Exact set of theme presets in the first release.
- Whether the wizard saves drafts locally and for how long.
- Which deployment profiles are actually verified in the first template.
- Whether GitHub output is in scope after ZIP generation and which authentication/integration path will be used.

## 15. Acceptance criteria for the design

The architecture is ready for implementation planning when the user confirms this specification. Implementation then begins with the foundation phase and does not assume access to a GitHub remote until the repository is created or linked. User approval of this specification is separate from approval of the subsequent implementation plan and execution method.
