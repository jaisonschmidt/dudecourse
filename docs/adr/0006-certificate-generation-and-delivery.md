# 6. Certificate Generation and Delivery

- **Status:** Accepted
- **Date:** 2026-09-03
- **Related:** [PRD](../PRD.md), [ADR 0004](0004-initial-data-model.md)

## Context

Certificates must remain meaningful if a learner or course is renamed, and the local MVP should not
require object storage or committed generated files.

## Decision

- Store learner-name and course-title snapshots when the final lesson completes.
- Keep `issuedAt` as the completion date and retain the unique verification serial.
- Create the certificate once, in the same database transaction that completes the course.
- Generate the English PDF on demand with `pdf-lib` and stream it only to the certificate owner.
- Do not persist PDF files in v1.

## Consequences

Certificate content is immutable without introducing file lifecycle concerns. Each download spends a
small amount of CPU to recreate the same document.
