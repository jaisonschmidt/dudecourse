import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, Observable, of, switchMap } from 'rxjs';
import { CourseSummary, Lesson } from '../../core/models/course.models';
import { CoursesService } from '../../core/services/courses.service';

@Component({
  selector: 'dc-course-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main>
      <ng-container *ngIf="lessons$ | async as lessons; else loadingTpl">
        <a routerLink="/">Back to courses</a>  
        <h1>Lessons</h1>

        <ul *ngIf="lessons.length; else emptyLessons">
          <li *ngFor="let lesson of lessons">
            <strong>{{ lesson.position }}.</strong> {{ lesson.title }}
          </li>
        </ul>
      </ng-container>

      <ng-template #loadingTpl>
        <section>Loading lessons...</section>
      </ng-template>

      <ng-template #emptyLessons>
        <p>No lessons are available for this course yet.</p>
      </ng-template>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoursePageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly coursesService = inject(CoursesService);

  course: CourseSummary | undefined;
  lessons: Lesson[] = [];
  loading = false;

  readonly lessons$: Observable<Lesson[]> = this.route.paramMap.pipe(
  map((params) => params.get('slug')),
  switchMap((slug) =>
    slug
      ? this.coursesService.getLessons(slug).pipe(catchError(() => of([])))
      : of([]),
  ),
);
}
