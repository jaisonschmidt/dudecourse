# Shared Domain Onboarding

## Purpose

`@dudecourse/shared/domain` owns framework-free request and response contracts shared by the API and
portal. It must contain types and pure functions only.

## Commands

```sh
npx nx lint shared-domain
npx nx test shared-domain
npx nx build shared-domain
```

Do not import Angular, Fastify, Prisma, or application code here. See
[`docs/ARCHITECTURE.md`](../../../docs/ARCHITECTURE.md) and
[`docs/ONBOARDING.md`](../../../docs/ONBOARDING.md).
