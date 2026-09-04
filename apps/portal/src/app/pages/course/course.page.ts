import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CourseDetailDto } from '@dudecourse/shared/domain';
import {
  BadgeComponent,
  ButtonDirective,
  CardComponent,
  LinkDirective,
  ProgressComponent,
  StatePanelComponent,
} from '@dudecourse/ui';
import { BehaviorSubject, Observable, catchError, combineLatest, map, of, switchMap } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { CoursesService } from '../../core/services/courses.service';

@Component({
  selector: 'dc-course-page',
  standalone: true,
  imports: [
    AsyncPipe,
    RouterLink,
    BadgeComponent,
    ButtonDirective,
    CardComponent,
    LinkDirective,
    ProgressComponent,
    StatePanelComponent,
  ],
  template: `
    <main class="page">
      <a dcLink routerLink="/">← Back to courses</a>
      @if (course$ | async; as course) {
        @if (course) {
          <section class="course-heading">
            <div>
              <p class="dc-eyebrow">Free course</p>
              <h1>{{ course.title }}</h1>
              <p class="course-description">{{ course.description }}</p>
              @if (course.videoAuthor || course.youtubeChannel || course.language || course.totalDurationMinutes) {
                <ul class="course-meta">
                  @if (course.videoAuthor) {
                    <li>
                      By
                      @if (course.authorInfoUrl) {
                        <a dcLink [href]="course.authorInfoUrl" target="_blank" rel="noopener">{{
                          course.videoAuthor
                        }}</a>
                      } @else {
                        {{ course.videoAuthor }}
                      }
                    </li>
                  }
                  @if (course.youtubeChannel) {
                    <li>{{ course.youtubeChannel }}</li>
                  }
                  @if (course.language) {
                    <li>{{ course.language }}</li>
                  }
                  @if (course.totalDurationMinutes) {
                    <li>{{ course.totalDurationMinutes }} min</li>
                  }
                </ul>
              }
            </div>
            <dc-card class="enrollment-card">
              <strong>{{ course.lessonCount }} focused lessons</strong>
              @if (course.enrollment; as enrollment) {
                <dc-badge [variant]="enrollment.progressPercent === 100 ? 'complete' : 'default'">{{
                  enrollment.progressPercent === 100 ? 'Completed' : 'Enrolled'
                }}</dc-badge>
                <dc-progress [value]="enrollment.progressPercent" label="Course progress" />
                <a dcButton [routerLink]="firstLessonLink(course)">{{
                  enrollment.progressPercent ? 'Continue learning' : 'Start learning'
                }}</a>
              } @else {
                <p class="muted">
                  Watch for free, or enroll to save your progress and earn a certificate.
                </p>
                <button dcButton type="button" [disabled]="enrolling" (click)="enroll(course)">
                  {{ enrolling ? 'Enrolling…' : 'Enroll free' }}
                </button>
              }
              @if (message) {
                <p class="error-message" role="alert">{{ message }}</p>
              }
            </dc-card>
          </section>

          <section class="lessons" aria-labelledby="lessons-title">
            <div>
              <p class="dc-eyebrow">Curriculum</p>
              <h2 id="lessons-title">Course lessons</h2>
            </div>
            <ol>
              @for (lesson of course.lessons; track lesson.id) {
                <li>
                  <a [routerLink]="['/courses', course.slug, 'lessons', lesson.id]">
                    <span class="lesson-number">{{
                      lesson.position.toString().padStart(2, '0')
                    }}</span>
                    <span
                      ><strong>{{ lesson.title }}</strong
                      ><small>{{ lesson.progress?.watchedPercent ?? 0 }}% watched</small></span
                    >
                    @if (lesson.progress?.completedAt) {
                      <dc-badge variant="complete">Complete</dc-badge>
                    } @else {
                      <span aria-hidden="true">▶</span>
                    }
                  </a>
                </li>
              }
            </ol>
          </section>
        } @else {
          <dc-state-panel
            ><h1>Course not found</h1>
            <a dcButton routerLink="/">Browse courses</a></dc-state-panel
          >
        }
      }
    </main>
  `,
  styles: [
    `
      .course-heading {
        display: grid;
        grid-template-columns: 1fr 23rem;
        gap: 3rem;
        align-items: center;
        padding: 3.5rem 0;
      }
      .course-heading h1 {
        font-size: clamp(2.5rem, 6vw, 5rem);
        line-height: 1;
        margin: 0.3rem 0 1rem;
      }
      .course-description {
        max-width: 42rem;
        color: var(--dc-color-muted);
        font-size: 1.1rem;
        line-height: 1.7;
      }
      .course-meta {
        list-style: none;
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem 1rem;
        margin: 0.75rem 0 0;
        padding: 0;
        color: var(--dc-color-muted);
        font-size: 0.95rem;
      }
      .enrollment-card {
        display: block;
      }
      .enrollment-card strong,
      .enrollment-card dc-badge,
      .enrollment-card dc-progress,
      .enrollment-card .dc-button {
        display: flex;
        margin-bottom: 1.1rem;
      }
      .lessons {
        padding: 2rem 0;
      }
      .lessons h2 {
        font-size: 2.3rem;
        margin: 0.25rem 0 1.4rem;
      }
      .lessons ol {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 0.75rem;
      }
      .lessons li a {
        display: grid;
        grid-template-columns: 3rem 1fr auto;
        gap: 1rem;
        align-items: center;
        padding: 1.1rem 1.25rem;
        border: 1px solid var(--dc-color-border);
        border-radius: 1rem;
        background: white;
        text-decoration: none;
      }
      .lessons li a:hover {
        border-color: var(--dc-color-primary);
        transform: translateX(3px);
      }
      .lesson-number {
        font-weight: 850;
        color: var(--dc-color-coral);
      }
      .lessons small {
        display: block;
        color: var(--dc-color-muted);
        margin-top: 0.25rem;
      }
      @media (max-width: 50rem) {
        .course-heading {
          grid-template-columns: 1fr;
          gap: 1rem;
          padding-top: 2rem;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoursePageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly courses = inject(CoursesService);
  readonly auth = inject(AuthService);
  private readonly refresh = new BehaviorSubject<void>(undefined);
  enrolling = false;
  message = '';

  readonly course$: Observable<CourseDetailDto | null> = combineLatest([
    this.route.paramMap,
    this.refresh,
  ]).pipe(
    map(([params]) => params.get('slug')),
    switchMap((slug) =>
      slug ? this.courses.getCourse(slug).pipe(catchError(() => of(null))) : of(null)
    )
  );

  firstLessonLink(course: CourseDetailDto): string[] {
    const lesson = course.lessons.find((item) => !item.progress?.completedAt) ?? course.lessons[0];
    return lesson ? ['/courses', course.slug, 'lessons', lesson.id] : ['/courses', course.slug];
  }

  enroll(course: CourseDetailDto): void {
    if (!this.auth.user()) {
      void this.router.navigate(['/login'], {
        queryParams: { returnUrl: `/courses/${course.slug}` },
      });
      return;
    }
    this.enrolling = true;
    this.message = '';
    this.courses.enroll(course.id).subscribe({
      next: () => {
        this.enrolling = false;
        this.refresh.next();
      },
      error: () => {
        this.enrolling = false;
        this.message = 'We could not enroll you. Please try again.';
      },
    });
  }
}
