-- Preserve certificate content at issuance, even if a learner or course is renamed later.
ALTER TABLE "certificates"
ADD COLUMN "learnerName" TEXT,
ADD COLUMN "courseTitle" TEXT;

UPDATE "certificates" AS certificate
SET
  "learnerName" = "users"."displayName",
  "courseTitle" = "courses"."title"
FROM "enrollments"
JOIN "users" ON "users"."id" = "enrollments"."userId"
JOIN "courses" ON "courses"."id" = "enrollments"."courseId"
WHERE certificate."enrollmentId" = "enrollments"."id";

ALTER TABLE "certificates"
ALTER COLUMN "learnerName" SET NOT NULL,
ALTER COLUMN "courseTitle" SET NOT NULL;

ALTER TABLE "lesson_progress"
ADD CONSTRAINT "lesson_progress_watched_percent_check"
CHECK ("watchedPercent" BETWEEN 0 AND 100);
