# Generated Domain Module Architecture

## Context

Project Forge generates NestJS projects from a collection of template files and
feature fragments. The generated API currently places feature files in
`apps/api/src/<feature>/`. Business domains and infrastructure integrations
therefore share the same top-level layout. Prisma starts with one
`prisma/schema.prisma`; when RBAC is enabled, its seed entrypoint is currently
placed directly at `prisma/seed.mjs`.

The generator needs a consistent convention for business modules, DTOs, and
Prisma support files. The employee master example should demonstrate the
convention, and transaction modules should have the same internal structure.

## Goals

- Group business modules under `master/` or `transaction/` according to their
  domain responsibility.
- Give each generated business module a predictable `dto/` folder and its own
  controller, service, and Nest module.
- Keep infrastructure features such as auth, RBAC, logging, and Redis in their
  existing feature-oriented locations.
- Make the existing generated business example follow the new convention.
- Keep Prisma schema, migrations, and seed code clearly organized without
  splitting the schema into multiple files.
- Document the convention so future generator modules follow it by default.

## Proposed architecture

### Business module layout

The employee master example uses this layout:

```text
apps/api/src/master/employee/
├── dto/
│   ├── create-employee.dto.ts
│   └── update-employee.dto.ts
├── employee.controller.ts
├── employee.service.ts
└── employee.module.ts
```

Transaction modules use the same internal layout beneath
`apps/api/src/transaction/<module>/`. A module's DTOs describe its HTTP input
and output shapes; controllers handle HTTP concerns; services own business
logic; and modules register their providers and controllers with NestJS.

Do not add an empty transaction directory or invent a sample transaction
business domain solely to make the directory appear. When a transaction module
is included in a generated blueprint, it must use the transaction path and the
same module layout. The convention belongs in the generator's architecture
guidance and reusable templates.

Infrastructure features are not reclassified as business modules. Auth,
RBAC, audit, Redis, and similar integrations remain under their current
feature-oriented API paths.

### Existing business examples

The generated employee master example demonstrates the standard layout.
Existing e-commerce product files are business-domain files and move to
`apps/api/src/master/products/`, including their controller, service, module,
permissions, and tests. Their imports and permission registration must follow
the new paths. This design does not add an order, payment, or other transaction
domain that the generator does not currently model.

### DTO behavior

Business request DTOs are concrete TypeScript classes stored in each module's
`dto/` directory. Create and update DTOs are separate files when both request
shapes exist. DTO validation must use the same Nest validation mechanism and
dependencies throughout the generated API; it must not introduce a second
validation convention in individual modules.

### Prisma layout

Keep `prisma/schema.prisma` as the single canonical schema file, and retain
Prisma's standard `prisma/migrations/` directory. Put seed implementation
files under `prisma/seed/`, with one `prisma/seed/index.mjs` entrypoint for the
package `db:seed` script. Feature-specific seed functions live in separate
files under that directory and are composed by the entrypoint. If no seed
feature is enabled, generated projects should not receive an unused seed
directory or entrypoint.

### Generation compatibility

The folder convention applies only to generated NestJS APIs. Frontend-only and
Laravel outputs are unchanged. API-only output follows the same business
module paths when it includes the database-backed employee example. Generated
file manifests, imports, tests, seed scripts, and README references must stay
consistent with each selected project shape and feature set.

## Alternatives considered

1. **Keep all feature folders flat.** This avoids moves but does not separate
   business domains from integrations and does not establish the requested
   master/transaction convention.
2. **Move every API feature under a business category.** This would put
   infrastructure integrations into domain groupings and make those groups
   less meaningful. The design keeps infrastructure features separate.
3. **Split Prisma into multiple schema files.** This adds schema discovery and
   generation concerns that are not needed to organize seed code. The design
   keeps the schema canonical and organizes seed implementation files.

## Scope boundaries

- No new wizard choice or configuration flag is introduced for module
  placement; it is a generator convention.
- No transaction business model is invented as a placeholder.
- No Laravel or frontend architecture changes are included.
- Prisma models are not split across files.
- Existing generated infrastructure features are not moved into `master/` or
  `transaction/`.

## Acceptance criteria

- The employee master example is generated under `master/employee/` with a
  `dto/` directory, controller, service, and module.
- Generated e-commerce product files are grouped under `master/products/`,
  and generated imports and permission paths resolve to those locations.
- The architecture guidance states how future master and transaction modules
  are laid out and explains the DTO/controller/service/module responsibilities.
- Seed code, when present, is organized under `prisma/seed/` and invoked
  through its single entrypoint; the Prisma schema remains at
  `prisma/schema.prisma`.
- Generated projects without a seed feature contain no unused seed files.
- Generated file plans do not include the new business examples in
  frontend-only or Laravel projects.

## Verification approach

Generation plan and archive checks should cover the employee module, the
re-homed e-commerce module, Prisma seed inclusion and omission, and
frontend-only/Laravel exclusions. Generated NestJS projects should also be
typechecked so moved imports, DTO dependencies, and module registration are
validated together.
