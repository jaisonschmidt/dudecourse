# 1. Tech Stack

- **Status:** Accepted
- **Date:** 2026-08-25
- **Supersedes:** —
- **Related:** [ADR 0002 — Monorepo Layout](0002-monorepo-layout.md), [PRD](../PRD.md)

## Context

Dude Course (see [PRD](../PRD.md)) is a course portal with a learner-facing web frontend, an API
handling authentication and data access, and a relational data store for users, courses, lessons,
enrollments, progress, and certificates. Future modules beyond the portal are anticipated, so shared
UI components must be reusable across them.

Before this decision the repository was pre-implementation: no framework, runtime, or database had
been chosen, and `AGENTS.md` explicitly forbids picking a stack unilaterally.

The single hard constraint given by the project owner is **Angular v17** for the portal frontend.
Everything else was selected to be consistent with that constraint and with a TypeScript-everywhere
codebase.

## Decision

| Concern            | Choice                                                      |
| ------------------ | ----------------------------------------------------------- |
| Monorepo tooling   | **Nx**, pinned to **~19.x**                                 |
| Frontend framework | **Angular 17** (standalone components)                      |
| Shared UI          | **Buildable, internal-only** Angular library (ng-packagr)   |
| API framework      | **Fastify**, generated via `@nx/node`                       |
| Database           | **PostgreSQL**                                              |
| ORM / migrations   | **Prisma** (`prisma migrate` as the schema source of truth) |
| Package manager    | **npm**                                                     |
| Runtime            | **Node.js 20 LTS**                                          |

### Why Nx pinned to 19.x

The `@nx/angular` plugin only supports a rolling window of Angular versions. Nx 20 and later target
Angular 18/19 and no longer generate Angular 17 projects. Nx 19 is therefore the newest Nx line that
can satisfy the Angular 17 constraint, and the whole workspace is pinned to it.

All `@nx/*` plugins must stay on the same version. Mixing plugin versions is the most common cause
of Nx generator and migration failures, so the plugin set is installed together and upgraded
together.

### Why Node 20

Angular 17 supports Node 18 and 20 only; it does not support Node 22. Node 20 LTS is pinned via
`.nvmrc` and the `engines` field so contributors and CI agree on the runtime.

### Why Fastify over NestJS

NestJS is the more conventional pairing with Angular and has a first-class Nx plugin. Fastify was
chosen deliberately for a lighter runtime and a smaller conceptual surface: the v1 API is a modest
set of endpoints (auth, catalog, enrollment, progress, certificates) and does not need Nest's
module/DI framework. The trade-off is more manual wiring for cross-cutting concerns.

### Why Prisma

The PRD requires a durable relational model with reliable progress tracking. Prisma gives a single
declarative schema file that doubles as the migration source of truth, a generated fully-typed
client, and a migration history that can be reviewed in pull requests — which satisfies the "track
database creation and modification" requirement directly.

### Why npm

Chosen by the project owner. It is the default for `create-nx-workspace` and requires no extra
tooling on contributor machines or in CI.

## Consequences

### Positive

- One language (TypeScript) across portal, UI library, API, and database layer.
- Nx caching, `nx affected`, and the project graph apply uniformly to every project.
- Angular 17 is well documented and stable; standalone components avoid legacy NgModule structure.
- The Prisma schema and migration history make database changes reviewable.

### Negative / Risks

- **Angular 17 is past its LTS window.** It receives no further patches, including security patches.
  This is accepted for now as an explicit constraint, not an oversight.
- Pinning Angular 17 pins Nx to 19, which in turn pins the plugin set. The workspace cannot adopt
  newer Nx features until Angular is upgraded.
- Fastify means auth, validation, and error handling are hand-rolled rather than provided by a
  framework.

### Migration path out of Angular 17

When the Angular 17 constraint is lifted, upgrade in this order — each step is a separate change:

1. `npx nx migrate latest` within the Nx 19 line, then run the generated migrations.
2. Upgrade Nx 19 → 20, which brings Angular 17 → 18 (`nx migrate` handles both together).
3. Upgrade Nx 20 → 21, which brings Angular 18 → 19.
4. Remove the Angular `overrides` pin from `package.json` once the workspace is off 17.
5. Re-evaluate the Node pin; Angular 19 supports Node 22.

Do not jump Angular versions directly — `nx migrate` expects one major at a time.

## Alternatives Considered

| Alternative                                   | Why not                                                                                                     |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Latest Angular + latest Nx                    | Rejected: conflicts with the Angular 17 premise.                                                            |
| NestJS for the API                            | Viable and more conventional; rejected in favour of a lighter runtime for a small v1 API surface.           |
| Express for the API                           | Rejected: Fastify offers better performance and built-in schema validation for comparable simplicity.       |
| TypeORM                                       | Rejected: entity-first migrations are harder to review than Prisma's declarative schema plus generated SQL. |
| Raw SQL migrations (Flyway / node-pg-migrate) | Rejected: no generated types, so the API would lose end-to-end type safety.                                 |
| pnpm                                          | Rejected by the project owner in favour of npm.                                                             |
