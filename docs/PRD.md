# Dude Course — Product Requirements Document (PRD)

> Audience: humans and AI tools contributing to this project. This document describes _what_ the
> product must do. It intentionally avoids any technology, framework, or database choice — those
> decisions belong to a separate technical/architecture document (see [AGENTS.md](../AGENTS.md)).

## 1. Overview & Vision

Dude Course is a portal for sharing courses hosted on YouTube. Learners can browse the full course
catalog, subscribe (enroll) in as many courses as they want, complete the lessons of each course,
and receive a certificate once a course is finished.

## 2. Target Users

- **Learner** — the only user role in v1. Can browse courses, enroll, watch lessons, track progress,
  and download certificates.

There is no in-app content-management/admin role in v1 (see
[Section 8](#8-out-of-scope--future-considerations)).

## 3. Glossary

| Term                      | Meaning                                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------------------------- |
| Course                    | A collection of ordered lessons on a topic.                                                              |
| Lesson                    | A single unit of content within a course, represented by one YouTube video.                              |
| Enrollment / Subscription | The relationship created when a learner opts into a course. A learner may hold many enrollments at once. |
| Progress                  | The completion state of a learner's lessons within a course they are enrolled in.                        |
| Certificate               | A document issued to a learner once all lessons in a course are completed.                               |

## 4. Core User Flow

1. Learner creates an account or logs in.
2. Learner browses the course catalog.
3. Learner opens a course to see its details and lesson list.
4. Learner subscribes (enrolls) in the course.
5. Learner watches lessons in order (or any order); each lesson's completion is tracked.
6. Once all lessons in a course are completed, the portal issues a certificate.
7. Learner can repeat steps 3–6 for any number of other courses in parallel.

## 5. Functional Requirements

### 5.1 Authentication

- Learners can sign up and log in using email/password.
- Learners can sign up and log in using an OAuth provider (exact provider(s) to be decided later).
- A learner's identity is required before enrolling in a course or tracking progress.

### 5.2 Catalog Browsing

- Any authenticated learner can view the full list of available courses.
- Each catalog entry shows at least: course title, description, and number of lessons.

### 5.3 Course Detail

- A course detail view shows the full lesson list, in order, and the learner's enrollment/progress
  state for that course if already enrolled.

### 5.4 Enrollment / Subscription

- A learner can subscribe to any course from the catalog or course detail view.
- A learner can be subscribed to multiple courses simultaneously with independent progress on each.
- Subscribing does not require completing or unsubscribing from other courses.

### 5.5 Lesson Playback & Progress Tracking

- Each lesson plays its associated YouTube video inside the portal.
- A lesson is automatically marked as completed based on the learner's watch progress reaching a
  defined completion threshold (percentage of the video watched), without requiring manual
  confirmation from the learner.
- The portal tracks, per learner and per course, which lessons are completed and the overall
  percentage of course completion.

### 5.6 Certificate Issuance

- When a learner completes 100% of a course's lessons, the portal automatically generates a
  certificate for that learner/course pair.
- The certificate is a downloadable PDF, accessible from the portal (e.g., from the course detail
  view or a "my certificates" area).
- Minimum certificate content: learner name, course title, completion date, and a unique
  verification code.

## 6. Conceptual Data Entities

These describe the concepts the product must represent — not a database schema.

- **User** — identity, credentials/OAuth link, display name.
- **Course** — title, description, ordered list of lessons.
- **Lesson** — title, YouTube video reference, position within its course.
- **Enrollment** — links a User to a Course; exists once the learner subscribes; tracks enrollment
  date.
- **Progress** — per Enrollment, tracks completion state of each Lesson and overall completion
  percentage.
- **Certificate** — issued for a completed Enrollment; references the User, Course, and completion
  date.

## 7. Non-Functional Requirements

- **Security**: credentials and authentication tokens must be handled securely; learners can only
  view/modify their own enrollments, progress, and certificates.
- **Reliability**: progress tracking must accurately reflect actual watch behavior and must not lose
  recorded progress.
- **Accessibility**: course catalog, course detail, and lesson pages should follow standard web
  accessibility practices (keyboard navigation, readable contrast, alt text).
- **Scalability of content**: the product must support an arbitrary number of courses, lessons per
  course, and enrollments per learner.

## 8. MVP Scope (v1)

**In scope:**

- Catalog browsing
- Course detail view
- Enrollment/subscription (multiple courses per learner)
- Lesson playback with automatic progress tracking
- Certificate generation and download
- Authentication (email/password + OAuth)

**Out of scope for v1 / Future Considerations:**

- Paid or mixed free/paid courses (v1 is entirely free)
- In-app admin/content-management UI for creating or editing courses and lessons
- Catalog search, filtering, categories, or tags
- Ratings and reviews
- Social features (comments, discussion, sharing progress)

## 9. Open Questions

1. ~~**Content entry process**~~ **Resolved:** v1 has no admin UI. Courses and lessons are added
   through a reviewed, repository-owned content fixture process applied to local and homologation
   environments.
2. ~~**Certificate fields**~~ **Resolved:** the certificate includes a unique verification serial
   code in addition to learner name, course title, and completion date. Instructor name and course
   duration are not included in v1.
3. **Completion threshold**: exact watch-percentage required to mark a lesson complete is not yet
   defined (e.g., 90%, 95%, 100%). The stored data records the watched percentage, so this value is
   application configuration and can change without a data migration.
4. **OAuth providers**: which specific provider(s) (Google, GitHub, etc.) should be supported.
