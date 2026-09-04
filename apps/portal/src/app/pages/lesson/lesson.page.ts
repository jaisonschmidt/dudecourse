import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CourseDetailDto, LessonDto } from '@dudecourse/shared/domain';
import {
  BadgeComponent,
  ButtonDirective,
  LinkDirective,
  ProgressComponent,
  StatePanelComponent,
} from '@dudecourse/ui';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
import { CoursesService } from '../../core/services/courses.service';
import { YoutubePlayerComponent } from './youtube-player.component';

interface LessonView {
  course: CourseDetailDto;
  lesson: LessonDto;
}

@Component({
  selector: 'dc-lesson-page',
  standalone: true,
  imports: [
    AsyncPipe,
    RouterLink,
    BadgeComponent,
    ButtonDirective,
    LinkDirective,
    ProgressComponent,
    StatePanelComponent,
    YoutubePlayerComponent,
  ],
  template: `
    <main class="page">
      @if (view$ | async; as view) {
        @if (view) {
          <a dcLink [routerLink]="['/courses', view.course.slug]">← Back to course</a>
          <div class="lesson-layout">
            <section>
              <p class="dc-eyebrow">
                Lesson {{ view.lesson.position }} of {{ view.course.lessonCount }}
              </p>
              <h1>{{ view.lesson.title }}</h1>
              <dc-youtube-player
                [videoId]="view.lesson.youtubeVideoId"
                [trackingEnabled]="!!view.course.enrollment"
                [baselinePercent]="view.lesson.progress?.watchedPercent ?? 0"
                (watchedPercent)="saveProgress(view, $event)"
              />
              @if (!view.course.enrollment) {
                <div class="notice">
                  <strong>You are watching as a guest.</strong
                  ><span>Enroll in this course to save progress and earn a certificate.</span
                  ><a dcButton [routerLink]="['/courses', view.course.slug]">View enrollment</a>
                </div>
              }
              @if (message) {
                <p class="error-message" role="status">{{ message }}</p>
              }
            </section>
            <aside>
              <h2>Your progress</h2>
              @if (view.course.enrollment; as enrollment) {
                <dc-progress
                  [value]="enrollment.progressPercent"
                  [label]="
                    enrollment.completedLessons +
                    ' of ' +
                    enrollment.totalLessons +
                    ' lessons complete'
                  "
                />
                @if (view.lesson.progress?.completedAt) {
                  <dc-badge variant="complete">Lesson complete</dc-badge>
                }
              } @else {
                <p class="muted">Progress starts after enrollment.</p>
              }
              <h3>Course lessons</h3>
              <ol>
                @for (lesson of view.course.lessons; track lesson.id) {
                  <li [class.current]="lesson.id === view.lesson.id">
                    <a [routerLink]="['/courses', view.course.slug, 'lessons', lesson.id]"
                      >{{ lesson.position }}. {{ lesson.title }}</a
                    >
                  </li>
                }
              </ol>
            </aside>
          </div>
        } @else {
          <dc-state-panel
            ><h1>Lesson not found</h1>
            <a dcButton routerLink="/">Browse courses</a></dc-state-panel
          >
        }
      }
    </main>
  `,
  styles: [
    `
      .lesson-layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 19rem;
        gap: 2rem;
        margin-top: 2rem;
      }
      .lesson-layout h1 {
        font-size: clamp(2rem, 5vw, 3.5rem);
        margin: 0.3rem 0 1.5rem;
      }
      aside {
        padding: 1.4rem;
        border: 1px solid var(--dc-color-border);
        border-radius: 1.2rem;
        background: white;
        height: max-content;
        position: sticky;
        top: 6rem;
      }
      aside h3 {
        margin-top: 2rem;
      }
      aside ol {
        padding-left: 1.4rem;
      }
      aside li {
        margin: 0.8rem 0;
        color: var(--dc-color-muted);
      }
      aside li.current {
        color: var(--dc-color-primary);
        font-weight: 800;
      }
      aside a {
        text-decoration: none;
      }
      .notice {
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 1rem;
        align-items: center;
        margin-top: 1rem;
        padding: 1rem;
        border-radius: 1rem;
        background: #e5f3f1;
      }
      .notice span {
        color: var(--dc-color-muted);
      }
      @media (max-width: 52rem) {
        .lesson-layout {
          grid-template-columns: 1fr;
        }
        aside {
          position: static;
        }
        .notice {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LessonPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly courses = inject(CoursesService);
  message = '';
  readonly view$: Observable<LessonView | null> = this.route.paramMap.pipe(
    switchMap((params) => {
      const slug = params.get('slug');
      const lessonId = params.get('lessonId');
      return slug && lessonId
        ? this.courses.getCourse(slug).pipe(
            map((course) => {
              const lesson = course.lessons.find((item) => item.id === lessonId);
              return lesson ? { course, lesson } : null;
            }),
            catchError(() => of(null))
          )
        : of(null);
    })
  );

  saveProgress(view: LessonView, watchedPercent: number): void {
    const enrollment = view.course.enrollment;
    if (!enrollment) return;
    this.courses.updateProgress(enrollment.id, view.lesson.id, watchedPercent).subscribe({
      next: (result) => {
        view.lesson.progress = result.lessonProgress;
        enrollment.progressPercent = result.courseProgressPercent;
        enrollment.completedLessons = result.completedLessons;
        enrollment.certificate = result.certificate;
        this.message = result.lessonProgress.completedAt
          ? 'Lesson complete — nice work!'
          : 'Progress saved.';
      },
      error: () => {
        this.message = 'We could not save progress. We will try again when you keep watching.';
      },
    });
  }
}
