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
        <h1>A simpler way to keep learning.</h1>
        <p>
          Dude Course is a free learning portal for focused courses hosted on YouTube. Find a
          course, learn at your own pace, and keep your progress in one place.
        </p>
      </header>

      <section class="about-content" aria-labelledby="what-is-title">
        <div class="section-intro">
          <p class="dc-eyebrow">What is Dude Course?</p>
          <h2 id="what-is-title">Learning that fits into real life.</h2>
          <p>
            We bring useful video lessons together in clear, focused courses. You can explore the
            catalog freely, then create an account when you are ready to save your place and make
            steady progress.
          </p>
        </div>

        <div class="journey-heading">
          <div>
            <p class="dc-eyebrow">The learning journey</p>
            <h2 id="how-it-works-title">How it works</h2>
          </div>
          <p>Five simple steps from curious to complete.</p>
        </div>
        <ol aria-labelledby="how-it-works-title">
          <li><strong>Browse</strong><span>Explore the available courses and find a skill that interests you.</span></li>
          <li><strong>Choose</strong><span>Open a course to see its description and ordered lesson list.</span></li>
          <li><strong>Enroll</strong><span>Create an account and subscribe when you are ready to begin.</span></li>
          <li><strong>Learn</strong><span>Watch the YouTube lessons while Dude Course tracks your progress.</span></li>
          <li><strong>Complete</strong><span>Finish a course and receive a downloadable certificate.</span></li>
        </ol>

        <a dcButton routerLink="/" class="cta">Explore courses <span aria-hidden="true">→</span></a>
      </section>
    </main>
  `,
  styles: [
    `
      .about-content {
        max-width: 58rem;
      }

      .section-intro {
        max-width: 42rem;
        padding: 2rem 0 3rem;
        border-top: 1px solid var(--dc-color-border);
        border-bottom: 1px solid var(--dc-color-border);
      }

      .about-content h2 {
        margin-bottom: 0.75rem;
        font-size: clamp(1.8rem, 3vw, 2.6rem);
      }

      .section-intro p:last-child,
      .journey-heading > p,
      ol {
        color: var(--dc-color-muted);
        line-height: 1.7;
      }

      .journey-heading {
        display: flex;
        justify-content: space-between;
        align-items: end;
        gap: 2rem;
        padding: 3rem 0 1.25rem;
      }

      .journey-heading h2 {
        margin: 0.25rem 0 0;
      }

      .journey-heading > p {
        max-width: 14rem;
        margin: 0;
      }

      ol {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 0.75rem;
        margin: 0 0 2rem;
        padding: 0;
        list-style: none;
      }

      li {
        min-height: 10rem;
        padding: 1rem;
        border-top: 3px solid var(--dc-color-primary);
        background: var(--dc-color-surface);
      }

      li strong,
      li span {
        display: block;
      }

      li strong {
        margin-bottom: 0.6rem;
        color: var(--dc-color-text);
        font-size: 1.05rem;
      }

      li span {
        font-size: 0.92rem;
      }

      .cta {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
      }

      @media (max-width: 52rem) {
        ol {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
      }

      @media (max-width: 40rem) {
        .journey-heading {
          align-items: start;
          flex-direction: column;
          gap: 0.5rem;
        }

        .journey-heading > p {
          max-width: none;
        }

        ol {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 30rem) {
        ol {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutPageComponent {}
