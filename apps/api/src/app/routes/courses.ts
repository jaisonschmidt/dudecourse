import { Prisma, PrismaClient } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { FastifyInstance, FastifyRequest } from 'fastify';
import {
  CertificateDto,
  CourseDetailDto,
  CourseSummaryDto,
  EnrollmentDto,
  ProgressUpdateRequestDto,
  ProgressUpdateResultDto,
} from '@dudecourse/shared/domain';
import { RuntimeConfig } from '../config';

function certificateDto(certificate: {
  id: string;
  serialCode: string;
  learnerName: string;
  courseTitle: string;
  issuedAt: Date;
}): CertificateDto {
  return { ...certificate, issuedAt: certificate.issuedAt.toISOString() };
}

function progressPercent(completed: number, total: number): number {
  return total ? Math.round((completed / total) * 100) : 0;
}

async function optionalUserId(request: FastifyRequest): Promise<string | undefined> {
  try {
    await request.jwtVerify();
    return request.user.sub;
  } catch {
    return undefined;
  }
}

function serialCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(12);
  const suffix = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
  return `DC-${new Date().getUTCFullYear()}-${suffix}`;
}

export function registerCourseRoutes(
  app: FastifyInstance,
  database: PrismaClient,
  config: RuntimeConfig
): void {
  app.get('/courses', async (): Promise<CourseSummaryDto[]> => {
    const courses = await database.course.findMany({
      where: { publishedAt: { not: null } },
      orderBy: [{ title: 'asc' }],
      include: { _count: { select: { lessons: true } } },
    });
    return courses.map((course) => ({
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      lessonCount: course._count.lessons,
      videoAuthor: course.videoAuthor,
      youtubeChannel: course.youtubeChannel,
      authorInfoUrl: course.authorInfoUrl,
      language: course.language,
      totalDurationMinutes: course.totalDurationMinutes,
    }));
  });

  app.get<{ Params: { slug: string } }>('/courses/:slug', async (request, reply) => {
    const userId = await optionalUserId(request);
    const course = await database.course.findFirst({
      where: { slug: request.params.slug, publishedAt: { not: null } },
      include: {
        lessons: { orderBy: { position: 'asc' } },
        enrollments: {
          where: { userId: userId ?? '00000000-0000-0000-0000-000000000000' },
          include: { progress: true, certificate: true },
          take: 1,
        },
      },
    });
    if (!course) {
      return reply.code(404).send({ code: 'COURSE_NOT_FOUND', message: 'Course not found.' });
    }

    const enrollment = course.enrollments[0];
    const completedLessons = enrollment?.progress.filter((item) => item.completedAt).length ?? 0;
    const enrollmentDto: EnrollmentDto | null = enrollment
      ? {
          id: enrollment.id,
          enrolledAt: enrollment.enrolledAt.toISOString(),
          progressPercent: progressPercent(completedLessons, course.lessons.length),
          completedLessons,
          totalLessons: course.lessons.length,
          certificate: enrollment.certificate ? certificateDto(enrollment.certificate) : null,
        }
      : null;
    const response: CourseDetailDto = {
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      lessonCount: course.lessons.length,
      videoAuthor: course.videoAuthor,
      youtubeChannel: course.youtubeChannel,
      authorInfoUrl: course.authorInfoUrl,
      language: course.language,
      totalDurationMinutes: course.totalDurationMinutes,
      enrollment: enrollmentDto,
      lessons: course.lessons.map((lesson) => {
        const progress = enrollment?.progress.find((item) => item.lessonId === lesson.id);
        return {
          id: lesson.id,
          title: lesson.title,
          youtubeVideoId: lesson.youtubeVideoId,
          position: lesson.position,
          progress: progress
            ? {
                lessonId: lesson.id,
                watchedPercent: progress.watchedPercent,
                completedAt: progress.completedAt?.toISOString() ?? null,
              }
            : null,
        };
      }),
    };
    return response;
  });

  app.post<{ Params: { courseId: string } }>(
    '/courses/:courseId/enrollments',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const course = await database.course.findFirst({
        where: { id: request.params.courseId, publishedAt: { not: null } },
        include: { _count: { select: { lessons: true } } },
      });
      if (!course) {
        return reply.code(404).send({ code: 'COURSE_NOT_FOUND', message: 'Course not found.' });
      }
      const existing = await database.enrollment.findUnique({
        where: { userId_courseId: { userId: request.user.sub, courseId: course.id } },
        include: { certificate: true },
      });
      let enrollment = existing;
      if (!enrollment) {
        try {
          enrollment = await database.enrollment.create({
            data: { userId: request.user.sub, courseId: course.id },
            include: { certificate: true },
          });
        } catch (error: unknown) {
          if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
            throw error;
          }
          enrollment = await database.enrollment.findUnique({
            where: { userId_courseId: { userId: request.user.sub, courseId: course.id } },
            include: { certificate: true },
          });
          if (!enrollment) throw error;
        }
      }
      const response: EnrollmentDto = {
        id: enrollment.id,
        enrolledAt: enrollment.enrolledAt.toISOString(),
        progressPercent: 0,
        completedLessons: 0,
        totalLessons: course._count.lessons,
        certificate: enrollment.certificate ? certificateDto(enrollment.certificate) : null,
      };
      return reply.code(existing ? 200 : 201).send(response);
    }
  );

  app.put<{
    Params: { enrollmentId: string; lessonId: string };
    Body: ProgressUpdateRequestDto;
  }>(
    '/enrollments/:enrollmentId/lessons/:lessonId/progress',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const watchedPercent = request.body?.watchedPercent;
      if (!Number.isInteger(watchedPercent) || watchedPercent < 0 || watchedPercent > 100) {
        return reply.code(400).send({
          code: 'VALIDATION_ERROR',
          message: 'watchedPercent must be an integer between 0 and 100.',
        });
      }

      let result: ProgressUpdateResultDto | null | undefined;
      for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
          result = await database.$transaction(
            async (transaction) => {
              const enrollment = await transaction.enrollment.findFirst({
                where: { id: request.params.enrollmentId, userId: request.user.sub },
                include: { user: true, course: { include: { lessons: true } }, certificate: true },
              });
              if (
                !enrollment ||
                !enrollment.course.lessons.some(({ id }) => id === request.params.lessonId)
              ) {
                return null;
              }

              const existing = await transaction.lessonProgress.findUnique({
                where: {
                  enrollmentId_lessonId: {
                    enrollmentId: enrollment.id,
                    lessonId: request.params.lessonId,
                  },
                },
              });
              const nextPercent = Math.max(existing?.watchedPercent ?? 0, watchedPercent);
              const completedAt =
                existing?.completedAt ??
                (nextPercent >= config.completionThreshold ? new Date() : null);
              const lessonProgress = await transaction.lessonProgress.upsert({
                where: {
                  enrollmentId_lessonId: {
                    enrollmentId: enrollment.id,
                    lessonId: request.params.lessonId,
                  },
                },
                update: { watchedPercent: nextPercent, completedAt },
                create: {
                  enrollmentId: enrollment.id,
                  lessonId: request.params.lessonId,
                  watchedPercent: nextPercent,
                  completedAt,
                },
              });
              const completedLessons = await transaction.lessonProgress.count({
                where: { enrollmentId: enrollment.id, completedAt: { not: null } },
              });
              let certificate = enrollment.certificate;
              if (
                !certificate &&
                enrollment.course.lessons.length > 0 &&
                completedLessons === enrollment.course.lessons.length
              ) {
                certificate = await transaction.certificate.upsert({
                  where: { enrollmentId: enrollment.id },
                  update: {},
                  create: {
                    enrollmentId: enrollment.id,
                    serialCode: serialCode(),
                    learnerName: enrollment.user.displayName,
                    courseTitle: enrollment.course.title,
                  },
                });
              }
              return {
                lessonProgress: {
                  lessonId: lessonProgress.lessonId,
                  watchedPercent: lessonProgress.watchedPercent,
                  completedAt: lessonProgress.completedAt?.toISOString() ?? null,
                },
                courseProgressPercent: progressPercent(
                  completedLessons,
                  enrollment.course.lessons.length
                ),
                completedLessons,
                totalLessons: enrollment.course.lessons.length,
                certificate: certificate ? certificateDto(certificate) : null,
              } satisfies ProgressUpdateResultDto;
            },
            { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
          );
          break;
        } catch (error: unknown) {
          const retryable =
            error instanceof Prisma.PrismaClientKnownRequestError &&
            (error.code === 'P2002' || error.code === 'P2034');
          if (!retryable || attempt === 4) throw error;
        }
      }

      if (!result) {
        return reply
          .code(404)
          .send({ code: 'ENROLLMENT_NOT_FOUND', message: 'Enrollment not found.' });
      }
      return result;
    }
  );
}
