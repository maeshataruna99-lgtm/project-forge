# Project Forge

Project Forge is a browser-based starter project generator under development. The first target is a TypeScript fullstack starter with NestJS, Vue 3/Vite, PostgreSQL, Prisma, and a pnpm monorepo. The [design specification](docs/superpowers/specs/2026-09-23-project-forge-design.md) describes the product and phased delivery.

## Current foundation

This repository currently contains the versioned configuration schema and the first template compatibility registry. The schema validates names, enum choices, feature flags, and theme colors. The registry explains unsupported choices with machine-readable codes. There is no running web application, generation API, or downloadable starter archive yet.

The linked upstream fullstack developer agent is copied verbatim to [`.claude/agents/fullstack-developer.md`](.claude/agents/fullstack-developer.md). Its React/Drizzle defaults describe that external agent; the Project Forge design specification sets this project's NestJS/Vue/Prisma stack.

## Development

Prerequisites: Node.js 22 or newer and pnpm 9.

```sh
pnpm install
pnpm test
pnpm typecheck
```

## Delivery sequence

1. Foundation: workspace, contracts, and compatibility registry (current increment).
2. First generation slice: API validation and archive endpoints, safe file planning/ZIP packaging, and a runnable blank fullstack starter.
3. Wizard and live theme preview wired to the shared catalog.
4. Generated application foundation: authentication, RBAC, dynamic navigation, company scoping, audit, and idempotent seeds.

The [foundation plan](docs/superpowers/plans/2026-09-23-foundation.md) records the work in this increment.
