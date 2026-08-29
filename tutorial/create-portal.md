# Tutorial: Create the Dude Course Portal

> **Implementation record:** `apps/portal` already exists. Do not rerun the application generator
> in the current checkout. This tutorial preserves the intended construction of the initial slice;
> use [portal onboarding](../apps/portal/ONBOARDING.md) for current commands and limitations.

This tutorial explains how to create the first Angular portal app for Dude Course and implement the
first two learner-facing screens:

- `Home` page — lists courses
- `Course` page — shows course details and lessons

Do not use this tutorial to add authentication, enrollment, progress tracking, certificates, or any
database access. Those belong to later slices.

## 1. Goal

Create an Nx Angular application at `apps/portal` that calls the existing API and presents the first
catalog screens, backed by the existing read-only endpoints:

- `GET /courses`
- `GET /courses/:slug/lessons`

The portal must follow the repository architecture:

- The portal app lives in `apps/portal`.
- The portal app is tagged with `type:app` and `scope:portal`.
- The portal may depend only on `scope:ui` and `scope:shared` libraries (in later slices).
- The portal must never import `@dudecourse/database`.
- The portal uses Angular 17.
- The portal must not reach the database directly. All data comes through the API.

Canonical references:

- `docs/ARCHITECTURE.md`
- `docs/ONBOARDING.md`
- `apps/api/ONBOARDING.md`
- `libs/database/prisma/schema.prisma`

## 2. Prerequisites

Run commands from the repository root.

Use the pinned Node version:

```sh
nvm use
node --version
```

The workspace is pinned to Node `20.11.0`. It is also pinned to Nx `19.8.14` and Angular `17.3.12`,
so do not upgrade Angular or move to Nx 20+. Nx 20+ cannot generate Angular 17 projects.

Install dependencies if needed:

```sh
npm install
```

Start the API and database before testing the portal:

```sh
npm run db:up
npm run db:migrate:deploy
npm run db:generate
npm run db:seed
npx nx serve api
```

The API listens on `http://localhost:3000`.

## 3. Generate the Portal App

Create the app with the documented Nx generator:

```sh
npx nx g @nx/angular:application portal \
  --directory=apps/portal \
  --tags=type:app,scope:portal
```

Do not create the app by copying folders manually. The generator wires project metadata, TypeScript
configuration, build targets, lint setup, and Jest support correctly.

Style (`scss`), the `dc` selector prefix, standalone components, Jest, and Playwright are already
set as generator defaults in `nx.json`, so you do not need to pass them.

Because the workspace pins `@angular/core@17.3.12`, the generator produces an Angular 17 project and
pulls in `@angular/cli` and `@angular-devkit/build-angular` on the `~17.3.0` line.

After generation, inspect the project:

```sh
npx nx show project portal
```

The generated project has these tags:

```json
["type:app", "scope:portal"]
```

If the tags are missing, fix `apps/portal/project.json` before writing app code. Untagged apps
bypass the repository boundary rules and silently defeat the architecture.

## 4. Add Portal Onboarding

Every new project needs an onboarding document.

Create:

```txt
apps/portal/ONBOARDING.md
```

Include at least:

- Project purpose
- Main commands
- Local run, test, and build flow
- Dependency-boundary notes (portal must never import `@dudecourse/database`)
- Links to `docs/ARCHITECTURE.md`, `docs/ONBOARDING.md`, and `apps/api/ONBOARDING.md`

Then add a short link to that file from `docs/ONBOARDING.md`, near the project creation section, so
new contributors can discover it quickly.

## 5. Configure the API Base URL

The portal calls the API from the browser at `http://localhost:3000`, so the app needs a
configuration value for the base URL.

Generate the Angular environment files:

```sh
npx nx g @schematics/angular:environments --project=portal
```

This creates the `src/environments` folder and wires the production `fileReplacements` in the
build configuration. Then edit the generated files.

```ts
// apps/portal/src/environments/environment.ts
export const environment = {
  production: true,
  apiUrl: 'http://localhost:3000',
};
```

```ts
// apps/portal/src/environments/environment.development.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
};
```

The Angular dev server runs on `http://localhost:4200`, while the API runs on
`http://localhost:3000`. Because the browser makes cross-origin requests, the API needs CORS
enabled.

## 6. Enable CORS on the API

The API app already runs on Fastify. Add Fastify CORS so the browser can call the API from the
portal during local development.

The workspace uses Fastify `4.x`, so install the matching CORS plugin line:

```sh
npm install @fastify/cors@^8.5.0
```

Then register it in `apps/api/src/app/app.ts`, before the routes:

```ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { database } from '@dudecourse/database';

export function createApp() {
  const app = Fastify({ logger: true });

  app.register(cors, {
    origin: 'http://localhost:4200',
  });

  app.get('/healthz', async () => ({ ok: true }));

  // ...existing /courses and /courses/:slug/lessons routes remain unchanged...

  app.addHook('onClose', async () => {
    await database.$disconnect();
  });

  return app;
}
```

This is the minimal change needed for the browser to call the API while the portal runs on
`http://localhost:4200`. Do not import `@dudecourse/database` from the portal — the CORS-enabled API
remains the only data path.

## 7. Define the Portal View Models

For this slice, keep the models inside the portal app. Do not create a shared library yet — that is
a later slice.

Create a model file:

```txt
apps/portal/src/app/core/models/course.models.ts
```

Add:

```ts
export interface CourseSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  lessonCount: number;
}

export interface Lesson {
  id: string;
  title: string;
  youtubeVideoId: string;
  position: number;
}
```

These shapes match the API responses exactly:

- `GET /courses` returns an array of `CourseSummary`.
- `GET /courses/:slug/lessons` returns an array of `Lesson` ordered by `position`.

## 8. Create the `CoursesService`

Create a service:

```txt
apps/portal/src/app/core/services/courses.service.ts
```

Use `HttpClient` to call the API:

```ts
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CourseSummary, Lesson } from '../models/course.models';

@Injectable({ providedIn: 'root' })
export class CoursesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getCourses(): Observable<CourseSummary[]> {
    return this.http.get<CourseSummary[]>(`${this.apiUrl}/courses`);
  }

  getLessons(courseSlug: string): Observable<Lesson[]> {
    return this.http.get<Lesson[]>(`${this.apiUrl}/courses/${courseSlug}/lessons`);
  }

  getCourse(courseSlug: string): Observable<CourseSummary | undefined> {
    return this.getCourses().pipe(
      map((courses) => courses.find((course) => course.slug === courseSlug))
    );
  }
}
```

The current API does not expose a dedicated `GET /courses/:slug` endpoint, so the Course page must
fetch the catalog and find the matching course by slug. A future slice may add a
`GET /courses/:slug` endpoint; if it does, replace `getCourse` with a direct call.

## 9. Configure App Bootstrapping and Routes

The generator produces a standalone Angular app. Wire the HTTP client and router in the app config.

Update `apps/portal/src/app/app.config.ts`:

```ts
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
  ],
};
```

Update `apps/portal/src/app/app.routes.ts`:

```ts
import { Routes } from '@angular/router';
import { HomePage } from './pages/home/home.page';
import { CoursePage } from './pages/course/course.page';

export const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'courses/:slug', component: CoursePage },
];
```

Make sure the root component template renders `<router-outlet />` so the routed pages appear.

## 10. Create the Home Page

Create:

```txt
apps/portal/src/app/pages/home/home.page.ts
```

Example:

```ts
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CourseSummary } from '../../core/models/course.models';
import { CoursesService } from '../../core/services/courses.service';

@Component({
  selector: 'dc-home-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main>
      <h1>Dude Course</h1>

      <section *ngIf="loading">Loading courses...</section>

      <section *ngIf="!loading && !courses.length">
        <p>No courses are available right now.</p>
      </section>

      <section *ngIf="!loading && courses.length" class="courses">
        <article *ngFor="let course of courses" class="course-card">
          <h2>{{ course.title }}</h2>
          <p>{{ course.description }}</p>
          <p>{{ course.lessonCount }} lessons</p>
          <a [routerLink]="['/courses', course.slug]">View course</a>
        </article>
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage implements OnInit {
  private readonly coursesService = inject(CoursesService);

  courses: CourseSummary[] = [];
  loading = false;

  ngOnInit(): void {
    this.loading = true;

    this.coursesService
      .getCourses()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (courses) => {
          this.courses = courses;
        },
        error: () => {
          this.courses = [];
        },
      });
  }
}
```

The catalog list shows title, description, and lesson count. `lessonCount` comes straight from the
`GET /courses` payload.

## 11. Create the Course Page

Create:

```txt
apps/portal/src/app/pages/course/course.page.ts
```

Example:

```ts
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, finalize } from 'rxjs';
import { CourseSummary, Lesson } from '../../core/models/course.models';
import { CoursesService } from '../../core/services/courses.service';

@Component({
  selector: 'dc-course-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main>
      <section *ngIf="loading">Loading course...</section>

      <section *ngIf="!loading && !course">
        <h1>Course not found</h1>
        <p>The requested course could not be found.</p>
      </section>

      <section *ngIf="!loading && course">
        <h1>{{ course.title }}</h1>
        <p>{{ course.description }}</p>

        <h2>Lessons</h2>

        <ul *ngIf="lessons.length; else emptyLessons">
          <li *ngFor="let lesson of lessons">
            <strong>{{ lesson.position }}.</strong> {{ lesson.title }}
          </li>
        </ul>

        <ng-template #emptyLessons>
          <p>No lessons are available for this course yet.</p>
        </ng-template>
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoursePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly coursesService = inject(CoursesService);

  course: CourseSummary | undefined;
  lessons: Lesson[] = [];
  loading = false;

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');

    if (!slug) {
      this.course = undefined;
      this.lessons = [];
      return;
    }

    this.loading = true;

    combineLatest([
      this.coursesService.getCourse(slug),
      this.coursesService.getLessons(slug),
    ])
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: ([course, lessons]) => {
          this.course = course;
          this.lessons = lessons;
        },
        error: () => {
          this.course = undefined;
          this.lessons = [];
        },
      });
  }
}
```

