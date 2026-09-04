# MVP Implementation Baseline

This document records what exists in the first local Dude Course MVP. It is an implementation
inventory, not a replacement for the [PRD](PRD.md), which remains the source of truth for product
behavior.

## Snapshot

- **Baseline date:** 2026-09-04
- **Supported runtime:** Node.js 20.11.0
- **Application shape:** Nx monorepo with an Angular portal, a Fastify API, and PostgreSQL through
  Prisma
- **Supported environment:** local development
- **Hosted status:** not deployed; production topology and providers are still undecided

## Implemented learner journey

1. A visitor can browse published courses and open every lesson without an account.
2. A learner can register with email/password, sign in, sign out, or use Google OAuth when local
   credentials are configured.
3. An authenticated learner can enroll in multiple courses. Enrollment is idempotent.
4. Progress is saved only for enrolled learners and never moves backwards.
5. A lesson completes at 90% watched. The YouTube integration counts elapsed time only while the
   player reports `PLAYING`; seeking does not add skipped time.
6. Completing every lesson creates one certificate in the same database transaction.
7. My Journey shows enrollments, course progress, and owned certificate downloads.

## Project map

| Project              | Responsibility                                                                  | Important entry points                           |
| -------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------ |
| `apps/portal`        | Angular learner experience, routing, auth state, YouTube player                 | `app.routes.ts`, `AuthService`, `CoursesService` |
| `apps/api`           | HTTP boundary, authentication, authorization, domain operations, PDF generation | `app.ts`, `routes/`, `lib/`                      |
| `libs/database`      | Prisma schema, client boundary, migrations, catalog seed                        | `schema.prisma`, `migrations/`, `seed.ts`        |
| `libs/shared/domain` | DTOs shared by API and portal                                                   | `contracts.ts`                                   |
| `libs/ui`            | Presentational design system and D-Play visual language                         | `components.ts`, `theme.scss`                    |
| `apps/api-e2e`       | Network-level learner journey against a disposable database                     | `api.spec.ts`                                    |
| `apps/portal-e2e`    | Browser journeys with simulated API and YouTube providers                       | `example.spec.ts`                                |

All projects declare architectural `type:` and `scope:` tags. The portal does not import the
database library, and the UI library contains no data access.

## Public HTTP surface

| Method and path                                             | Authentication | Purpose                                                |
| ----------------------------------------------------------- | -------------- | ------------------------------------------------------ |
| `GET /healthz`                                              | Public         | Process liveness                                       |
| `POST /auth/register`                                       | Public         | Create credentials account and session                 |
| `POST /auth/login`                                          | Public         | Create session                                         |
| `POST /auth/logout`                                         | Public         | Clear session cookie                                   |
| `GET /auth/me`                                              | Required       | Return the current learner                             |
| `GET /auth/google`                                          | Public         | Begin Google OAuth when configured                     |
| `GET /auth/google/callback`                                 | Public         | Complete Google OAuth                                  |
| `GET /courses`                                              | Public         | Published catalog                                      |
| `GET /courses/:slug`                                        | Optional       | Course lessons and, when authenticated, learner state  |
| `POST /courses/:courseId/enrollments`                       | Required       | Create or return enrollment                            |
| `PUT /enrollments/:enrollmentId/lessons/:lessonId/progress` | Required       | Save monotonic progress and possibly issue certificate |
| `GET /me/journey`                                           | Required       | Current learner dashboard                              |
| `GET /certificates/:certificateId/pdf`                      | Required       | Stream an owned certificate PDF                        |

Errors use `{ code, message, fieldErrors? }`. Mutating requests accept JSON only.

## Persistence guarantees

- Emails are normalized with `trim().toLowerCase()` and unique.
- A user/course pair has at most one enrollment.
- An enrollment/lesson pair has at most one progress row.
- `watchedPercent` is constrained by the database to `0..100`.
- A certificate is unique per enrollment.
- Certificates snapshot learner and course names at issuance.
- Course progress is derived from completed lessons rather than a duplicated counter.
- Local and HML seeds are idempotent; production seeding is forbidden.

## Security baseline

- Passwords use asynchronous scrypt with a random 16-byte salt and the parameters recorded in
  [ADR 0005](adr/0005-mvp-authentication-and-session.md).
- Sessions use a seven-day JWT in the `dc_session` HTTP-only, SameSite=Lax cookie.
- Cookies are Secure outside local/test environments.
- Credentialed CORS accepts only the configured portal origin.
- Google identities require a verified email; Google tokens are discarded after identity lookup.
- Enrollment, progress, journey, and certificate operations are scoped to the authenticated owner.

## Visual baseline

The D-Play identity uses teal `#0F766E`, coral `#F97360`, cream `#FFF8ED`, navy `#16324F`, system
fonts, rounded surfaces, and light shadows. Master SVG assets live in `apps/portal/src/assets`.
Course art is generated with palette gradients and requires no database image field.

## Verification baseline

The first MVP was accepted locally with:

- lint passing for all seven Nx projects;
- unit tests passing for the API, portal, database, shared-domain, and UI projects;
- production builds passing for both apps and all buildable libraries;
- API e2e coverage for registration, cookie session, public catalog, idempotent enrollment, the
  89%/90% boundary, monotonic progress, certificate PDF, ownership isolation, and logout;
- Playwright coverage for public browsing/playback and the registered learner journey using
  simulated external providers;
- migration checks against both an empty database and a database containing a pre-existing
  certificate, including snapshot backfill and the progress constraint;
- repeated seed execution without duplicate catalog records;
- `npm run dev` serving the API on port 3000 and portal on port 4200.

## Known limitations and deferred scope

- Real Google OAuth requires credentials and internet access and remains a manual smoke test.
- Real YouTube playback remains a manual smoke test; automated browser tests use a simulated player.
- There is no password recovery, email verification, persistent JWT revocation, admin UI, payment,
  localization, or hosted deployment.
- Catalog entry still uses the guarded local/HML seed. A production content-entry process has not
  been selected.
- Observability, alerting, API/portal deployment workflows, production domains, and hosting
  providers have not been selected or implemented.

For the path from this baseline to hosted environments, use the
[Production Runbook](PRODUCTION_RUNBOOK.md). For every runtime setting, use the
[Configuration Reference](CONFIGURATION.md).
