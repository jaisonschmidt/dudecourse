# 2. Monorepo Layout

- **Status:** Accepted
- **Date:** 2026-08-25
- **Related:** [ADR 0001 — Tech Stack](0001-tech-stack.md), [ARCHITECTURE.md](../ARCHITECTURE.md)

## Context

[ADR 0001](0001-tech-stack.md) selected Nx as the monorepo tool. Nx supports several workspace
styles (package-based, integrated, standalone), and the way projects are grouped determines how
dependencies between them can be constrained.

Four projects are planned, plus one that emerged from the analysis:

- the Angular 17 portal frontend,
- a shared UI component library, reusable by future modules,
- an API exposing authentication and database access,
- a database project tracking schema creation and modification,
- **a shared domain library** — not originally listed, but without it the portal and the API each
  define their own copies of the same DTOs and entity types, which drift apart over time.

## Decision

Use an **Nx integrated monorepo** with an `apps/` + `libs/` layout.

```
apps/
  portal/            Angular 17 portal frontend       (deployable)
  api/               Fastify API                      (deployable)
libs/
  ui/                Shared Angular component library (buildable, internal)
  database/          Prisma schema, client, migrations
  shared/domain/     DTOs and entity types shared by portal and api
```

`apps/` holds deployable artifacts; `libs/` holds everything consumed by them. Libraries are
consumed through TypeScript path aliases (`@dudecourse/ui`, `@dudecourse/database`,
`@dudecourse/shared-domain`) declared in `tsconfig.base.json`.

### Project tags

Every project declares two tags in its `project.json`:

- `type:app` or `type:lib`
- `scope:portal`, `scope:api`, `scope:ui`, `scope:shared`, or `scope:db`

### Dependency rules

Enforced by `@nx/enforce-module-boundaries` in the root ESLint config:

| From           | May depend on              |
| -------------- | -------------------------- |
| `scope:portal` | `scope:ui`, `scope:shared` |
| `scope:api`    | `scope:db`, `scope:shared` |
| `scope:ui`     | `scope:shared`             |
| `scope:shared` | nothing                    |
| `scope:db`     | nothing                    |

The two rules that matter most:

- **The portal can never reach the database.** All data access goes through the API.
- **The UI library can never reach the API or the database.** It stays presentational, which is what
  makes it reusable by future modules.

These rules are configured _before_ the first project is generated, so the first project has to
comply rather than being retrofitted.

### The UI library is buildable, not publishable

It is consumed inside this monorepo via path aliases, so it does not need to be published to a
registry. It is still _buildable_ (ng-packagr), which validates that it has no accidental
dependencies on app-level code and keeps the option of publishing open if a future module ever lives
in a separate repository.

## Consequences

### Positive

- `nx affected` can scope lint/test/build to only what changed, because the project graph is real.
- Architectural rules are enforced by lint rather than by convention or code review.
- The portal and API cannot drift on shared contracts, because both import them from one library.

### Negative

- Five projects is more ceremony than a single application would need at this stage.
- Contributors must know where new code belongs; this is documented as a decision table in
  [ONBOARDING.md](../ONBOARDING.md).
- Adding a project requires setting tags correctly, or the boundary rules silently do nothing.

## Alternatives Considered

| Alternative                         | Why not                                                                                                                          |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Package-based `packages/` only      | Rejected: every project becomes a publishable package with its own build config; unnecessary overhead when nothing is published. |
| `apps/` + `packages/`               | Rejected: the same as the chosen layout but with naming that implies publishing.                                                 |
| Standalone Angular app, no monorepo | Rejected: cannot host the API, the database project, or a shared library.                                                        |
| No shared domain library            | Rejected: guarantees duplicated, drifting DTO definitions between portal and API.                                                |
