# API App Onboarding

This guide teaches new developers and AI agents how to work with the `api` app at `apps/api`.

Use this file for day-to-day operations. Use the repository guides for deeper policy details:

- [Architecture](../../docs/ARCHITECTURE.md)
- [Onboarding](../../docs/ONBOARDING.md)
- [Database Guide](../../docs/DATABASE.md)
- [libs/database onboarding](../../libs/database/ONBOARDING.md)
- [Create-API tutorial](../../tutorial/create-api.md)

## 1. What This App Owns

`apps/api` is the Fastify application that owns authentication and all PostgreSQL access through
`@dudecourse/database`.

- App factory and routes: `apps/api/src/app/app.ts`
- Process bootstrap: `apps/api/src/main.ts`

`main.ts` only starts the server. All routes are wired inside `createApp()` in `app.ts`, which keeps
route testing possible via Fastify's `.inject()` without opening a network port.

## 2. Endpoints

| Endpoint                                                                       | Purpose                | Rules                                                                              |
| ------------------------------------------------------------------------------ | ---------------------- | ---------------------------------------------------------------------------------- |
| `GET /healthz`                                                                 | Liveness check         | No database access, no auth, stable response `{ "ok": true }`                      |
| `GET /courses`                                                                 | List catalog courses   | Returns only courses where `publishedAt` is not null, ordered by `title` ascending |
| `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` | Email/password session | JWT is stored in an HTTP-only cookie                                               |
| `GET /auth/google`, `GET /auth/google/callback`                                | Google sign-in         | Requires local Google credentials                                                  |
| `GET /courses/:slug`                                                           | Course detail          | Public lessons plus enrollment/progress for the signed-in learner                  |
| `POST /courses/:courseId/enrollments`                                          | Enroll                 | Authenticated and idempotent                                                       |
| `PUT /enrollments/:enrollmentId/lessons/:lessonId/progress`                    | Save viewing progress  | Authenticated; completes at 90%                                                    |
| `GET /me/journey`                                                              | Learner dashboard      | Authenticated and owner-scoped                                                     |
| `GET /certificates/:certificateId/pdf`                                         | Download certificate   | Authenticated and owner-scoped                                                     |

## 3. Dependency Boundary

- Import the shared client only via `import { database } from '@dudecourse/database';`.
- Prisma types and enums may be imported from `@prisma/client`, but do not instantiate another
  `PrismaClient` in application code — the database library owns client creation.
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
curl http://localhost:3000/courses/<course-slug>
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

The API e2e suite expects an API process and uses unique test accounts. Run it against the
disposable database rather than the development database:

```sh
npm run db:test:up
# Start the API in another terminal with DATABASE_URL pointing at localhost:5433.
npx nx run api-e2e:e2e
npm run db:test:down
```

## 6. Current Boundaries

Password recovery, email verification, persistent session revocation, content administration, and
hosted deployment remain outside the local MVP.
