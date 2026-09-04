import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonDirective, StatePanelComponent } from '@dudecourse/ui';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'dc-auth-callback-page',
  standalone: true,
  imports: [RouterLink, ButtonDirective, StatePanelComponent],
  template: `<main class="page">
    <dc-state-panel>
      @if (error) {
        <h1>Google sign-in failed</h1>
        <p>Please try again.</p>
        <a dcButton routerLink="/login">Back to login</a>
      } @else {
        <h1>Signing you in…</h1>
        <p>One moment while we prepare your journey.</p>
      }
    </dc-state-panel>
  </main>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthCallbackPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly error = inject(ActivatedRoute).snapshot.queryParamMap.has('error');

  constructor() {
    if (!this.error) {
      this.auth.loadCurrentUser().subscribe((user) => {
        const target = sessionStorage.getItem('dc_return_url') ?? '/journey';
        sessionStorage.removeItem('dc_return_url');
        void this.router.navigateByUrl(user ? target : '/login');
      });
    }
  }
}
