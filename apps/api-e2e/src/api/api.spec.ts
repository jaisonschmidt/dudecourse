import axios, { AxiosInstance } from 'axios';

function authenticatedClient(cookie: string): AxiosInstance {
  return axios.create({ baseURL: axios.defaults.baseURL, headers: { Cookie: cookie } });
}

describe('Dude Course API journey', () => {
  it('exposes health and the published catalog', async () => {
    const health = await axios.get('/healthz');
    const courses = await axios.get('/courses');

    expect(health.data).toEqual({ ok: true });
    expect(courses.data.length).toBeGreaterThan(0);
  });

  it('registers, enrolls, records monotonic progress and issues an owned PDF', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const registration = await axios.post('/auth/register', {
      displayName: 'API Learner',
      email: ` API-${suffix}@example.com `,
      password: 'unicode-password-ç',
    });
    const cookie = registration.headers['set-cookie']?.[0]?.split(';')[0];
    expect(cookie).toMatch(/^dc_session=/);
    expect(registration.data.email).toBe(`api-${suffix}@example.com`);
    const learner = authenticatedClient(cookie as string);

    const detail = await learner.get('/courses/javascript-fundamentals');
    expect(detail.data.enrollment).toBeNull();
    const firstEnrollment = await learner.post(`/courses/${detail.data.id}/enrollments`, {});
    const secondEnrollment = await learner.post(`/courses/${detail.data.id}/enrollments`, {});
    expect(firstEnrollment.status).toBe(201);
    expect(secondEnrollment.status).toBe(200);
    expect(secondEnrollment.data.id).toBe(firstEnrollment.data.id);

    const firstLesson = detail.data.lessons[0];
    const at89 = await learner.put(
      `/enrollments/${firstEnrollment.data.id}/lessons/${firstLesson.id}/progress`,
      { watchedPercent: 89 }
    );
    expect(at89.data.lessonProgress.completedAt).toBeNull();
    const at90 = await learner.put(
      `/enrollments/${firstEnrollment.data.id}/lessons/${firstLesson.id}/progress`,
      { watchedPercent: 90 }
    );
    expect(at90.data.lessonProgress.completedAt).not.toBeNull();
    const regression = await learner.put(
      `/enrollments/${firstEnrollment.data.id}/lessons/${firstLesson.id}/progress`,
      { watchedPercent: 10 }
    );
    expect(regression.data.lessonProgress.watchedPercent).toBe(90);

    let completed = at90.data;
    for (const lesson of detail.data.lessons.slice(1)) {
      completed = (
        await learner.put(`/enrollments/${firstEnrollment.data.id}/lessons/${lesson.id}/progress`, {
          watchedPercent: 90,
        })
      ).data;
    }
    expect(completed.courseProgressPercent).toBe(100);
    expect(completed.certificate.serialCode).toMatch(/^DC-\d{4}-[A-Z2-9]{12}$/);

    const journey = await learner.get('/me/journey');
    expect(journey.data[0].enrollment.progressPercent).toBe(100);
    const pdf = await learner.get(`/certificates/${completed.certificate.id}/pdf`, {
      responseType: 'arraybuffer',
    });
    expect(Buffer.from(pdf.data).subarray(0, 4).toString()).toBe('%PDF');

    const otherRegistration = await axios.post('/auth/register', {
      displayName: 'Other Learner',
      email: `other-${suffix}@example.com`,
      password: 'another-password',
    });
    const otherCookie = otherRegistration.headers['set-cookie']?.[0]?.split(';')[0] as string;
    const other = authenticatedClient(otherCookie);
    const isolated = await other.get(`/certificates/${completed.certificate.id}/pdf`, {
      validateStatus: () => true,
    });
    expect(isolated.status).toBe(404);

    const logout = await learner.post('/auth/logout', {});
    expect(logout.headers['set-cookie']?.[0]).toContain('dc_session=;');
    const afterLogout = await axios.get('/auth/me', { validateStatus: () => true });
    expect(afterLogout.status).toBe(401);
  });
});
