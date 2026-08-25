# Onboarding — Dude Course

Everything you need to be productive in this repository.

> **Read this first:** the workspace is scaffolded but **empty**. There are no applications or
> libraries yet. If you are here to create the first one, jump to
> [Creating a project](#5-creating-a-project) — the exact commands are written out for you.

## 1. What this project is

Dude Course is a portal for sharing courses hosted on YouTube. Learners browse a catalog, enroll,
watch lessons, and get a certificate when they finish.

| Document                           | Purpose                                                  |
| ---------------------------------- | -------------------------------------------------------- |
| [PRD.md](PRD.md)                   | **What** the product does. Source of truth for behavior. |
| [ARCHITECTURE.md](ARCHITECTURE.md) | **How** the system is structured.                        |
| [adr/](adr/)                       | **Why** each technical decision was made.                |
| [AGENTS.md](../AGENTS.md)          | Working agreements, including for AI assistants.         |

Do not invent features that are not in the PRD. If a request conflicts with it, raise the conflict
rather than quietly deviating.

## 2. Prerequisites

| Tool    | Version     | Notes                                                             |
| ------- | ----------- | ----------------------------------------------------------------- |
| Node.js | **20.11.0** | Pinned in `.nvmrc`. Angular 17 does **not** support Node 22+.     |
| npm     | 10+         | Ships with Node 20.                                               |
| Git     | any recent  |                                                                   |
| Docker  | optional    | For running PostgreSQL locally, once the database project exists. |

**Use the pinned Node version.** This is not optional — Angular 17 builds fail on newer runtimes:

```sh
nvm install   # reads .nvmrc
nvm use
node --version   # must print v20.11.0
```

If you do not use `nvm`, install Node 20 by whatever means you prefer. `npm install` will warn about
an engine mismatch on the wrong version, but it will not stop you — the failure surfaces later,
during builds, which is far more confusing. Check `node --version` first.

## 3. Setup

```sh
git clone https://github.com/jaisonschmidt/dudecourse.git
cd dudecourse
nvm use
npm install
```

Verify the workspace is healthy:

```sh
npx nx --version   # Local: v19.8.14
npx nx graph       # opens the project graph (currently empty)
```

### About `npm audit`

`npm audit` reports advisories inherited from the Angular 17-era toolchain. They cannot be fixed
without upgrading Angular, which is currently a fixed constraint.

**Do not run `npm audit fix --force`.** It will pull Angular past 17 and break the pinned setup. See
[ARCHITECTURE.md §6](ARCHITECTURE.md#6-version-pinning).

## 4. Everyday commands

Nx caches results, so re-running an unchanged target is nearly instant.

| Command                | What it does                              |
| ---------------------- | ----------------------------------------- |
| `npm run graph`        | Visualize projects and their dependencies |
| `npm run lint`         | Lint every project                        |
| `npm run test`         | Unit tests for every project              |
| `npm run build`        | Build every project                       |
| `npm run format`       | Apply Prettier formatting                 |
| `npm run format:check` | Verify formatting (use in CI)             |

Scoped to what you actually changed — prefer these while working:

```sh
npm run affected:lint
npm run affected:test
npm run affected:build
```

Targeting one project:

```sh
npx nx build portal
npx nx test ui
npx nx lint api
npx nx run-many -t lint test --projects=portal,ui
```

Useful diagnostics:

```sh
npx nx show project portal --web   # targets and config for one project
npx nx reset                       # clear the Nx cache when something looks stale
```

## 5. Creating a project

Projects **must** be created with Nx generators, never by hand-copying folders. Generators wire up
build targets, TypeScript path aliases, and lint config correctly.

Every project **must** declare a `type:` tag and a `scope:` tag. A project without tags is exempt
from the module boundary rules, which silently defeats the architecture.

Add `--dry-run` to any of these to preview without writing files.

### Portal — Angular 17 SPA

```sh
npx nx g @nx/angular:application portal \
  --directory=apps/portal \
  --tags=type:app,scope:portal
```

Style, prefix (`dc`), standalone components, Jest, and Playwright are already set as defaults in
`nx.json` — you do not need to pass them.

Afterwards, confirm the pin held:

```sh
node -p "require('./package.json').devDependencies['@angular/cli']"   # expect ~17.3.0
```

### API — Fastify

```sh
npx nx g @nx/node:application api \
  --directory=apps/api \
  --framework=fastify \
  --tags=type:app,scope:api
```

### UI library — buildable Angular library

```sh
npx nx g @nx/angular:library ui \
  --directory=libs/ui \
  --buildable \
  --tags=type:lib,scope:ui
```

### Shared domain library

```sh
npx nx g @nx/js:library domain \
  --directory=libs/shared/domain \
  --bundler=none \
  --tags=type:lib,scope:shared
```

### Database library

```sh
npx nx g @nx/js:library database \
  --directory=libs/database \
  --bundler=tsc \
  --tags=type:lib,scope:db
```

Then add Prisma inside it, with `schema.prisma`, the migration history, and a seed script. Since v1
has no admin UI, seeding is the intended way to get courses and lessons into the catalog.

## 6. Where does my code go?

| You are writing…                         | It belongs in        | Import alias                |
| ---------------------------------------- | -------------------- | --------------------------- |
| A screen, route, or page                 | `apps/portal`        | —                           |
| A reusable, presentational component     | `libs/ui`            | `@dudecourse/ui`            |
| An HTTP endpoint or auth logic           | `apps/api`           | —                           |
| A DTO or type used by portal **and** API | `libs/shared/domain` | `@dudecourse/shared-domain` |
| A schema change, migration, or query     | `libs/database`      | `@dudecourse/database`      |

Rules of thumb:

- **A component that fetches data does not belong in `libs/ui`.** Keep the library presentational —
  inputs and outputs only. That is what makes it reusable by future modules.
- **The portal must never import `@dudecourse/database`.** All data access goes through the API.
- If two projects need the same type, it goes in `libs/shared/domain` — do not copy it.

The first two are enforced by lint. If you see an error like:

```
A project tagged with "scope:portal" can only depend on libs tagged with "scope:portal", "scope:ui", "scope:shared"
```

…that is the architecture working as intended, not a misconfiguration. Move the code rather than
adding an exception. The full matrix is in [ARCHITECTURE.md §5](ARCHITECTURE.md#5-dependency-rules).

## 7. Conventions

- **Formatting** is Prettier's job — do not hand-format. Run `npm run format` before committing.
- **Angular components** are standalone with `OnPush` change detection and the `dc` prefix
  (`<dc-course-card>`), all preset in `nx.json`.
- **Styles** are SCSS.
- **Tests** live beside the code they cover as `*.spec.ts`.

## 8. Making a change

1. Create a branch off `main`.
2. Make the change.
3. Run `npm run affected:lint && npm run affected:test`.
4. Run `npm run format`.
5. Open a PR describing **what** changed and **why**.

If your change is an architectural decision — a new dependency between projects, a new database, a
change to the auth model — add an ADR under [docs/adr](adr/) in the same PR. Number it sequentially
and follow the format of the existing ones.

If it changes what the product _does_, update [PRD.md](PRD.md) too.

## 9. Troubleshooting

| Symptom                                     | Cause / fix                                                                                                                                       |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EBADENGINE` warning on install             | Wrong Node version. `nvm use`, then check `node --version` is 20.11.0.                                                                            |
| Angular build fails with cryptic errors     | Almost always Node 22+. Same fix as above.                                                                                                        |
| Generator created an Angular **18** project | `@angular/core@17.3.12` was removed from `dependencies`. Restore it and regenerate — see [ARCHITECTURE.md §6](ARCHITECTURE.md#6-version-pinning). |
| `enforce-module-boundaries` lint error      | Intentional. Your import crosses an architectural boundary — see §6 above.                                                                        |
| Import of a new lib not resolving           | The path alias in `tsconfig.base.json` is missing; it is added by the generator. Confirm you used a generator.                                    |
| Stale or inexplicable build output          | `npx nx reset`, then retry.                                                                                                                       |
| `nx graph` shows no projects                | Expected — nothing has been generated yet.                                                                                                        |

## 10. Getting help

- Nx documentation: <https://nx.dev>
- Angular 17 documentation: <https://v17.angular.io>
- Ask in the PR or open an issue on the repository.
