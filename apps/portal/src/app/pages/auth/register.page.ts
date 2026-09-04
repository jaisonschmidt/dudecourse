import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonDirective, CardComponent, InputDirective } from '@dudecourse/ui';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'dc-register-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ButtonDirective, CardComponent, InputDirective],
  template: `
    <main class="auth-card">
      <dc-card>
        <p class="dc-eyebrow">Start for free</p>
        <h1>Create account</h1>
        <p class="muted">Save progress and earn course certificates.</p>
        <a class="dc-button dc-button--secondary google" [href]="googleUrl">Continue with Google</a>
        <div class="divider">or use email</div>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="field">
            <label for="displayName">Your name</label
            ><input dcInput id="displayName" autocomplete="name" formControlName="displayName" />
            @if (form.controls.displayName.touched && form.controls.displayName.invalid) {
              <small>Use between 2 and 80 characters.</small>
            }
          </div>
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
              autocomplete="new-password"
              formControlName="password"
            /><span class="muted">Use at least 8 characters.</span>
          </div>
          @if (error) {
            <p class="error-message" role="alert">{{ error }}</p>
          }
          <button dcButton type="submit" [disabled]="form.invalid || submitting">
            {{ submitting ? 'Creating account…' : 'Create account' }}
          </button>
        </form>
        <p class="switch">
          Already a member? <a routerLink="/login" [queryParams]="{ returnUrl }">Log in</a>
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
export class RegisterPageComponent {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/journey';
  readonly googleUrl = this.auth.googleLoginUrl(this.returnUrl);
  readonly form = new FormGroup({
    displayName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(80)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8), Validators.maxLength(128)],
    }),
  });
  submitting = false;
  error = '';

  submit(): void {
    if (this.form.invalid) return;
    this.submitting = true;
    this.error = '';
    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => void this.router.navigateByUrl(this.returnUrl),
      error: (error) => {
        this.submitting = false;
        this.error = this.auth.errorMessage(error);
      },
    });
  }
}
