# API App Onboarding

This guide teaches new developers and AI agents how to work with the `api` app at `apps/api`.

Use this file for day-to-day operations. Use the repository guides for deeper policy details:

- [Architecture](../../docs/ARCHITECTURE.md)
- [Onboarding](../../docs/ONBOARDING.md)
- [Database Guide](../../docs/DATABASE.md)
- [libs/database onboarding](../../libs/database/ONBOARDING.md)
- [Create-API tutorial](../../tutorial/create-api.md)

## 1. What This App Owns

`apps/api` is a Fastify application that exposes read-only HTTP endpoints backed by
`@dudecourse/database`.

- App factory and routes: `apps/api/src/app/app.ts`
- Process bootstrap: `apps/api/src/main.ts`

`main.ts` only starts the server. All routes are wired inside `createApp()` in `app.ts`, which keeps
route testing possible via Fastify's `.inject()` without opening a network port.

## 2. Endpoints

| Endpoint | Purpose | Rules |
| --- | --- | --- |
| `GET /healthz` | Liveness check | No database access, no auth, stable response `{ "ok": true }` |
| `GET /courses` | List catalog courses | Returns only courses where `publishedAt` is not null, ordered by `title` ascending |
| `GET /courses/:slug/lessons` | List lessons for a course | Looked up by `slug`; lessons ordered by `position` ascending; returns `404` if the course does not exist or is unpublished |

## 3. Dependency Boundary

- Import the shared client only via `import { database } from '@dudecourse/database';`.
- Do not import `@prisma/client` directly from app code — the database library owns client creation.
- Only the API app may depend on `@dudecourse/database`. The portal and `libs/ui` must never import
  it.

## 4. Local Run, Test, and Build Flow

```sh
nvm use && npm install
npm run db:up
npm run db:migrate:deploy
npm run db:generate
npm run db:seed        # optional, needed for non-empty manual checks
npx nx serve api
```

Manual checks:

```sh
curl http://localhost:3000/healthz
curl http://localhost:3000/courses
curl http://localhost:3000/courses/<course-slug>/lessons
```

Validation:

```sh
npx nx lint api
npx nx test api
npx nx build api
```

If the build cannot find Prisma generated types, run `npm run db:generate` then rebuild.

## 5. Testing Guidance

For `GET /healthz`, prefer Fastify injection against the app factory:

```ts
import { createApp } from './app';

const app = createApp();
const response = await app.inject({ method: 'GET', url: '/healthz' });
```

For database-backed routes, either run focused integration checks against the local seeded database,
or refactor route registration to accept a database dependency and inject a mock in unit tests. Do
not make route behavior depend on test-only code paths.

## 6. Out of Scope for the Current Slice

The following work is not implemented in the current API slice. The product features are already
part of the PRD, while shared DTOs are part of the target architecture. Add them only as part of an
explicitly scoped follow-up, and update the PRD only if product behavior changes:

- Authentication, OAuth, JWT/session storage
- Enrollment and lesson-progress endpoints
- Certificate or PDF generation
- New database tables or migrations
- Admin/content-management endpoints
- A shared domain DTO library
