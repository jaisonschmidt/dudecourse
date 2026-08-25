# 4. Initial Data Model

- **Status:** Accepted
- **Date:** 2026-08-25
- **Related:** [ADR 0003 — Database Lifecycle](0003-database-lifecycle.md),
  [PRD §6](../PRD.md#6-conceptual-data-entities), [Database guide](../DATABASE.md)

## Context

ADR 0003 deferred "product tables, identifiers, constraints, authentication storage, deletion
behavior, and production content entry" to the first domain migration. That migration is now being
created, so those choices must be settled.

PRD §6 describes six conceptual entities: User, Course, Lesson, Enrollment, Progress, and
Certificate. v1 has a single Learner role, no admin UI, and supports both email/password and OAuth
sign-in.

## Decision

Model the six PRD entities as seven tables — `users`, `auth_accounts`, `courses`, `lessons`,
`enrollments`, `lesson_progress`, and `certificates` — in migration `init_core_domain`.

- **Identifiers:** UUID primary keys (`@default(uuid()) @db.Uuid`) on every table. Identifiers
  appear in URLs and certificates, so they must not leak row counts or be guessable.
- **Authentication storage:** sign-in methods are rows in `auth_accounts`, not columns on `users`. A
  `CREDENTIALS` row carries `passwordHash`; OAuth rows leave it null and store `providerAccountId`.
  `(provider, providerAccountId)` is unique. Adding an OAuth provider is an enum value, not a table
  reshape, and a learner may link several methods to one account.
- **Progress:** `lesson_progress` holds one row per `(enrollmentId, lessonId)` with `watchedPercent`
  and a nullable `completedAt`. Course completion percentage is **derived on read** from completed
  rows over the course's lesson count. No denormalized counters are stored.
- **Completion threshold:** the watch percentage that marks a lesson complete is application
  configuration, not a database constraint, so it can be tuned without a migration.
- **Certificates:** one per enrollment (`enrollmentId` unique) with a unique `serialCode` for
  verification, resolving PRD open question 2.
- **Course visibility:** `courses.publishedAt` is nullable; null means the course is absent from the
  catalog. `courses.slug` is unique and is the stable identifier used by seed fixtures.
- **Lesson ordering:** `(courseId, position)` is unique, making lesson order explicit and correct by
  construction.
- **Deletion behavior:** all foreign keys cascade from their parent (`users`, `courses`,
  `enrollments`). No soft-delete columns in v1.
- **Content entry:** until an admin UI exists, the guarded seed in `libs/database/prisma/seed.ts` is
  the catalog content-entry mechanism, resolving PRD open question 1. It upserts on `slug` and
  `(courseId, position)` so repeated runs converge.

## Consequences

### Positive

- Progress can never disagree with itself, satisfying the PRD reliability requirement.
- New OAuth providers and new certificate content require no structural migration.
- Seeded content is reproducible and reviewable in Git, so v1 ships without an admin UI.
- Cascades keep referential integrity simple while there is no data-retention requirement.

### Negative / Risks

- Course completion percentage costs a query per read; a materialized counter can be added later via
  expand-and-contract if catalog pages become slow.
- Reordering lessons must avoid transiently colliding positions because `(courseId, position)` is
  unique.
- Cascading deletes are irreversible; deleting a course removes its enrollments, progress, and
  certificates. Introduce soft deletion before any destructive admin action becomes reachable.
- `AuthProvider` is an enum, so a new provider needs a migration — accepted in exchange for the
  database rejecting unknown values.

## Scope Deferred

Password hashing algorithm, session/token storage, certificate PDF generation and storage, the
completion-threshold value, and which OAuth providers to enable (PRD open questions 3 and 4).

## Alternatives Considered

- **`passwordHash` and per-provider columns on `users`.** Fewer joins, but every new provider is a
  schema change and multi-method accounts become awkward.
- **Denormalized `completedLessons`/`completionPercent` on `enrollments`.** Faster catalog reads,
  but every progress write must keep counters consistent, and drift silently corrupts certificates.
- **Auto-increment integer keys.** Smaller and naturally ordered, but they expose row counts in URLs
  and certificate identifiers.
- **Storing the completion threshold in the database.** Rejected: tuning a product rule should not
  require a migration.
