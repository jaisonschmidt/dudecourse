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

The local MVP contains:

- A home route (`/`) that loads and displays published courses.
- Course detail and public lesson playback routes.
- Email/password and Google authentication routes.
- Enrollment, tracked playback, My Journey, and certificate downloads.
- `CoursesService`, `AuthService`, and shared contracts from `@dudecourse/shared/domain`.

## 2. Dependency Boundary

- Obtain all persistent data through the API.
- Never import `@dudecourse/database` or `@prisma/client` into the portal.
- The portal may depend only on libraries tagged `scope:ui` and `scope:shared`.
- Keep HTTP and route state in the portal. `libs/ui` is presentational only.
- Keep shared API contracts in `libs/shared/domain`.

These rules are defined in [Architecture §5](../../docs/ARCHITECTURE.md#5-dependency-rules) and
enforced by lint boundaries.

## 3. API Contract

The portal currently depends on:

| Endpoint                                    | Portal use                                |
| ------------------------------------------- | ----------------------------------------- |
| `GET /courses`                              | Populate the catalog                      |
| `GET /courses/:slug`                        | Course detail, lessons, and learner state |
| `POST /courses/:id/enrollments`             | Enroll in a course                        |
| `PUT /enrollments/:id/lessons/:id/progress` | Persist watched progress                  |
| `GET /me/journey`                           | Populate My Journey                       |

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

Start the API and portal together:

```sh
npm run dev
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

Keep unit and Playwright coverage aligned with user-visible behavior.

## 6. Implementation Conventions

- Use standalone Angular components with `OnPush` change detection.
- Use the `dc` selector prefix and SCSS styles.
- Keep tests beside the code they cover as `*.spec.ts`.
- Keep environment-specific API URLs in `apps/portal/src/environments`.
- Do not duplicate a new API contract in multiple projects once `libs/shared/domain` exists.

## 7. Current Limitations

The local MVP does not include password recovery, email verification, persistent session revocation,
content administration, deployment, or internationalization.
