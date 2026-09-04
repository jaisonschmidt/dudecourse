import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { CourseDetailDto } from '@dudecourse/shared/domain';
import { of } from 'rxjs';
import { CoursesService } from '../../core/services/courses.service';
import { YoutubeService } from '../../core/services/youtube.service';
import { LessonPageComponent } from './lesson.page';

beforeEach(() => {
  (window as unknown as { YT: unknown }).YT = {
    Player: jest.fn(() => ({ destroy: jest.fn(), getDuration: () => 100 })),
  };
});


function buildCourse(lessonCount: 1 | 2): CourseDetailDto {
  const lessons = [
    {
      id: 'lesson-1',
      title: 'First lesson',
      youtubeVideoId: 'video-1',
      position: 1,
      progress: null,
    },
    ...(lessonCount === 2
      ? [
          {
            id: 'lesson-2',
            title: 'Second lesson',
            youtubeVideoId: 'video-2',
            position: 2,
            progress: null,
          },
        ]
      : []),
  ];
  return {
    id: 'course-1',
    slug: 'course-slug',
    title: 'Course',
    description: '',
    lessonCount: lessons.length,
    videoAuthor: null,
    youtubeChannel: null,
    authorInfoUrl: null,
    language: null,
    totalDurationMinutes: null,
    lessons,
    enrollment: {
      id: 'enrollment-1',
      enrolledAt: new Date().toISOString(),
      progressPercent: 0,
      completedLessons: 0,
      totalLessons: lessons.length,
      certificate: null,
    },
  };
}

async function setup(
  course: CourseDetailDto,
  updateProgress: jest.Mock = jest.fn().mockReturnValue(
    of({
      lessonProgress: { lessonId: 'lesson-1', watchedPercent: 100, completedAt: null },
      courseProgressPercent: 0,
      completedLessons: 0,
      totalLessons: course.lessons.length,
      certificate: null,
    })
  )
): Promise<{
  fixture: ComponentFixture<LessonPageComponent>;
  router: Router;
  updateProgress: jest.Mock;
}> {
  await TestBed.configureTestingModule({
    imports: [LessonPageComponent, RouterTestingModule],
    providers: [
      {
        provide: ActivatedRoute,
        useValue: {
          paramMap: of(convertToParamMap({ slug: course.slug, lessonId: 'lesson-1' })),
        },
      },
      { provide: CoursesService, useValue: { getCourse: () => of(course), updateProgress } },
      { provide: YoutubeService, useValue: { load: () => Promise.resolve() } },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(LessonPageComponent);
  const router = TestBed.inject(Router);
  fixture.detectChanges();
  return { fixture, router, updateProgress };
}

describe('LessonPageComponent', () => {
  it('shows a next-lesson button and finalizes progress to 100% without auto-navigating', fakeAsync(() => {
    let fixture!: ComponentFixture<LessonPageComponent>;
    let router!: Router;
    let updateProgress!: jest.Mock;
    setup(buildCourse(2)).then((result) => {
      fixture = result.fixture;
      router = result.router;
      updateProgress = result.updateProgress;
    });
    tick();
    const navigateSpy = jest.spyOn(router, 'navigate');

    const course = buildCourse(2);
    fixture.componentInstance.onVideoEnded({ course, lesson: course.lessons[0] });

    expect(updateProgress).toHaveBeenCalledWith('enrollment-1', 'lesson-1', 100);
    expect(fixture.componentInstance.nextLesson?.id).toBe('lesson-2');
    tick(10_000);
    expect(navigateSpy).not.toHaveBeenCalled();
  }));

  it('does not save progress for a guest but still offers the next lesson', fakeAsync(() => {
    let fixture!: ComponentFixture<LessonPageComponent>;
    let updateProgress!: jest.Mock;
    const course = buildCourse(2);
    course.enrollment = null;
    setup(course).then((result) => {
      fixture = result.fixture;
      updateProgress = result.updateProgress;
    });
    tick();

    fixture.componentInstance.onVideoEnded({ course, lesson: course.lessons[0] });

    expect(updateProgress).not.toHaveBeenCalled();
    expect(fixture.componentInstance.nextLesson?.id).toBe('lesson-2');
  }));

  it('shows course complete on the last lesson instead of a next-lesson button', fakeAsync(() => {
    let fixture!: ComponentFixture<LessonPageComponent>;
    setup(buildCourse(1)).then((result) => {
      fixture = result.fixture;
    });
    tick();

    const course = buildCourse(1);
    fixture.componentInstance.onVideoEnded({ course, lesson: course.lessons[0] });

    expect(fixture.componentInstance.courseComplete).toBe(true);
    expect(fixture.componentInstance.nextLesson).toBeNull();
  }));
});
