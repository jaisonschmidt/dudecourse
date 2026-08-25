import { database } from '../src';

const allowedEnvironments = new Set(['local', 'hml']);
const appEnvironment = process.env['APP_ENV'];

if (!appEnvironment || !allowedEnvironments.has(appEnvironment)) {
  throw new Error('Database seeding is allowed only when APP_ENV is local or hml.');
}

/// Until an admin UI exists, this file is the catalog content-entry mechanism (PRD open question 1).
const courses = [
  {
    slug: 'javascript-fundamentals',
    title: 'JavaScript Fundamentals',
    description: 'Core JavaScript language concepts, from values and types through async patterns.',
    published: true,
    lessons: [
      { title: 'Values, Types and Variables', youtubeVideoId: 'lkIFF4maKMU' },
      { title: 'Functions and Scope', youtubeVideoId: 'iLWTnMzWtj4' },
      { title: 'Working with Asynchronous Code', youtubeVideoId: 'PoRJizFvM7s' },
    ],
  },
  {
    slug: 'typescript-for-javascript-developers',
    title: 'TypeScript for JavaScript Developers',
    description: 'Add static types to an existing JavaScript codebase without rewriting it.',
    published: true,
    lessons: [
      { title: 'Why TypeScript', youtubeVideoId: 'zQnBQ4tB3ZA' },
      { title: 'Interfaces and Type Aliases', youtubeVideoId: 'VbW6vWTaHOA' },
    ],
  },
  {
    slug: 'relational-databases-101',
    title: 'Relational Databases 101',
    description:
      'Draft course kept unpublished so the catalog visibility rule is exercised locally.',
    published: false,
    lessons: [{ title: 'Tables, Keys and Relationships', youtubeVideoId: 'zsjvFFKOm3c' }],
  },
];

async function seed(): Promise<void> {
  for (const { slug, title, description, published, lessons } of courses) {
    const publishedAt = published ? new Date('2026-01-01T00:00:00.000Z') : null;

    const course = await database.course.upsert({
      where: { slug },
      update: { title, description, publishedAt },
      create: { slug, title, description, publishedAt },
    });

    for (const [index, lesson] of lessons.entries()) {
      const position = index + 1;

      await database.lesson.upsert({
        where: { courseId_position: { courseId: course.id, position } },
        update: { title: lesson.title, youtubeVideoId: lesson.youtubeVideoId },
        create: { courseId: course.id, position, ...lesson },
      });
    }

    // Drop lessons removed from the fixture so re-seeding converges on the declared list.
    await database.lesson.deleteMany({
      where: { courseId: course.id, position: { gt: lessons.length } },
    });
  }
}

seed()
  .then(() => database.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await database.$disconnect();
    process.exit(1);
  });
