# Backend module structure

NestJS business modules are grouped by responsibility under `apps/api/src/master/` or `apps/api/src/transaction/`. Infrastructure features such as auth, RBAC, audit, logging, and Redis remain in their own feature folders.

A master module follows this layout:

```text
apps/api/src/master/employee/
├── dto/
│   ├── create-employee.dto.ts
│   └── update-employee.dto.ts
├── employee.controller.ts
├── employee.service.ts
└── employee.module.ts
```

A transaction module uses the same structure at `apps/api/src/transaction/<module>/`. Add a transaction folder only when a transaction module exists; do not add placeholder business domains.

- `dto/` contains concrete request/response classes and validation decorators. DTOs describe client input and must not accept tenant ownership fields.
- `*.controller.ts` handles HTTP routes and request/response mapping.
- `*.service.ts` contains business logic and database operations.
- `*.module.ts` registers the module's controllers, providers, and imports.

Keep the Prisma schema in `prisma/schema.prisma`, migrations under `prisma/migrations/`, and seed entrypoint and feature seed files under `prisma/seed/`.
