# Plan: Create the Shared UI Library

## 1. Goal

Create `libs/ui` as the shared, presentational Angular component library for the Dude Course
monorepo. The first version will provide:

- Global CSS foundations, design tokens, and variables
- Button styles and behavior
- Link styles
- Form fields and input styles
- A basic header
- A basic footer
- A jumbotron for course or highlighted-content banners

The library will be consumed internally through `@dudecourse/ui`. It will be buildable with
ng-packagr, but it will not be published to a package registry.

This work implements the UI library already planned in
[Architecture](../../docs/ARCHITECTURE.md#ui-library--libsui). It does not introduce a new
architectural or product decision, so it does not require a new ADR or a PRD update.

## 2. Architectural Boundaries

The UI library must remain presentational and reusable:

- Use inputs, outputs, and content projection to configure components.
- Do not make HTTP requests or inject portal services.
- Do not own route state, authentication, enrollment, or course-loading logic.
- Do not import the database library, Prisma, or API-specific code.
- Do not accept portal-specific models when ordinary component inputs or projected content are
  sufficient.
- Keep navigation destinations and application state in `apps/portal`.
- Depend only on libraries tagged `scope:ui` or `scope:shared`, as allowed by the repository's
  module-boundary rules.

The portal will continue to own pages, data fetching, and view state. It will compose those values
with components imported from `@dudecourse/ui`.

## 3. Generate the Library

Use Node `20.11.0` and generate the project with the exact repository-approved Nx command:

```powershell
nvm use
npx nx g @nx/angular:library ui `
  --directory=libs/ui `
  --buildable `
  --tags=type:lib,scope:ui
```

After generation, confirm that:

- `libs/ui/project.json` declares `type:lib` and `scope:ui`.
- `tsconfig.base.json` exposes the library as `@dudecourse/ui`.
- The generated project uses standalone Angular components, SCSS, Jest, and ESLint.
- The library can be built independently with ng-packagr.

Create every component or directive with an Nx generator rather than manually copying a project
structure. The defaults in `nx.json` provide the `dc` prefix, standalone components, SCSS, and
`OnPush` change detection.

## 4. Proposed Source Layout

```text
libs/ui/
├── ONBOARDING.md
├── project.json
├── ng-package.json
└── src/
    ├── index.ts
    ├── styles/
    │   ├── _tokens.scss
    │   ├── _reset.scss
    │   └── theme.scss
    └── lib/
        ├── button/
        ├── link/
        ├── form-field/
        ├── header/
        ├── footer/
        └── jumbotron/
```

Only supported public symbols should be exported from `libs/ui/src/index.ts`. Consumers must import
from `@dudecourse/ui`, not from internal source paths.

## 5. CSS Foundation and Design Tokens

Define the public design system with CSS custom properties. Initial token groups should cover:

- Brand, text, surface, border, muted, focus, and error colors
- Font families, sizes, weights, and line heights
- Spacing scale
- Border widths and radii
- Shadows
- Content widths and responsive breakpoints
- Focus-ring appearance

SCSS variables and mixins may support internal authoring, but components should primarily consume
CSS custom properties such as `var(--dc-color-primary)`. This lets an application change its theme
without modifying component source code.

Create one global `theme.scss` entry point and load it once in the portal before the portal's own
stylesheet:

```json
"styles": [
  "libs/ui/src/styles/theme.scss",
  "apps/portal/src/styles.scss"
]
```

Keep page-specific rules out of the library theme.

## 6. Initial Component APIs

### 6.1 Button

Prefer a directive applied to native buttons and anchors instead of a wrapper component:

```html
<button dcButton type="button">Enroll</button>
<a dcButton [routerLink]="['/courses', course.slug]">View course</a>
```

The directive should support a small, deliberate API such as:

- `variant`: `primary`, `secondary`, or `danger`
- `size`: `small`, `medium`, or `large`
- Native `disabled` behavior when used on a button

Using native elements preserves button, link, keyboard, form, and router semantics.

### 6.2 Link

Provide a styling directive for native anchors:

```html
<a dcLink routerLink="/">Back to courses</a>
```

It must remain compatible with `href`, Angular `routerLink`, keyboard navigation, and native link
attributes.

### 6.3 Form Fields and Inputs

Start with a form-field component and directives for native form controls:

```html
<dc-form-field
  label="Email"
  hint="We will not share your email."
  error="Enter a valid email."
>
  <input dcInput id="email" type="email" />
</dc-form-field>
```

The form field should support accessible label, hint, error, required, and disabled states. Keep
native form controls in the first version instead of creating custom `ControlValueAccessor`
implementations prematurely.

### 6.4 Header

The header should own semantic structure, spacing, and responsive layout while the portal supplies
the brand, links, and state-dependent actions through content projection:

```html
<dc-header>
  <a dcHeaderBrand routerLink="/">Dude Course</a>

  <nav dcHeaderNavigation aria-label="Primary navigation">
    <!-- Portal-owned links -->
  </nav>
</dc-header>
```

The UI library must not decide which routes exist or whether the learner is authenticated.

### 6.5 Footer

The footer should provide semantic structure and projected regions for branding, navigation, and
legal text. Link destinations and displayed application data remain portal concerns.

### 6.6 Jumbotron

The jumbotron should accept a heading and project supporting content and actions:

```html
<dc-jumbotron heading="Learn at your own pace">
  <p>Browse free courses and follow their lessons.</p>

  <div dcJumbotronActions>
    <a dcButton href="#courses">Browse courses</a>
  </div>
</dc-jumbotron>
```

It must not fetch a course or depend directly on `CourseSummary`. A portal page can transform its
course data into headings, text, images, and projected actions.

## 7. Implementation Sequence

Follow a test-driven sequence and keep each step independently reviewable:

1. Generate `libs/ui`, verify its tags and import alias, and create its onboarding document.
2. Add the CSS tokens and global theme entry point.
3. Write tests for and implement the button directive.
4. Write tests for and implement the link directive.
5. Write tests for and implement the jumbotron.
6. Write tests for and implement the header and footer using content projection.
7. Write tests for and implement the form-field and input directives.
8. Export the supported API from `libs/ui/src/index.ts`.
9. Load the global theme and integrate components into the portal incrementally.
10. Run library, portal, and relevant end-to-end checks.

For each component, first test its public behavior and accessibility. Avoid tests coupled to private
methods or large HTML snapshots.

## 8. Accessibility Requirements

The initial components should satisfy the PRD's accessibility requirement:

- Preserve native button, anchor, input, header, footer, and navigation semantics.
- Provide visible `:focus-visible` styles with sufficient contrast.
- Ensure every form control has an associated label.
- Connect hint and error messages with `aria-describedby` where applicable.
- Expose disabled and validation states semantically, not only visually.
- Support keyboard operation without application-specific handlers.
- Respect readable color contrast and avoid relying on color alone to communicate state.
- Use responsive layouts without hiding essential navigation or content.

## 9. Portal Integration

Integrate the library without moving application behavior out of `apps/portal`:

1. Load `theme.scss` globally in `apps/portal/project.json`.
2. Add the shared header and footer around the router outlet in the application shell.
3. Add the jumbotron to the Home page.
4. Replace styled page links and actions with `dcLink` or `dcButton`.
5. Use form-field components when authentication and enrollment forms are implemented.
6. Keep `CoursesService`, observables, API error handling, and routing state in the portal.

Standalone portal pages can import public UI symbols directly:

```ts
import {
  ButtonDirective,
  JumbotronComponent,
  LinkDirective,
} from '@dudecourse/ui';

@Component({
  standalone: true,
  imports: [ButtonDirective, JumbotronComponent, LinkDirective],
})
export class HomePageComponent {}
```

Migrate the existing Home and Course pages incrementally so that data-loading behavior remains
unchanged while their reusable presentation moves into the library.

## 10. Documentation Updates

Add `libs/ui/ONBOARDING.md` with at least:

- The library's purpose
- Its public API and import convention
- Component generation instructions
- Local lint, test, and build commands
- CSS token and theme usage
- Dependency-boundary notes
- Links to the PRD, architecture, and repository onboarding documents

Also update:

- `docs/ONBOARDING.md` to link to the UI library onboarding document and mark the project as active.
- `docs/ARCHITECTURE.md` to change the UI library status from planned to active.
- `AGENTS.md` only if the repository-wide working agreements or project status description becomes
  inaccurate after the implementation.

## 11. Verification

Run the required project checks after implementation:

```powershell
npx nx lint ui
npx nx test ui
npx nx build ui

npx nx lint portal
npx nx test portal
npx nx build portal
```

Run the portal end-to-end suite when navigation or visible user behavior changes:

```powershell
npx nx e2e portal-e2e
```

Finally, run formatting and inspect the affected project graph and changes:

```powershell
npm run format
npm run affected:lint
npm run affected:test
```

The work is complete when the UI library builds independently, the portal consumes it only through
its public alias, all required checks pass, and the new project documentation is discoverable from
the repository onboarding guide.
