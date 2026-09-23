# Project Forge

Project Forge is a browser-based starter project generator. The first target is a TypeScript fullstack starter with NestJS, Vue 3/Vite, PostgreSQL, Prisma, and a pnpm monorepo. The [design specification](docs/superpowers/specs/2026-09-23-project-forge-design.md) describes the product and phased delivery.

## Current slice

This repository contains the versioned configuration schema, compatibility registry, NestJS generation API, browser wizard, and one downloadable Blank Fullstack starter template. The wizard guides configuration, previews the theme and generated file tree, validates through the API, and downloads the ZIP. It saves drafts in the browser. The first ZIP requires an explicit minimal profile; enterprise template features remain a future increment.

The linked upstream fullstack developer agent is copied verbatim to [`.claude/agents/fullstack-developer.md`](.claude/agents/fullstack-developer.md). Its React/Drizzle defaults describe that external agent; the Project Forge design specification sets this project's NestJS/Vue/Prisma stack.

## Development

Prerequisites: Node.js 22 or newer and pnpm 9.

```sh
pnpm install
pnpm test
pnpm typecheck
pnpm web:build
```

Start the API and web app in separate terminals:

```sh
pnpm --filter @project-forge/api dev
pnpm --filter @project-forge/web dev
```

Open the URL printed by Vite. The web development server proxies `/generator` and `/health` to the API on port 3000. For production, serve the built web app and API under one origin: route `/generator/*` and `/health` to the API, and serve web assets for other paths. The browser calls relative API URLs.

The current supported configuration is the [minimal example](examples/minimal-config.json): Blank Fullstack, fullstack monorepo, TypeScript, NestJS, Vue 3/Vite, PostgreSQL, Prisma, pnpm, single company, and minimal profile with enterprise features disabled. The wizard disables unsupported catalog choices and explains why; supported theme modes and colors remain editable. The API serves `GET /health`, `GET /generator/catalog`, `POST /generator/validate`, and `POST /generator/archive` on port 3000. Send the example configuration as JSON to either POST endpoint; archive returns `sample-app.zip`.

To unpack a sample archive into a temporary directory for verification, run `pnpm smoke:extract` and use the printed path. The generated README lists its own setup, build, test, and migration commands.

## Delivery sequence

1. Foundation: workspace, contracts, and compatibility registry (complete).
2. First generation slice: API validation and archive endpoints, safe file planning/ZIP packaging, and a runnable blank fullstack starter (complete).
3. Wizard and live theme preview wired to the shared catalog (complete).
4. Generated application foundation: authentication, RBAC, dynamic navigation, company scoping, audit, and idempotent seeds.

The [foundation plan](docs/superpowers/plans/2026-09-23-foundation.md) and [web wizard plan](docs/superpowers/plans/2026-09-23-project-forge-web-wizard.md) record the completed slices.
