import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from '@dudecourse/ui';

@Component({
  selector: 'dc-about-page',
  standalone: true,
  imports: [RouterLink, ButtonDirective],
  template: `
    <main class="page">
      <header class="page-heading">
        <p class="dc-eyebrow">About Dude Course</p>
        <h1>Learn useful skills at your own pace.</h1>
        <p>
          Dude Course is a free learning portal with focused courses hosted on YouTube. Browse
          lessons, learn in your own time, and track your progress from one place.
        </p>
      </header>

      <section class="about-content" aria-labelledby="how-it-works-title">
        <p class="dc-eyebrow">The learning journey</p>
        <h2 id="how-it-works-title">How it works</h2>
        <ol>
          <li>Browse the available courses.</li>
          <li>Open a course to view its lessons.</li>
          <li>Create an account and enroll when you are ready.</li>
          <li>Watch the lessons while the portal tracks your progress.</li>
          <li>Complete every lesson to receive a downloadable certificate.</li>
        </ol>

        <a dcButton routerLink="/">Explore courses</a>
      </section>
    </main>
  `,
  styles: [
    `
      .about-content {
        max-width: 46rem;
      }

      .about-content h2 {
        margin-bottom: 1rem;
        font-size: clamp(1.8rem, 3vw, 2.6rem);
      }

      ol {
        display: grid;
        gap: 1rem;
        margin: 0 0 2rem;
        padding-left: 1.5rem;
        line-height: 1.7;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutPageComponent {}
