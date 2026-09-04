# Configuration Reference

This is the canonical inventory of runtime configuration for Dude Course. Local examples belong in
`.env.example`; real hosted values belong in the selected hosting platform's secret/configuration
store. Never commit credentials.

## API runtime variables

| Variable               | Required         | Secret     | Example / rule                                                          | Configure locally | Configure in HML/PRD                                                     |
| ---------------------- | ---------------- | ---------- | ----------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------ |
| `APP_ENV`              | Yes              | No         | `local`, `hml`, or `prd`                                                | `.env`            | API service environment                                                  |
| `NODE_ENV`             | Recommended      | No         | `production` in hosted runtime                                          | Usually omitted   | API service environment                                                  |
| `HOST`                 | No               | No         | Defaults to `0.0.0.0`                                                   | `.env` or shell   | API service environment                                                  |
| `PORT`                 | No               | No         | Defaults to `3000`; many platforms inject it                            | `.env` or shell   | API service environment                                                  |
| `DATABASE_URL`         | Yes              | **Yes**    | PostgreSQL 16 URL; require TLS when hosted                              | `.env`            | API secret store; GitHub Environment also needs its migration credential |
| `JWT_SECRET`           | Yes              | **Yes**    | At least 32 random characters; use an independent value per environment | `.env`            | API secret store                                                         |
| `PORTAL_URL`           | Yes              | No         | Exact public origin, without a trailing slash                           | `.env`            | API service environment                                                  |
| `GOOGLE_CLIENT_ID`     | For Google login | Usually no | OAuth web-client ID for that environment                                | `.env`            | API service environment or secret store                                  |
| `GOOGLE_CLIENT_SECRET` | For Google login | **Yes**    | OAuth web-client secret                                                 | `.env`            | API secret store                                                         |
| `GOOGLE_CALLBACK_URL`  | For Google login | No         | Exact API callback URL ending in `/auth/google/callback`                | `.env`            | API service environment                                                  |
| `COMPLETION_THRESHOLD` | No               | No         | Integer `1..100`; default and MVP value is `90`                         | `.env`            | API service environment                                                  |

`TEST_DATABASE_URL` and `POSTGRES_*` are local/test orchestration settings. The API does not read
them at runtime. Hosted services must not receive them.

### Generating secrets

Generate each JWT secret in a trusted environment using a cryptographically secure generator. Do not
reuse database passwords, Google secrets, or the local example. Record secret ownership and rotation
dates in the team's password/secret manager, not in Git.

Rotating `JWT_SECRET` immediately invalidates all current sessions. With the v1 stateless session
model, that is expected and should be announced before a planned rotation.

## Portal build configuration

The portal API URL is currently compiled from:

- `apps/portal/src/environments/environment.development.ts` for development;
- `apps/portal/src/environments/environment.ts` for production builds.

The production file still points to `http://localhost:3000`. This is a **deployment blocker**.
Before the first hosted build, choose one of these approaches and record it in a production-topology
ADR:

1. compile the environment-specific public API URL during the portal build; or
2. expose the API below the portal origin through a reverse proxy and use a relative `/api` URL.

Do not manually edit a built JavaScript bundle after release. The selected approach must be
reproducible in CI/CD.

## Google Cloud configuration

Create a separate OAuth web client for HML and PRD whenever possible.

In Google Cloud Console:

1. configure the OAuth consent screen and the required application identity;
2. create an OAuth 2.0 Client ID of type **Web application**;
3. add the exact portal origin to **Authorized JavaScript origins**;
4. add the exact `GOOGLE_CALLBACK_URL` to **Authorized redirect URIs**;
5. place the client ID and secret in the API runtime configuration;
6. keep HML callbacks out of the PRD client unless there is a documented reason to share it.

The API requests only profile and email scopes, requires `email_verified`, and does not persist
Google access or refresh tokens.

## GitHub Environments

Create lowercase GitHub Environments named `hml` and `prd`.

Current database workflows expect:

| GitHub Environment value | Type   | Consumer                                        |
| ------------------------ | ------ | ----------------------------------------------- |
| `DATABASE_URL`           | Secret | Manual migration workflow and HML seed workflow |

The workflow credential may need schema-change privileges. The API runtime must use a separate,
lower-privilege database user configured in the hosting platform, even if both URLs are named
`DATABASE_URL` in their respective stores.

When application deployment workflows are added, document every new GitHub secret/variable here,
including which workflow reads it and who can rotate it.

## Domain and cookie constraints

- All hosted traffic must use HTTPS.
- `PORTAL_URL` must exactly match the browser origin allowed by CORS.
- Prefer portal and API hosts under the same registrable domain, such as `learn.example.com` and
  `api.example.com`. The SameSite=Lax cookie model is not suitable for unrelated sites.
- The Google callback must terminate at the public API URL, not an internal container hostname.
- DNS, certificates, redirects, CDN, and reverse-proxy rules are configured at the selected hosting
  and DNS providers; their concrete locations cannot be named until those providers are selected.

## Configuration change checklist

For every hosted configuration change:

1. change HML first;
2. record the reason, owner, and timestamp in the deployment or incident record;
3. restart/redeploy only the affected service;
4. run the relevant smoke checks from the production runbook;
5. promote the equivalent value to PRD through protected approval;
6. update this document when a variable, location, or ownership rule changes.
