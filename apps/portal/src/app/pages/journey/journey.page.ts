import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { JourneyItemDto } from '@dudecourse/shared/domain';
import {
  BadgeComponent,
  ButtonDirective,
  CardComponent,
  ProgressComponent,
  StatePanelComponent,
} from '@dudecourse/ui';
import { Observable, catchError, of } from 'rxjs';
import { CoursesService } from '../../core/services/courses.service';

@Component({
  selector: 'dc-journey-page',
  standalone: true,
  imports: [
    AsyncPipe,
    DatePipe,
    RouterLink,
    BadgeComponent,
    ButtonDirective,
    CardComponent,
    ProgressComponent,
    StatePanelComponent,
  ],
  template: `
    <main class="page">
      <header class="page-heading">
        <p class="dc-eyebrow">Your learning space</p>
        <h1>My Journey</h1>
        <p>Keep moving, one lesson at a time. Your progress and certificates live here.</p>
      </header>
      @if (journey$ | async; as journey) {
        @if (journey.length) {
          <div class="journey-list">
            @for (item of journey; track item.enrollment.id) {
              <dc-card>
                <div class="card-heading">
                  <div>
                    <h2>{{ item.course.title }}</h2>
                    <p>Enrolled {{ item.enrollment.enrolledAt | date: 'mediumDate' }}</p>
                  </div>
                  @if (item.enrollment.certificate) {
                    <dc-badge variant="complete">Certificate earned</dc-badge>
                  }
                </div>
                <dc-progress
                  [value]="item.enrollment.progressPercent"
                  [label]="
                    item.enrollment.completedLessons +
                    ' of ' +
                    item.enrollment.totalLessons +
                    ' lessons complete'
                  "
                />
                <div class="actions">
                  <a dcButton [routerLink]="['/courses', item.course.slug]">{{
                    item.enrollment.progressPercent === 100 ? 'Review course' : 'Continue course'
                  }}</a>
                  @if (item.enrollment.certificate; as certificate) {
                    <a dcButton variant="ghost" [href]="certificateUrl(certificate.id)" download
                      >Download certificate</a
                    >
                  }
                </div>
              </dc-card>
            }
          </div>
        } @else {
          <dc-state-panel
            ><h2>Your journey starts with one course.</h2>
            <p>Explore the catalog and enroll for free.</p>
            <a dcButton routerLink="/">Browse courses</a></dc-state-panel
          >
        }
      }
    </main>
  `,
  styles: [
    `
      .journey-list {
        display: grid;
        gap: 1rem;
      }
      .card-heading {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
      }
      .card-heading h2 {
        margin-bottom: 0.3rem;
      }
      .card-heading p {
        color: var(--dc-color-muted);
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.8rem;
        margin-top: 1.4rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JourneyPageComponent {
  private readonly courses = inject(CoursesService);
  readonly journey$: Observable<JourneyItemDto[]> = this.courses
    .getJourney()
    .pipe(catchError(() => of([])));
  certificateUrl(id: string): string {
    return this.courses.certificateUrl(id);
  }
}
