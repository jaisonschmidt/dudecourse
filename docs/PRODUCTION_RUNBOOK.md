# Production Readiness and Deployment Runbook

The current repository delivers a complete local MVP. It does **not** yet contain application
deployment infrastructure. This runbook describes what must be provisioned, where each item is
configured, the required release order, and the remaining decisions before the first HML or PRD
deployment.

## 1. Decisions required before provisioning

The stack is fixed, but the hosting topology is not. Select these items explicitly and record the
decision in a new ADR before adding provider-specific files or workflows:

| Decision                    | Required outcome                                                 | Why it cannot be implicit                                             |
| --------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------- |
| Public domains              | HML and PRD portal/API URLs                                      | Drives CORS, cookies, OAuth callbacks, DNS, and TLS                   |
| Portal hosting              | Static hosting/CDN provider                                      | Defines build artifact upload, cache invalidation, and SPA fallback   |
| API hosting                 | Managed Node 20 service or container platform                    | Defines runtime, health checks, scaling, logs, and secret storage     |
| Managed PostgreSQL provider | Separate PostgreSQL 16 instances for HML and PRD                 | Must satisfy ADR 0003 backup, TLS, monitoring, and isolation rules    |
| Portal-to-API routing       | Same-site subdomains or same-origin reverse proxy                | The session cookie must work reliably with credentialed browser calls |
| Production catalog entry    | Controlled seed replacement or admin process                     | Production seed is intentionally forbidden                            |
| Deployment policy           | Manual or automated app promotion, approvals, and rollback owner | Only database migration promotion exists today                        |
| Observability provider      | Logs, uptime checks, error tracking, and alerts                  | Operators need an actionable failure signal                           |

Recommended topology constraint: keep the portal and API under the same registrable domain. This
preserves the accepted SameSite=Lax session model. A materially different topology requires a
security review and an ADR update.

## 2. Services to provision

| Service                   | Minimum requirement                                                                    | Configure at                                 | Repository integration                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------- |
| DNS and TLS               | HML/PRD records, HTTPS, automatic renewal, HTTP-to-HTTPS redirect                      | DNS/hosting provider                         | Record final URLs in the topology ADR and this runbook                                  |
| Portal hosting            | Static files, CDN, SPA fallback to `index.html`, cache control                         | Static hosting provider                      | Deploy `dist/apps/portal/browser` after `npx nx build portal`                           |
| API runtime               | Node.js 20.11.0, HTTPS ingress, configurable `PORT`, persistent process, health checks | Application hosting provider                 | Build with `npx nx build api`; run the generated `main.js` with production dependencies |
| PostgreSQL                | Version 16, TLS, HML/PRD isolation, backups/PITR, monitoring                           | Managed database provider                    | Prisma schema/migrations in `libs/database`; migration via GitHub Actions               |
| Google OAuth              | Consent screen and environment-specific web clients                                    | Google Cloud Console                         | Callback handled by `/auth/google/callback`                                             |
| Secret management         | Encryption, scoped access, audit history, rotation                                     | API hosting provider and GitHub Environments | Variables listed in `CONFIGURATION.md`                                                  |
| Logs and error monitoring | API stdout/stderr ingestion, retention, search, alerts                                 | API/observability provider                   | Fastify emits structured JSON logs in hosted mode                                       |
| Uptime monitoring         | External checks for portal and `GET /healthz`                                          | Monitoring provider                          | Alert on sustained failures, not individual transient requests                          |
| Backup operations         | Automated schedule, retention, restore/PITR exercise                                   | Database provider                            | Evidence required before PRD database migrations                                        |

No object storage, mail provider, media hosting, queue, or payment provider is required for this
MVP. YouTube serves video, and certificate PDFs are generated on demand.

## 3. Repository work still required

Do not declare the application production-ready until these blockers are closed:

- replace the production portal's localhost API URL with the chosen reproducible configuration
  strategy;
- add provider-specific build/deploy artifacts for the API and portal;
- add HML and PRD application deployment workflows with protected PRD approval;
- define a production start command and verify installation from the generated API package lock;
- configure SPA fallback and cache policy for the portal;
- add a readiness check that proves required dependencies are usable; `/healthz` is currently a
  liveness-only endpoint and intentionally does not query PostgreSQL;
- select and test a production catalog-entry process;
- configure observability, alert routes, retention, and an on-call owner;
- perform a backup restore or PITR exercise;
- run a security review covering rate limiting, brute-force protection, CSP/security headers, JWT
  rotation, dependency advisories, and privacy/terms requirements;
- define data retention, account deletion, and privacy procedures before accepting real learners.

The final provider/topology decision should become ADR 0007 (or the next available number). Do not
add deployment credentials or provider URLs to that ADR.

## 4. Environment setup

Provision in this order:

1. create separate managed PostgreSQL 16 instances for HML and PRD;
2. create separate migration and API runtime database users with least privilege;
3. enable TLS, backups/PITR, monitoring, and retention at the database provider;
4. create GitHub Environments `hml` and `prd`, add their migration `DATABASE_URL` secrets, and
   protect `prd` with reviewers;
