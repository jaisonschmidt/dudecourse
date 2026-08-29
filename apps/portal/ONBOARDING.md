# Portal App Onboarding

This guide explains how to work with the Angular portal at `apps/portal`.

Use this file for the portal's day-to-day workflow. Use the canonical repository documents for
product and architecture decisions:

- [Product requirements](../../docs/PRD.md)
- [Architecture](../../docs/ARCHITECTURE.md)
- [Repository onboarding](../../docs/ONBOARDING.md)
- [API onboarding](../api/ONBOARDING.md)
- [Portal creation tutorial](../../tutorial/create-portal.md)

## 1. What This App Owns

`apps/portal` is the learner-facing Angular 17 single-page application. It owns browser routing,
pages, view state, and communication with the API.

The current slice contains:

- A home route (`/`) that loads and displays published courses.
- A course route (`/courses/:slug`) that loads and displays the course's ordered lesson list.
- `CoursesService`, which reads the API base URL from the Angular environment.

Authentication, enrollment, YouTube playback, progress tracking, and certificates are target v1
features but are not implemented in the portal yet.

## 2. Dependency Boundary

- Obtain all persistent data through the API.
- Never import `@dudecourse/database` or `@prisma/client` into the portal.
- The portal may depend only on libraries tagged `scope:ui` and `scope:shared`.
- Keep HTTP and route state in the portal. The planned `libs/ui` library is presentational only.
- Move contracts shared with the API to the planned `libs/shared/domain` library once that project
  exists.

These rules are defined in
[Architecture §5](../../docs/ARCHITECTURE.md#5-dependency-rules) and enforced by lint boundaries.

## 3. API Contract Used by the Current Slice

The portal currently depends on:

| Endpoint                     | Portal use                       |
| ---------------------------- | -------------------------------- |
| `GET /courses`               | Populate the catalog             |
| `GET /courses/:slug/lessons` | Populate the ordered lesson list |

`CoursesService.getCourse()` currently requests `GET /courses/:slug`, but that API endpoint does
not exist. The current course page does not call this method, so it renders a lesson list without
course title or description. Resolve the contract before relying on `getCourse()` or describing the
course-detail slice as complete.

## 4. Local Run Flow

Run commands from the repository root with Node `20.11.0`:

```sh
nvm use
npm install
cp .env.example .env
npm run db:up
npm run db:migrate:deploy
npm run db:generate
npm run db:seed
```

Start the API and portal in separate terminals:

```sh
npx nx serve api
```

```sh
npx nx serve portal
```

The default development URLs are:

- Portal: `http://localhost:4200`
- API: `http://localhost:3000`

## 5. Test, Lint, and Build

Run the project checks after portal changes:

```sh
npx nx lint portal
npx nx test portal
npx nx build portal
```

Run the Playwright project when the change affects browser behavior:

```sh
npx nx e2e portal-e2e
```

The current portal and e2e tests are still close to their generated examples. Add focused tests for
services and user-visible page states as each slice is completed.

## 6. Implementation Conventions

- Use standalone Angular components with `OnPush` change detection.
- Use the `dc` selector prefix and SCSS styles.
- Keep tests beside the code they cover as `*.spec.ts`.
- Keep environment-specific API URLs in `apps/portal/src/environments`.
- Do not duplicate a new API contract in multiple projects once `libs/shared/domain` exists.

## 7. Current Limitations

- Catalog and lesson routes do not require authentication yet.
- The course page shows lessons but not full course details or an explicit not-found state.
- Lesson videos are not embedded.
- Enrollment, watch progress, completion, and certificates are not implemented.
- The shared UI and shared-domain libraries do not exist yet.

Treat these as incomplete PRD work, not as changes to the target product scope.
