# Database Guide

`libs/database` owns the Prisma schema, generated client boundary, migration history, and seed entry
point. The API will be its only application consumer. Product models have not been designed yet, so
the schema currently contains no models or migrations.

## Environments

| Environment | PostgreSQL                     | Changes applied by                               | Seed policy                  |
| ----------- | ------------------------------ | ------------------------------------------------ | ---------------------------- |
| Local       | Docker Compose, PostgreSQL 16  | Developer with `migrate dev` or `migrate deploy` | Allowed with `APP_ENV=local` |
| HML         | Separate managed PostgreSQL 16 | Manual GitHub Actions workflow                   | Manual HML-only workflow     |
| PRD         | Separate managed PostgreSQL 16 | Manual protected GitHub Actions workflow         | Forbidden                    |

Real HML and PRD connection strings are GitHub Environment secrets named `DATABASE_URL`. Never put
them in repository files, workflow inputs, logs, or developer `.env` files.

## Local Setup

Docker is required for database work.

```sh
nvm use
npm install
cp .env.example .env
npm run db:up
npm run db:migrate:deploy
```

The container is healthy before `db:up` returns. Local data persists in the Compose volume until it
is explicitly reset.

### Commands

| Command                               | Effect                                                                              |
| ------------------------------------- | ----------------------------------------------------------------------------------- |
| `npm run db:up`                       | Start local PostgreSQL and wait for health.                                         |
| `npm run db:down`                     | Stop containers without deleting data.                                              |
| `npm run db:logs`                     | Follow PostgreSQL logs.                                                             |
| `npm run db:reset`                    | **Local only:** delete the Compose volume, restart, and apply committed migrations. |
| `npm run db:validate`                 | Validate `schema.prisma`.                                                           |
| `npm run db:generate`                 | Regenerate Prisma Client.                                                           |
| `npm run db:migrate -- --name <name>` | Create and apply a local development migration.                                     |
| `npm run db:migrate:deploy`           | Apply committed migrations without creating new ones.                               |
| `npm run db:migrate:status`           | Compare committed and applied migrations.                                           |
| `npm run db:seed`                     | Run the guarded local/HML seed entry point.                                         |
| `npm run db:studio`                   | Open Prisma Studio against `DATABASE_URL`.                                          |

`db:reset` destroys local data. There is intentionally no HML or PRD reset command.

## Creating a Database Change

1. Start PostgreSQL with `npm run db:up`.
2. Edit `libs/database/prisma/schema.prisma`.
3. Run `npm run db:migrate -- --name <descriptive-name>`.
4. Inspect the generated `migration.sql`; generated SQL is reviewable code, not an assumed-safe
   artifact.
5. Run `npm run db:validate`, `npm run db:generate`, and the affected lint/test/build targets.
6. Run `npm run db:reset` to prove the committed history rebuilds an empty database.
7. Commit `schema.prisma` and its generated migration directory together.

Use names such as `add_certificate_serial`, not `update_schema`. Never edit or delete a migration
after it has reached HML. Create a new forward migration instead.

For destructive or compatibility-sensitive changes, use expand and contract:

1. Add the new structure without removing the old structure.
2. Deploy code that can work with both versions and backfill data safely.
3. Remove the old structure in a later migration after all running code has moved off it.

`prisma db push` is not part of this workflow because it bypasses migration history.

## GitHub Environment Setup

Before the first hosted deployment, create lowercase GitHub Environments named `hml` and `prd`.

1. Add a distinct `DATABASE_URL` secret to each environment. Require TLS in both URLs.
2. Use separate managed PostgreSQL 16 instances and least-privilege migration users.
3. Configure required reviewers for `prd` and disable self-approval where the GitHub plan permits.
4. Restrict deployment branches or tags according to the release policy.
5. Confirm the provider has automated backups or point-in-time recovery and monitoring enabled.

The future API must use separate, lower-privilege runtime credentials.

## Promoting HML to PRD

The **Migrate database** GitHub Actions workflow is manually dispatched.

1. Select `hml` and enter the branch, tag, or commit to migrate.
2. Record the resolved commit SHA from the workflow summary.
3. Complete API and data smoke checks in HML.
4. Select `prd` and enter that exact SHA, not a newer branch head.
5. Confirm HML passed and a current provider backup or PITR point exists.
6. Obtain the protected `prd` environment approval and run the migration.
7. Complete production smoke checks before continuing the application rollout.

Runs are serialized per environment. The workflow validates the schema, applies only committed
migrations with `migrate deploy`, and verifies status afterward. Re-running an applied revision is a
no-op.

## Seeding

The seed entry point is fail-closed and requires `APP_ENV=local` or `APP_ENV=hml`. Keep seeds
idempotent by using stable identifiers and upserts once fixtures are introduced.

Local `.env` already sets `APP_ENV=local`. HML uses the separate **Seed HML database** workflow,
which is hard-bound to the `hml` GitHub Environment. There is no production seed path while the
production content-entry process remains undecided.

## Failure and Recovery

If a hosted migration fails, stop the related API rollout. Inspect the GitHub job, Prisma migration
state, and managed PostgreSQL logs before taking another action. Prefer a reviewed forward migration
when the database is intact.

Use provider restore/PITR only when the recovery plan requires it. Database restoration and
application rollback are separate operations, which is why expand-and-contract compatibility is
required. `prisma migrate resolve` is restricted to peer-reviewed incident recovery with the reason
and exact command recorded in the incident; it is intentionally not an npm script.

Never run `migrate dev`, `db push`, `migrate reset`, `db:reset`, or seed against HML/PRD. Hosted
workflows expose none of those commands.

## Troubleshooting

| Symptom                        | Resolution                                                                                                |
| ------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Port 5432 is allocated         | Change both `POSTGRES_PORT` and the port in `DATABASE_URL` in local `.env`, for example to 5433.          |
| Container is unhealthy         | Run `npm run db:logs`; confirm Docker has disk space and local variables match.                           |
| `DATABASE_URL` is missing      | Create local `.env` from `.env.example`; hosted URLs belong in GitHub Environment secrets.                |
| Migration status reports drift | Do not reset a shared database. Compare schema and committed history, then create a corrective migration. |
| Seed rejects the environment   | Set only `APP_ENV=local` locally; HML sets its marker in the protected workflow.                          |
