# Tutorial: Create the Initial API

> **Implementation record:** `apps/api` already exists. Do not rerun the application generator in
> the current checkout. This tutorial preserves the intended construction of the initial slice; use
> [API onboarding](../apps/api/ONBOARDING.md) for current endpoints, commands, and limitations.

This tutorial explains how to create the first API app for Dude Course and implement the planned
read-only endpoints:

- `GET /healthz`
- `GET /courses`
- `GET /courses/:slug/lessons`

Do not use this tutorial to add authentication, enrollment, progress tracking, certificates, shared
DTOs, or schema changes. Those belong to later slices.

## 1. Goal

Create an Nx Fastify application at `apps/api` that exposes a small HTTP API backed by the existing
Prisma database library.

The API must follow the repository architecture:

- The API app lives in `apps/api`.
- The API app is tagged with `type:app` and `scope:api`.
- The API may import `@dudecourse/database`.
- The portal and UI projects must not import `@dudecourse/database`.
- Course catalog reads return only published courses, where `publishedAt` is not null.
- Lesson listing is addressed by course slug: `GET /courses/:slug/lessons`.

Canonical references:

- `docs/ARCHITECTURE.md`
- `docs/ONBOARDING.md`
- `libs/database/ONBOARDING.md`
- `libs/database/prisma/schema.prisma`

## 2. Prerequisites

Run commands from the repository root.

Use the pinned Node version:

```sh
nvm use
node --version
```

The expected Node major version is `20`. This matters because the workspace is pinned to Angular 17
and Nx 19.

Install dependencies if needed:

```sh
npm install
```

Prepare the local database when you want to manually test database-backed endpoints:

```sh
cp .env.example .env
npm run db:up
npm run db:migrate:deploy
npm run db:generate
```

If port `5432` is already used locally, update both `POSTGRES_PORT` and the port inside
`DATABASE_URL` in `.env` before starting Docker.

## 3. Generate the API App

Create the app with the documented Nx generator:

```sh
npx nx g @nx/node:application api \
  --directory=apps/api \
  --framework=fastify \
  --tags=type:app,scope:api
```

Do not create the app by copying folders manually. The generator wires project metadata, TypeScript
configuration, targets, and lint integration.

After generation, inspect the project:

```sh
npx nx show project api
```

Confirm that the generated project has these tags:

```json
["type:app", "scope:api"]
```

If the tags are missing, fix `apps/api/project.json` before writing endpoint code. Untagged projects
bypass the dependency-boundary rules.

## 4. Add API Onboarding

Every new project needs an onboarding document.

Create:

```txt
apps/api/ONBOARDING.md
```

Include at least:

- Project purpose
- Main commands
- Local run, test, and build flow
- Dependency-boundary notes
- Links to `docs/ARCHITECTURE.md`, `docs/ONBOARDING.md`, and `libs/database/ONBOARDING.md`

Then add a short link to that file from `docs/ONBOARDING.md`, near the existing project onboarding
links or the project creation section.

## 5. Keep the First API Shape Simple

The first implementation can start in the generated Fastify entry point. Once routes grow, split
them into route modules.

A practical structure after a small refactor is:

```txt
apps/api/src/
  app.ts
  main.ts
```

Use `app.ts` to build and configure Fastify. Use `main.ts` only to start the server. This makes
route testing easier because tests can import the app factory without opening a network port.

Example `app.ts` shape:

```ts
import Fastify from 'fastify';
import { database } from '@dudecourse/database';

export function createApp() {
  const app = Fastify({ logger: true });

  app.get('/healthz', async () => ({ ok: true }));

  app.get('/courses', async () => {
    const courses = await database.course.findMany({
      where: {
        publishedAt: {
          not: null,
        },
      },
      orderBy: [{ title: 'asc' }],
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        _count: {
          select: {
            lessons: true,
          },
        },
      },
    });

    return courses.map((course) => ({
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      lessonCount: course._count.lessons,
    }));
  });

  app.get('/courses/:slug/lessons', async (request, reply) => {
    const { slug } = request.params as { slug: string };

    const course = await database.course.findFirst({
      where: {
        slug,
        publishedAt: {
          not: null,
        },
      },
      select: {
        lessons: {
          orderBy: {
            position: 'asc',
          },
          select: {
            id: true,
            title: true,
            youtubeVideoId: true,
            position: true,
          },
        },
      },
    });

    if (!course) {
      return reply.code(404).send({ message: 'Course not found' });
    }

    return course.lessons;
  });

  app.addHook('onClose', async () => {
    await database.$disconnect();
  });

  return app;
}
```

Example `main.ts` shape:

