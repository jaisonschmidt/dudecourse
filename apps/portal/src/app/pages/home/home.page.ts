import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CourseSummaryDto } from '@dudecourse/shared/domain';
import { ButtonDirective, CardComponent, HeroComponent, StatePanelComponent } from '@dudecourse/ui';
import { Observable, catchError, of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { CoursesService } from '../../core/services/courses.service';

@Component({
  selector: 'dc-home-page',
  standalone: true,
  imports: [
    AsyncPipe,
    RouterLink,
    ButtonDirective,
    CardComponent,
    HeroComponent,
    StatePanelComponent,
  ],
  template: `
    <main class="dc-shell">
      <dc-hero
        eyebrow="Learn. Practice. Complete."
        title="Skills that move at your pace."
        description="Explore free, focused courses powered by great YouTube lessons. Join when you are ready to save progress and earn certificates."
      >
        <a dcButton href="#courses">Explore courses</a>
        @if (auth.user()) {
          <a dcButton variant="ghost" routerLink="/journey">Continue learning</a>
        } @else {
          <a dcButton variant="ghost" routerLink="/register">Create free account</a>
        }
      </dc-hero>

      <section id="courses" class="catalog" aria-labelledby="catalog-title">
        <div class="section-heading">
          <div>
            <p class="dc-eyebrow">Course catalog</p>
            <h2 id="catalog-title">Pick your next skill</h2>
          </div>
          <p>Watch every lesson for free. Enroll to keep your progress.</p>
        </div>
        @if (courses$ | async; as courses) {
          @if (courses.length) {
            <div class="grid">
              @for (course of courses; track course.id; let index = $index) {
                <dc-card>
                  <div class="course-art" [class.course-art--coral]="index % 2 === 1">
                    <span>{{ course.lessonCount }} lessons</span><b>0{{ index + 1 }}</b>
                  </div>
                  <h3>{{ course.title }}</h3>
                  <p>{{ course.description }}</p>
                  <a dcButton variant="ghost" [routerLink]="['/courses', course.slug]"
                    >View course <span aria-hidden="true">→</span></a
                  >
                </dc-card>
              }
            </div>
          } @else {
            <dc-state-panel
              ><h3>No courses yet</h3>
              <p>New courses are being prepared.</p></dc-state-panel
            >
          }
        }
      </section>
    </main>
  `,
  styles: [
    `
      .catalog {
        padding: 2rem 0 4rem;
        scroll-margin-top: 5rem;
      }
      .section-heading {
        display: flex;
        justify-content: space-between;
        align-items: end;
        gap: 2rem;
        margin-bottom: 1.5rem;
      }
      .section-heading h2 {
        margin: 0.25rem 0 0;
        font-size: clamp(2rem, 4vw, 3.2rem);
      }
      .section-heading > p {
        max-width: 25rem;
        color: var(--dc-color-muted);
      }
      dc-card h3 {
        margin: 1.25rem 0 0.65rem;
        font-size: 1.35rem;
      }
      dc-card p {
        min-height: 4.5rem;
        color: var(--dc-color-muted);
        line-height: 1.55;
      }
      .course-art {
        height: 9rem;
        padding: 1rem;
        border-radius: 1rem;
        background: linear-gradient(135deg, #0f766e, #51b9ad);
        color: white;
        display: flex;
        justify-content: space-between;
        align-items: start;
      }
      .course-art--coral {
        background: linear-gradient(135deg, #e85f50, #f8a060);
      }
      .course-art span {
        padding: 0.35rem 0.6rem;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.2);
        font-size: 0.8rem;
        font-weight: 750;
      }
      .course-art b {
        align-self: end;
        font-size: 3rem;
        opacity: 0.72;
      }
      @media (max-width: 40rem) {
        .section-heading {
          align-items: start;
          flex-direction: column;
          gap: 0.5rem;
        }
        .section-heading > p {
          margin: 0;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent {
  readonly auth = inject(AuthService);
  private readonly courses = inject(CoursesService);
  readonly courses$: Observable<CourseSummaryDto[]> = this.courses
    .getCourses()
    .pipe(catchError(() => of([])));
}
