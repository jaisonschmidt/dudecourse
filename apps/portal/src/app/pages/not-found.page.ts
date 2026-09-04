import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective, StatePanelComponent } from '@dudecourse/ui';

@Component({
  selector: 'dc-not-found-page',
  standalone: true,
  imports: [RouterLink, ButtonDirective, StatePanelComponent],
  template: `<main class="page">
    <dc-state-panel
      ><p class="dc-eyebrow">404</p>
      <h1>This page took a study break.</h1>
      <p>Let’s get you back to the courses.</p>
      <a dcButton routerLink="/">Go home</a></dc-state-panel
    >
  </main>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPageComponent {}
