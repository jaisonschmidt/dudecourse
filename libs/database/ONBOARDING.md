# Database Library Onboarding

This guide teaches new developers and AI agents how to work safely and effectively with the
database library at `libs/database`.

Use this file for day-to-day operations. Use the repository guides for deeper policy details:

- [Database Guide](../../docs/DATABASE.md)
- [Architecture](../../docs/ARCHITECTURE.md)
- [ADR 0003 - Database Lifecycle](../../docs/adr/0003-database-lifecycle.md)
- [ADR 0004 - Initial Data Model](../../docs/adr/0004-initial-data-model.md)

## 1. What This Library Owns

`libs/database` owns:

- Prisma schema: `libs/database/prisma/schema.prisma`
- Migration history: `libs/database/prisma/migrations/`
- Seed entry point: `libs/database/prisma/seed.ts`
- Prisma client boundary: `libs/database/src/lib/database.ts`

Architectural rule: only the API app may directly depend on this library. The portal must never
import it.

## 2. Environment Safety Rules

| Rule | Local | HML | PRD |
| --- | --- | --- | --- |
| Create migrations (`migrate dev`) | Allowed | Forbidden | Forbidden |
| Apply committed migrations (`migrate deploy`) | Allowed | Allowed via workflow | Allowed via protected workflow |
| Reset database (`db:reset`) | Allowed | Forbidden | Forbidden |
| Seed data (`db:seed`) | Allowed (`APP_ENV=local`) | Allowed (`APP_ENV=hml`) | Forbidden |

Do this:

- Treat migration SQL as reviewable code.
- Commit schema and migration changes together.
- Promote the exact HML-tested revision to PRD.

Do not do this:

- Do not run `prisma db push` in this project workflow.
- Do not modify old migrations once they have reached HML.
- Do not run reset, seed, or dev migration commands against hosted databases.

## 3. First-Time Setup (Local)

Run from repository root:

```sh
nvm use
npm install
cp .env.example .env
npm run db:up
npm run db:migrate:deploy
```

Expected result:

- Local PostgreSQL is running in Docker.
- Committed migrations are applied.
- Prisma can connect through `DATABASE_URL`.

## 4. Command Map You Will Use Most

All commands below run from repository root.

| Intent | Command |
| --- | --- |
| Start local PostgreSQL | `npm run db:up` |
| Stop local PostgreSQL | `npm run db:down` |
| Watch PostgreSQL logs | `npm run db:logs` |
| Validate Prisma schema | `npm run db:validate` |
| Regenerate Prisma client | `npm run db:generate` |
| Create and apply local migration | `npm run db:migrate -- --name <name>` |
| Apply committed migrations only | `npm run db:migrate:deploy` |
| Check migration status | `npm run db:migrate:status` |
| Seed local or HML-safe fixtures | `npm run db:seed` |
| Open Prisma Studio | `npm run db:studio` |
| Rebuild local DB from committed history | `npm run db:reset` |

## 5. Standard Workflow: Schema Change

1. Start database: `npm run db:up`
2. Edit `libs/database/prisma/schema.prisma`
3. Create migration: `npm run db:migrate -- --name <descriptive-name>`
4. Review generated SQL in the new folder under `libs/database/prisma/migrations/`
5. Validate and generate client:

```sh
npm run db:validate
npm run db:generate
```

6. Prove clean rebuild works:

```sh
npm run db:reset
```

7. Run quality checks:

```sh
npm run affected:lint
npm run affected:test
npm run affected:build
```

8. Commit schema and migration folder in the same change.

Migration naming examples:

- Good: `add_certificate_serial_code`
- Good: `add_course_published_at_index`
- Avoid: `update_schema`

## 6. Standard Workflow: Updating Seeded Catalog Content

Until an admin UI exists, `libs/database/prisma/seed.ts` is the content-entry path for v1 catalog
courses and lessons.

1. Edit fixtures in `libs/database/prisma/seed.ts`
2. Ensure local environment allows seeding (`APP_ENV=local`)
3. Run:

```sh
npm run db:seed
```

Notes:

- Seed is idempotent by design (upsert-based).
- Removing a lesson from fixtures removes lessons beyond declared positions for that course.
- Production seed path is intentionally unavailable.

## 7. AI Agent Operating Checklist

Use this checklist before and after database changes.

Before change:

1. Confirm target environment is local unless explicitly performing approved hosted migration steps.
2. Read current `schema.prisma`, newest migration folder, and `seed.ts` if content data is touched.
3. Confirm command choice matches policy (dev vs deploy migration commands).

After change:

1. Review migration SQL for correctness and safety.
2. Run `db:validate`, `db:generate`, and relevant affected checks.
3. Verify reset/rebuild when migration history changed.
4. Ensure no forbidden hosted operation was performed.

## 8. Troubleshooting

Port conflict (5432 already in use):

- Update local `.env` `POSTGRES_PORT` and the `DATABASE_URL` port consistently.

Container unhealthy:

- Run `npm run db:logs`
- Confirm Docker has resources and local env values are correct.

Missing `DATABASE_URL`:

- Recreate local `.env` from `.env.example`.

Migration drift warning:

- Do not reset shared environments.
- Create a corrective forward migration.

Seed rejected by environment guard:

- Ensure `APP_ENV` is exactly `local` (or `hml` in the dedicated hosted workflow).

## 9. Quick File Reference

- Schema: `libs/database/prisma/schema.prisma`
- Migrations: `libs/database/prisma/migrations/`
- Seed fixture: `libs/database/prisma/seed.ts`
- Prisma client export: `libs/database/src/lib/database.ts`
- Library README: `libs/database/README.md`
- Canonical operations guide: `docs/DATABASE.md`