```ts
import { createApp } from './app';

const host = process.env.HOST ?? '0.0.0.0';
const port = Number(process.env.PORT ?? 3000);

const app = createApp();

await app.listen({ host, port });
```

If the generated `main.ts` uses a different bootstrap style, keep the generated style and apply the
same route behavior inside it.

## 6. Endpoint: `GET /healthz`

Purpose: verify the process is running.

Request:

```http
GET /healthz
```

Response:

```json
{
  "ok": true
}
```

Rules:

- Do not query the database.
- Do not require authentication.
- Keep the response stable so deployment checks can rely on it.

## 7. Endpoint: `GET /courses`

Purpose: list catalog-visible courses.

Request:

```http
GET /courses
```

Response shape:

```json
[
  {
    "id": "course-uuid",
    "slug": "course-slug",
    "title": "Course title",
    "description": "Course description",
    "lessonCount": 3
  }
]
```

Database rule:

```ts
where: {
  publishedAt: {
    not: null,
  },
}
```

Do not return unpublished courses. In the current data model, `publishedAt: null` means the course
is not visible in the catalog.

Use a deterministic order. A simple first version is:

```ts
orderBy: [{ title: 'asc' }];
```

## 8. Endpoint: `GET /courses/:slug/lessons`

Purpose: list lessons for one published course.

Request:

```http
GET /courses/intro-to-example/lessons
```

Response shape:

```json
[
  {
    "id": "lesson-uuid",
    "title": "Lesson title",
    "youtubeVideoId": "abc123",
    "position": 1
  }
]
```

Rules:

- Identify the course by `slug`, not by UUID.
- Return lessons ordered by `position` ascending.
- Return `404` if the course does not exist or is unpublished.
- Do not require authentication in this first slice unless product requirements change.

The course lookup should include the published-course rule:

```ts
where: {
  slug,
  publishedAt: {
    not: null,
  },
}
```

## 9. Database Boundary

Import the database client only from the API app:

```ts
import { database } from '@dudecourse/database';
```

Do not import Prisma directly from app code:

```ts
import { PrismaClient } from '@prisma/client';
```

The database library owns Prisma client creation. The API consumes that library through the
`@dudecourse/database` alias.

Do not import `@dudecourse/database` from future portal or UI code. The lint rules are designed to
reject that boundary violation.

## 10. Testing Guidance

Use the generated Jest setup if present.

For `GET /healthz`, prefer Fastify injection:

```ts
import { createApp } from './app';

describe('GET /healthz', () => {
  it('returns ok', async () => {
    const app = createApp();

    const response = await app.inject({
      method: 'GET',
      url: '/healthz',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true });

    await app.close();
  });
});
```

For database-backed routes, there are two reasonable options:

- Start with focused integration checks against the local seeded database.
- Refactor route registration to accept a database dependency, then inject a mock in unit tests.

Do not make the route behavior depend on test-only code paths.

## 11. Manual Checks

Start the database if endpoint data is needed:

```sh
npm run db:up
npm run db:migrate:deploy
npm run db:seed
```

Start the API:

```sh
npx nx serve api
```

Check the endpoints:

```sh
curl http://localhost:3000/healthz
curl http://localhost:3000/courses
curl http://localhost:3000/courses/<course-slug>/lessons
```

Replace `<course-slug>` with a real slug from the `GET /courses` response.

## 12. Validation Commands

Run these after implementation:

```sh
npx nx show project api
npx nx lint api
npx nx test api
npx nx build api
```

If the build cannot find Prisma generated types, run:

```sh
npm run db:generate
npx nx build api
```

For a broader check before opening a pull request:

```sh
npm run affected:lint
npm run affected:test
npm run affected:build
npm run format:check
```

## 13. What Not to Include in This Slice

Do not add these yet:

- Authentication
- OAuth provider decisions
- JWT or session storage
- Enrollment endpoints
- Lesson progress endpoints
- Certificate generation
- PDF generation
- New database tables or migrations
- Admin/content-management endpoints
- Shared domain DTO library

Those are future slices. Keeping this first API small makes it easier to validate the Nx app,
Fastify wiring, database import boundary, and read-only route behavior before adding product flows.

## 14. Completion Checklist

The first API slice is complete when:

- `apps/api` exists and was generated with Nx.
- `apps/api/project.json` has `type:app` and `scope:api` tags.
- `apps/api/ONBOARDING.md` exists.
- `docs/ONBOARDING.md` links to the API onboarding document.
- `GET /healthz` returns `{ "ok": true }`.
- `GET /courses` returns published courses only.
- `GET /courses/:slug/lessons` returns ordered lessons for a published course.
- Unpublished or missing course slugs return `404` from the lessons endpoint.
- `npx nx lint api` passes.
- `npx nx test api` passes.
- `npx nx build api` passes.
