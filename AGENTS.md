# AGENTS.md

## Project

Dude Course is a web portal. Consult [docs/PRD.md](docs/PRD.md) whenever you need clarification
about the product — what it does, who it's for, or what a feature should behave like. That document
is the source of truth for product scope and behavior — do not invent features or requirements
beyond what it describes. If a request conflicts with the PRD, flag the conflict to the user instead
of silently deviating.

## Current Status

The **Nx monorepo scaffold exists**, but **no applications or libraries have been created yet**.
`apps/` and `libs/` are empty by design.

The stack has been chosen and recorded — see [docs/adr](docs/adr/). Do not re-decide it.

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — how the system is structured, including the planned
  projects and the dependency rules between them.
- [docs/ONBOARDING.md](docs/ONBOARDING.md) — setup, commands, and the exact generator command for
  each planned project.

## Stack (decided — see [ADR 0001](docs/adr/0001-tech-stack.md))

Nx `19.8.14` · Angular `17.3.12` · Fastify · PostgreSQL + Prisma · npm · Node `20.11.0`

### Version pinning — read before touching dependencies

Angular 17 is a fixed requirement and it constrains everything else:

- **All `@nx/*` packages must stay on the same version (`19.8.14`).** Nx 20+ cannot generate Angular
  17 projects.
- **`@angular/core@17.3.12` must remain in `dependencies`,** even though no Angular app exists yet.
  `@nx/angular` defaults to Angular 18 and only generates Angular 17 when it detects an installed
  Angular 17. Removing it silently produces Angular 18 projects.
- **Node must be 20.x.** Angular 17 does not support Node 22+.
- **Never run `npm audit fix --force`.** It breaks the Angular pin. Outstanding advisories come from
  the Angular 17-era toolchain and are a known, accepted consequence.

Full rationale: [ARCHITECTURE.md §6](docs/ARCHITECTURE.md#6-version-pinning).

## Commands

```sh
nvm use && npm install     # setup (Node 20.11.0)
npm run lint               # lint all projects
npm run test               # unit tests
npm run build              # build all projects
npm run format             # apply Prettier
npm run affected:lint      # scope to changed projects (prefer while working)
npm run graph              # visualize the project graph
```

Commands operating on "all projects" are currently no-ops — there are no projects.

## Working Agreements for AI Agents

- **Create projects only with Nx generators**, never by hand-copying folders. The exact commands are
  in [docs/ONBOARDING.md](docs/ONBOARDING.md#5-creating-a-project).
- **Every project must declare a `type:` and a `scope:` tag.** An untagged project is silently
  exempt from the module boundary rules, which defeats the architecture.
- **Respect the dependency rules** in [ARCHITECTURE.md §5](docs/ARCHITECTURE.md#5-dependency-rules).
  Notably: the portal must never import the database library, and the UI library must stay
  presentational. If a boundary lint error appears, move the code — do not add an exception to
  `.eslintrc.json`.
- The stack is already decided. **Do not introduce a new framework, database, or ORM** without
  proposing it first and recording the outcome in a new ADR.
- Once a new architectural decision is made, record it in a new ADR under `docs/adr/` (numbered
  sequentially) so future work — human or AI — has that context without re-deciding it.
- Keep [docs/PRD.md](docs/PRD.md) as the single source of truth for product requirements. If new
  product decisions are made during implementation, update the PRD (or its Open Questions section)
  rather than letting decisions live only in code or chat history.
- Ask before making structural or hard-to-reverse decisions (e.g., choosing a database, changing the
  auth model, altering the data model in ways that affect existing data).
- Keep this file (`AGENTS.md`) up to date as the project evolves.
