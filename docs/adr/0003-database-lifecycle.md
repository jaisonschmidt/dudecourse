# 3. Database Lifecycle and Environments

- **Status:** Accepted
- **Date:** 2026-08-25
- **Related:** [ADR 0001 — Tech Stack](0001-tech-stack.md), [Database guide](../DATABASE.md)

## Context

ADR 0001 selected PostgreSQL and Prisma, but did not define how developers run PostgreSQL or how
committed schema changes reach hosted environments. Database changes must be reproducible,
reviewable, and promoted without giving developer machines routine access to hosted databases.

The product has three environments: local development, homologation (`hml`), and production (`prd`).
The managed PostgreSQL provider has not been selected.

## Decision

- Use PostgreSQL 16 in every environment.
- Run local PostgreSQL with Docker Compose and a repository-owned named volume.
- Use separate managed PostgreSQL instances for HML and PRD. The provider must offer TLS, automated
  backups or point-in-time recovery, monitoring, and separate credentials.
- Keep `schema.prisma` and the append-only generated SQL migrations in `libs/database` as the source
  of truth.
- Create migrations only on a developer's local database with `prisma migrate dev`.
- Validate migrations in pull requests by applying the committed history to an empty PostgreSQL 16
  database.
- Apply committed migrations to HML and PRD only through manually dispatched GitHub Actions using
  `prisma migrate deploy` and GitHub Environment secrets.
- Promote the exact Git revision tested in HML to PRD. PRD requires protected-environment approval
  and confirmation that a current backup or recovery point exists.
- Allow idempotent seed scripts only in local and HML. Production has no seed command or workflow.
- Prefer reviewed forward migrations for recovery. `prisma migrate resolve` is a break-glass action,
  not a routine command.

Migration and API runtime credentials are separate concerns. Hosted migration jobs need schema
change privileges; the future API runtime should receive a lower-privilege credential.

## Consequences

### Positive

- Git contains a chronological, reviewable record of database changes.
- Local development is reproducible without sharing a hosted database.
- HML and PRD changes are auditable, serialized, and protected by environment-specific secrets.
- The same PostgreSQL major version reduces environment drift.

### Negative / Risks

- Manual promotion requires an operator and a documented smoke-test step.
- The team must configure GitHub Environments and provider backups outside the repository.
- Destructive changes require expand-and-contract releases and may span multiple deployments.
- A managed provider still needs to be selected before HML is provisioned.

## Scope Deferred

This decision does not define product tables, identifiers, constraints, authentication storage,
deletion behavior, the managed provider, API deployment, or production content entry. Those choices
must be made before the first domain migration is created.

## Alternatives Considered

| Alternative                              | Why not                                                                                                   |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| PostgreSQL containers on hosted servers  | Rejected: the project would own backups, upgrades, failover, and monitoring.                              |
| Automatic HML migration on every merge   | Rejected for now: the owner selected fully manual promotion for both hosted environments.                 |
| Run migrations when the API starts       | Rejected: concurrent instances can race and application startup should not hold schema-change privileges. |
| Direct migration from developer machines | Rejected: weak auditability and unnecessary exposure of hosted credentials.                               |
| Production seed workflow                 | Rejected: the production content-entry process is still an open product/technical decision.               |
