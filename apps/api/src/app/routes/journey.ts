import { PrismaClient } from '@prisma/client';
import { FastifyInstance } from 'fastify';
import { CertificateDto, JourneyItemDto } from '@dudecourse/shared/domain';
import { createCertificatePdf } from '../lib/certificate';

function toCertificate(certificate: {
  id: string;
  serialCode: string;
  learnerName: string;
  courseTitle: string;
  issuedAt: Date;
}): CertificateDto {
  return { ...certificate, issuedAt: certificate.issuedAt.toISOString() };
}

export function registerJourneyRoutes(app: FastifyInstance, database: PrismaClient): void {
  app.get(
    '/me/journey',
    { onRequest: [app.authenticate] },
    async (request): Promise<JourneyItemDto[]> => {
      const enrollments = await database.enrollment.findMany({
        where: { userId: request.user.sub },
        orderBy: { enrolledAt: 'desc' },
        include: {
          course: { include: { _count: { select: { lessons: true } } } },
          progress: true,
          certificate: true,
        },
      });

      return enrollments.map((enrollment) => {
        const totalLessons = enrollment.course._count.lessons;
        const completedLessons = enrollment.progress.filter((item) => item.completedAt).length;
        return {
          course: {
            id: enrollment.course.id,
            slug: enrollment.course.slug,
            title: enrollment.course.title,
            description: enrollment.course.description,
            lessonCount: totalLessons,
            videoAuthor: enrollment.course.videoAuthor,
            youtubeChannel: enrollment.course.youtubeChannel,
            authorInfoUrl: enrollment.course.authorInfoUrl,
            language: enrollment.course.language,
            totalDurationMinutes: enrollment.course.totalDurationMinutes,
          },
          enrollment: {
            id: enrollment.id,
            enrolledAt: enrollment.enrolledAt.toISOString(),
            progressPercent: totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0,
            completedLessons,
            totalLessons,
            certificate: enrollment.certificate ? toCertificate(enrollment.certificate) : null,
          },
        };
      });
    }
  );

  app.get<{ Params: { certificateId: string } }>(
    '/certificates/:certificateId/pdf',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const certificate = await database.certificate.findFirst({
        where: { id: request.params.certificateId, enrollment: { userId: request.user.sub } },
      });
      if (!certificate) {
        return reply
          .code(404)
          .send({ code: 'CERTIFICATE_NOT_FOUND', message: 'Certificate not found.' });
      }
      const pdf = await createCertificatePdf(toCertificate(certificate));
      return reply
        .header('Content-Type', 'application/pdf')
        .header(
          'Content-Disposition',
          `attachment; filename="dude-course-${certificate.serialCode}.pdf"`
        )
        .send(Buffer.from(pdf));
    }
  );
}
