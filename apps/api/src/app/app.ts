import Fastify from 'fastify';
import { database } from '@dudecourse/database';

export function createApp() {
  const app = Fastify({ logger: true });

  app.get('/healthz', async () => ({ ok: true }));

  app.get('/courses', async () => {
    const courses = await database.course.findMany({
      where: {
        publishedAt: {
          not: null,
        },
      },
      orderBy: [{ title: 'asc' }],
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        _count: {
          select: {
            lessons: true,
          },
        },
      },
    });

    return courses.map((course) => ({
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      lessonCount: course._count.lessons,
    }));
  });

  app.get('/courses/:slug/lessons', async (request, reply) => {
    const { slug } = request.params as { slug: string };

    const course = await database.course.findFirst({
      where: {
        slug,
        publishedAt: {
          not: null,
        },
      },
      select: {
        lessons: {
          orderBy: {
            position: 'asc',
          },
          select: {
            id: true,
            title: true,
            youtubeVideoId: true,
            position: true,
          },
        },
      },
    });

    if (!course) {
      return reply.code(404).send({ message: 'Course not found' });
    }

    return course.lessons;
  });

  app.addHook('onClose', async () => {
    await database.$disconnect();
  });

  return app;
}
