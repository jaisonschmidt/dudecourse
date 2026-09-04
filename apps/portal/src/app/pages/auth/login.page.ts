import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonDirective, CardComponent, InputDirective } from '@dudecourse/ui';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'dc-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ButtonDirective, CardComponent, InputDirective],
  template: `
    <main class="auth-card">
      <dc-card>
        <p class="dc-eyebrow">Welcome back</p>
        <h1>Log in</h1>
        <p class="muted">Continue your learning journey.</p>
        <a class="dc-button dc-button--secondary google" [href]="googleUrl">Continue with Google</a>
        <div class="divider">or use email</div>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="field">
            <label for="email">Email</label
            ><input dcInput id="email" type="email" autocomplete="email" formControlName="email" />
            @if (form.controls.email.touched && form.controls.email.invalid) {
              <small>Enter a valid email.</small>
            }
          </div>
          <div class="field">
            <label for="password">Password</label
            ><input
              dcInput
              id="password"
              type="password"
              autocomplete="current-password"
              formControlName="password"
            />
            @if (form.controls.password.touched && form.controls.password.invalid) {
              <small>Password is required.</small>
            }
          </div>
          @if (error) {
            <p class="error-message" role="alert">{{ error }}</p>
          }
          <button dcButton type="submit" [disabled]="form.invalid || submitting">
            {{ submitting ? 'Logging in…' : 'Log in' }}
          </button>
        </form>
        <p class="switch">
          New here? <a routerLink="/register" [queryParams]="{ returnUrl }">Create an account</a>
        </p>
      </dc-card>
    </main>
  `,
  styles: [
    `
      .google {
        width: 100%;
        margin-top: 1rem;
      }
      .switch {
        text-align: center;
        margin: 1.5rem 0 0;
      }
      .switch a {
        color: var(--dc-color-primary);
        font-weight: 750;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/journey';
  readonly googleUrl = this.auth.googleLoginUrl(this.returnUrl);
  readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  submitting = false;
  error = '';

  submit(): void {
    if (this.form.invalid) return;
    this.submitting = true;
    this.error = '';
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => void this.router.navigateByUrl(this.returnUrl),
      error: (error) => {
        this.submitting = false;
        this.error = this.auth.errorMessage(error);
      },
    });
  }
}
