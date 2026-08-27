import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { CourseSummary } from '../../core/models/course.models';
import { CoursesService } from '../../core/services/courses.service';

@Component({
  selector: 'dc-home-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main>
      <h1>Dude Course</h1>

      <ng-container *ngIf="courses$ | async as courses; else loadingTpl">
        <section *ngIf="!courses.length">
          <p>No courses are available right now.</p>
        </section>

        <section *ngIf="courses.length" class="courses">
          <article *ngFor="let course of courses" class="course-card">
            <h2>{{ course.title }}</h2>
            <p>{{ course.description }}</p>
            <p>{{ course.lessonCount }} lessons</p>
            <a [routerLink]="['/courses', course.slug]">View course</a>
          </article>
        </section>
      </ng-container>

      <ng-template #loadingTpl>
        <section>Loading courses...</section>
      </ng-template>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent {
  private readonly coursesService = inject(CoursesService);

  courses$: Observable<CourseSummary[]> = this.coursesService.getCourses();
}
