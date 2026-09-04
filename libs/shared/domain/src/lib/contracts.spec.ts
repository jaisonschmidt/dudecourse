import { CourseDetailDto } from './contracts';

describe('shared domain contracts', () => {
  it('represent a public course without an enrollment', () => {
    const course: CourseDetailDto = {
      id: 'course-id',
      slug: 'course',
      title: 'Course',
      description: 'Description',
      lessonCount: 0,
      videoAuthor: null,
      youtubeChannel: null,
      authorInfoUrl: null,
      language: null,
      totalDurationMinutes: null,
      lessons: [],
      enrollment: null,
    };

    expect(course.enrollment).toBeNull();
  });
});