5. create portal and API services for HML;
6. configure every API value in [Configuration Reference](CONFIGURATION.md) in the HML service;
7. configure HML DNS and TLS;
8. create the HML Google OAuth web client with the exact origin and callback;
9. repeat the service, DNS, TLS, secret, and OAuth setup independently for PRD;
10. configure log collection, external uptime checks, and alert destinations for both environments.

Do not copy HML database credentials, JWT secrets, or Google client secrets into PRD.

## 5. Build and release artifacts

Run from a clean checkout at the exact revision being released:

```sh
nvm use
npm ci
npm run lint
npm run test
npm run build
```

The expected artifacts are:

- portal static output under `dist/apps/portal/browser`;
- API output and generated deployment package metadata under `dist/apps/api`.

Before formalizing the API deployment command, verify a clean environment can install only the
generated production dependencies and start `dist/apps/api/main.js`. Record the provider-specific
command in this runbook after the hosting decision.

## 6. First HML deployment

1. Choose a release commit SHA; do not deploy a moving branch reference without recording the
   resolved SHA.
2. Run all checks and builds from section 5.
3. Dispatch **Migrate database** with environment `hml` and the release SHA.
4. If catalog fixtures are appropriate for HML, dispatch **Seed HML database** for the same SHA.
5. Deploy the API artifact with HML runtime variables and secrets.
6. Wait for the process to start and verify `GET /healthz` externally.
7. Deploy the portal artifact built with the HML API location.
8. Purge/invalidate stale portal HTML at the CDN without unnecessarily invalidating hashed assets.
9. Run the smoke checks below.
10. Record the SHA, migration run, app deployment IDs, operator, time, and smoke result.

## 7. HML smoke checks

Use a dedicated HML test account and a disposable test course when production-like data exists.

- portal loads over HTTPS and direct navigation to a nested route returns the SPA;
- `/healthz` returns `200` and `{ "ok": true }`;
- published catalog and course detail load;
- email/password registration, login, session restoration, and logout work;
- Google login returns through the exact configured callback;
- a visitor opens a YouTube lesson but records no progress;
- an enrolled learner records progress and lower updates do not reduce it;
- 89% does not complete a lesson and 90% does;
- completing all lessons creates one certificate;
- My Journey shows the enrollment and certificate;
- the owner can download a valid PDF and another learner cannot;
- API logs contain no secrets, passwords, JWT values, or Google tokens;
- portal/API CORS and cookie behavior work in the real domain topology.

## 8. Production promotion

1. Obtain product approval for the exact SHA that passed HML.
2. Confirm a current PRD backup/PITR point and the last restore-test date.
3. Review migrations for backward compatibility with the currently running API.
4. Dispatch **Migrate database** with environment `prd`, the exact HML-tested SHA, and production
   confirmation enabled.
5. Deploy the API. Prefer a rolling strategy only after backward compatibility is confirmed.
6. Verify API liveness and logs before deploying the portal.
7. Deploy the portal built for the PRD API location.
8. Run a reduced production smoke test using an approved test account and non-sensitive data.
9. Monitor errors, latency, database connections, CPU/memory, and external uptime during the agreed
   observation window.
10. Record the release evidence and announce completion.

Never seed PRD and never run `migrate dev`, `db push`, `migrate reset`, or `db:reset` against a
hosted database.

## 9. Rollback and incident response

Application rollback and database recovery are separate decisions.

### Application failure without an incompatible migration

1. stop promotion and preserve logs/deployment identifiers;
2. roll the API and/or portal back to the last known-good artifact;
3. verify `/healthz`, authentication, catalog, and one owner-scoped operation;
4. document the incident and corrective follow-up.

### Migration failure

1. stop the API rollout;
2. inspect the GitHub migration job, Prisma migration table, and provider logs;
3. prefer a reviewed forward migration when the database remains intact;
4. use `prisma migrate resolve` only as a peer-reviewed break-glass procedure with the exact command
   recorded in the incident;
5. use restore/PITR only when the recovery owner approves the data-loss window and application
   compatibility plan.

### Suspected credential exposure

1. disable or rotate the exposed credential at its owning provider;
2. rotate dependent values independently;
3. redeploy the affected service;
4. check access and application logs for misuse;
5. remember that rotating `JWT_SECRET` signs every learner out;
6. remove leaked values from logs/history through the provider's incident procedure; deleting a
   current Git file alone is not sufficient.

## 10. Release record template

Store one record per deployment in the team's selected operational system:

```text
Environment:
Commit SHA:
Portal deployment ID:
API deployment ID:
Database migration workflow URL:
Database backup/PITR confirmation:
Operator and approver:
Started / completed at:
Smoke checks:
Known risks or follow-up:
Rollback artifact:
```

Update this runbook as soon as providers are selected. Replace generic “provider” locations with the
exact console/project/service names, but keep secrets out of the document.
