import { Page, Route, expect, test } from '@playwright/test';

const course = {
  id: 'course-1',
  slug: 'javascript-fundamentals',
  title: 'JavaScript Fundamentals',
  description: 'Learn the language foundations with focused lessons.',
  lessonCount: 1,
  videoAuthor: null,
  youtubeChannel: null,
  authorInfoUrl: null,
  language: null,
  totalDurationMinutes: null,
};
const lesson = {
  id: 'lesson-1',
  title: 'Values and variables',
  youtubeVideoId: 'video-id',
  position: 1,
};

async function json(route: Route, status: number, body: unknown): Promise<void> {
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

async function mockBackend(page: Page): Promise<void> {
  let authenticated = false;
  let enrolled = false;
  let completed = false;
  const user = { id: 'user-1', email: 'learner@example.com', displayName: 'Test Learner' };
  const certificate = {
    id: 'certificate-1',
    serialCode: 'DC-2026-TESTCERT1234',
    learnerName: user.displayName,
    courseTitle: course.title,
    issuedAt: '2026-09-04T00:00:00.000Z',
  };
  const enrollment = () => ({
    id: 'enrollment-1',
    enrolledAt: '2026-09-04T00:00:00.000Z',
    progressPercent: completed ? 100 : 0,
    completedLessons: completed ? 1 : 0,
    totalLessons: 1,
    certificate: completed ? certificate : null,
  });
  const detail = () => ({
    ...course,
    enrollment: enrolled ? enrollment() : null,
    lessons: [
      {
        ...lesson,
        progress: enrolled
          ? {
              lessonId: lesson.id,
              watchedPercent: completed ? 100 : 0,
              completedAt: completed ? certificate.issuedAt : null,
            }
          : null,
      },
    ],
  });

  await page.addInitScript({
    content: `window.YT={Player:function(_el,options){this.getDuration=()=>1;this.destroy=()=>{};setTimeout(()=>options.events.onStateChange({data:1}),10);setTimeout(()=>options.events.onStateChange({data:2}),1150);}};`,
  });

  await page.route('http://localhost:3000/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === '/auth/me') {
      return json(
        route,
        authenticated ? 200 : 401,
        authenticated ? user : { code: 'UNAUTHORIZED' }
      );
    }
    if (path === '/auth/register') {
      authenticated = true;
      return json(route, 201, user);
    }
    if (path === '/courses' && request.method() === 'GET') return json(route, 200, [course]);
    if (path === `/courses/${course.slug}`) return json(route, 200, detail());
    if (path === `/courses/${course.id}/enrollments`) {
      enrolled = true;
      return json(route, 201, enrollment());
    }
    if (path.includes('/progress')) {
      completed = true;
      return json(route, 200, {
        lessonProgress: {
          lessonId: lesson.id,
          watchedPercent: 100,
          completedAt: certificate.issuedAt,
        },
        courseProgressPercent: 100,
        completedLessons: 1,
        totalLessons: 1,
        certificate,
      });
    }
    if (path === '/me/journey') {
      if (enrolled) completed = true;
      return json(route, 200, enrolled ? [{ course, enrollment: enrollment() }] : []);
    }
    if (path === `/certificates/${certificate.id}/pdf`) {
      return route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        headers: { 'Content-Disposition': 'attachment; filename="certificate.pdf"' },
        body: '%PDF-mocked',
      });
    }
    return json(route, 404, { code: 'NOT_FOUND' });
  });
}

test.beforeEach(async ({ page }) => mockBackend(page));

test('a guest browses the catalog and opens a public lesson', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Dude Course/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Skills that move');
  await page.getByRole('link', { name: /View course/ }).click();
  await page.getByRole('link', { name: /Values and variables/ }).click();
  await expect(page.getByText('You are watching as a guest.')).toBeVisible();
  await expect(page.getByText('Progress starts after enrollment.')).toBeVisible();
});

test('a learner registers, enrolls, completes a lesson and downloads a certificate', async ({
  page,
}) => {
  await page.goto('/register');
  await page.getByLabel('Your name').fill('Test Learner');
  await page.getByLabel('Email').fill('learner@example.com');
  await page.getByLabel('Password').fill('strong-password');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('heading', { name: 'My Journey' })).toBeVisible();

  await page.getByRole('link', { name: 'Courses', exact: true }).click();
  await page.getByRole('link', { name: /View course/ }).click();
  await page.getByRole('button', { name: 'Enroll free' }).click();
  await page.getByRole('link', { name: 'Start learning' }).click();
  await expect(page.getByRole('heading', { name: 'Your progress' })).toBeVisible();

  await page.getByRole('link', { name: 'My Journey' }).click();
  await expect(page.getByText('Certificate earned')).toBeVisible();
  const downloadStarted = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download certificate' }).click();
  const download = await downloadStarted;
  expect(download.suggestedFilename()).toBe('certificate.pdf');
});
