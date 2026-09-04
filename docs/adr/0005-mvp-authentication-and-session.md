# 5. MVP Authentication and Session

- **Status:** Accepted
- **Date:** 2026-09-03
- **Related:** [PRD](../PRD.md), [ADR 0004](0004-initial-data-model.md)

## Context

The MVP needs email/password and Google sign-in while running as a local Angular portal and Fastify
API. The existing model already separates users from authentication methods.

## Decision

- Issue a seven-day JWT in the `dc_session` HTTP-only, SameSite=Lax cookie.
- Set Secure cookies outside local/test environments and restrict credentialed CORS to the portal.
- Hash passwords with Node's asynchronous scrypt using `N=2^15`, `r=8`, `p=3`, a 16-byte random
  salt, and constant-time verification.
- Use Google OAuth authorization code flow with PKCE S256 and require a verified email.
- Link Google to an existing user only when the verified normalized email matches.
- Never store Google access or refresh tokens; they are used only to retrieve identity.
- Keep sessions stateless for v1. Logging out clears the browser cookie; persistent revocation,
  password reset, and email verification are deferred.

## Consequences

No session table or migration is required. Cookie theft is reduced because portal JavaScript cannot
read the JWT, while revocation before expiry would require a future server-side session model.
