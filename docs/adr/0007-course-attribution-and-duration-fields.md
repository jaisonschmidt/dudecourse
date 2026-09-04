# 7. Course Attribution and Duration Fields

- **Status:** Accepted
- **Date:** 2026-09-04
- **Related:** [ADR 0004 — Initial Data Model](0004-initial-data-model.md),
  [PRD §6](../PRD.md#6-conceptual-data-entities), [PRD §9](../PRD.md#9-open-questions)

## Context

Dude Course hosts third-party YouTube videos. PRD §9 originally excluded instructor name and course
duration from v1. To stay compliant with the source videos' copyright/licensing terms, the catalog
needs to credit the original video author and channel, link to more information about them, and show
the video's language and duration to learners. This reverses that part of the earlier PRD decision.

## Decision

Add five nullable fields to `courses` (migration `add_course_attribution_and_duration`):

- `videoAuthor String?`
- `youtubeChannel String?`
- `authorInfoUrl String?` — optional external link with more info about the author
- `language String?` — free-text for now (e.g. `en`, `pt-BR`)
- `totalDurationMinutes Int?`

Fields live on `Course`, not `Lesson`: a course is treated as sourced from a single author/channel
for now, matching how it is seeded. `totalDurationMinutes` is a manually entered value, not derived
from lessons, consistent with there being no per-lesson duration data. All fields are nullable so
existing and future courses are not required to backfill them immediately.

## Consequences

### Positive

- Satisfies copyright-attribution requirements without a structural change to `Lesson`.
- Nullable fields mean the change is backward compatible with existing seed data and requires no
  data backfill.

### Negative / Risks

- If a single course is ever built from videos by different authors/channels, per-course attribution
  will be inaccurate; that case is out of scope for now.
- `totalDurationMinutes` can drift from the actual lesson content since it is manually entered
  rather than derived.

## Alternatives Considered

- **Per-lesson attribution fields.** More accurate for multi-source courses, but heavier to seed and
  display; deferred until a course actually mixes authors/channels.
- **Deriving `totalDurationMinutes` from lesson video lengths.** Would require fetching/storing
  per-lesson duration (e.g. from the YouTube API), which is a larger change deferred for now.