The page fetches the course detail (`getCourse(slug)`) and its ordered lessons (`getLessons(slug)`)
together, then renders both.

## 12. Testing Guidance

Include tests for the service and for page-level behavior. Test what the user sees, not whether a
mock was called in a specific order.

### Service tests

```ts
import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { CoursesService } from './courses.service';

describe('CoursesService', () => {
  let service: CoursesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    service = TestBed.inject(CoursesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads all courses', () => {
    const response = [
      {
        id: '1',
        slug: 'intro',
        title: 'Intro to Dude Course',
        description: 'A short introduction',
        lessonCount: 3,
      },
    ];

    service.getCourses().subscribe((courses) => {
      expect(courses).toEqual(response);
    });

    const req = httpMock.expectOne('http://localhost:3000/courses');
    expect(req.request.method).toBe('GET');
    req.flush(response);
  });

  it('finds a course by slug', () => {
    const response = [
      {
        id: '1',
        slug: 'intro',
        title: 'Intro to Dude Course',
        description: 'A short introduction',
        lessonCount: 3,
      },
    ];

    service.getCourse('intro').subscribe((course) => {
      expect(course?.title).toBe('Intro to Dude Course');
    });

    httpMock.expectOne('http://localhost:3000/courses').flush(response);
  });
});
```

### Component tests

Render each page with a mocked `CoursesService` and assert the rendered content.

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CoursesService } from '../../core/services/courses.service';
import { HomePage } from './home.page';

describe('HomePage', () => {
  let fixture: ComponentFixture<HomePage>;

  beforeEach(async () => {
    const coursesService = {
      getCourses: jest.fn().mockReturnValue(
        of([
          {
            id: '1',
            slug: 'intro',
            title: 'Intro to Dude Course',
            description: 'A short introduction',
            lessonCount: 3,
          },
        ])
      ),
    };

    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideRouter([]),
        { provide: CoursesService, useValue: coursesService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
  });

  it('renders a course card', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Intro to Dude Course');
    expect(text).toContain('3 lessons');
  });
});
```

For the Course page, provide the route param (for example with `provideRouter` and a test harness,
or by overriding `ActivatedRoute`) and assert that the title and ordered lesson list appear.

## 13. Manual Checks

Start the API and portal:

```sh
npm run db:up
npm run db:migrate:deploy
npm run db:generate
npm run db:seed
npx nx serve api
npx nx serve portal
```

Then open:

```txt
http://localhost:4200
```

What to check:

- The home page loads the list of published courses.
- Each card shows title, description, and lesson count.
- Clicking a course navigates to `/courses/:slug`.
- The course page shows the course title and its ordered lesson list.
- An unknown slug renders the "Course not found" state.

## 14. Validation Commands

Run these after implementation:

```sh
npx nx lint portal
npx nx test portal
npx nx build portal
```

For a broader check before opening a pull request:

```sh
npm run affected:lint
npm run affected:test
npm run affected:build
npm run format:check
```

## 15. What Not to Include in This Slice

Do not add these yet:

- Authentication
- OAuth provider decisions
- JWT or session storage
- Enrollment
- Lesson progress tracking
- Certificate generation
- PDF export
- Database schema changes
- A shared domain DTO library
- A `libs/ui` component library
- Catalog search, filtering, categories, or tags
- YouTube video player integration

Keeping this first portal slice small makes it easier to validate the Nx Angular app, the API
boundary, and the read-only catalog flow before adding product features.

## 16. Completion Checklist

The portal slice is complete when:

- `apps/portal` exists and was generated with Nx.
- `apps/portal/project.json` has `type:app` and `scope:portal` tags.
- `apps/portal/ONBOARDING.md` exists.
- `docs/ONBOARDING.md` links to the portal onboarding document.
- The portal runs on `http://localhost:4200`.
- The API runs on `http://localhost:3000` with CORS enabled for the portal origin.
- The Home page lists available published courses.
- The Course page displays the matching course and its ordered lessons.
- An unknown course slug renders a not-found state.
- `npx nx lint portal` passes.
- `npx nx test portal` passes.
- `npx nx build portal` passes.
