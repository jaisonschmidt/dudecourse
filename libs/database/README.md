# Database Library

This Nx library owns the Prisma schema, client boundary, migration history, and seed entry point.
For day-to-day workflows, safety rules, and AI-agent checklists, start with
[Database Onboarding](./ONBOARDING.md).
See the repository [Database Guide](../../docs/DATABASE.md) for local setup, commands, migration
rules, and HML/PRD promotion.

## Building

Run `npx nx build database` to build the library.

## Running unit tests

Run `npx nx test database` to execute the unit tests via Jest.
