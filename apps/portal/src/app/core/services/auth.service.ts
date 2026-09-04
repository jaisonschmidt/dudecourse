import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import {
  ApiErrorDto,
  LoginRequestDto,
  RegisterRequestDto,
  UserDto,
} from '@dudecourse/shared/domain';
import { Observable, catchError, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly currentUser = signal<UserDto | null>(null);
  private readonly initialized = signal(false);

  readonly user = this.currentUser.asReadonly();
  readonly ready = this.initialized.asReadonly();
  readonly isAuthenticated = computed(() => Boolean(this.currentUser()));

  loadCurrentUser(): Observable<UserDto | null> {
    if (this.initialized()) return of(this.currentUser());
    return this.http.get<UserDto>(`${environment.apiUrl}/auth/me`).pipe(
      tap((user) => {
        this.currentUser.set(user);
        this.initialized.set(true);
      }),
      catchError(() => {
        this.currentUser.set(null);
        this.initialized.set(true);
        return of(null);
      })
    );
  }

  login(request: LoginRequestDto): Observable<UserDto> {
    return this.http.post<UserDto>(`${environment.apiUrl}/auth/login`, request).pipe(
      tap((user) => {
        this.currentUser.set(user);
        this.initialized.set(true);
      })
    );
  }

  register(request: RegisterRequestDto): Observable<UserDto> {
    return this.http.post<UserDto>(`${environment.apiUrl}/auth/register`, request).pipe(
      tap((user) => {
        this.currentUser.set(user);
        this.initialized.set(true);
      })
    );
  }

  logout(): Observable<void> {
    return this.http
      .post<void>(`${environment.apiUrl}/auth/logout`, {})
      .pipe(tap(() => this.currentUser.set(null)));
  }

  googleLoginUrl(returnUrl = '/journey'): string {
    sessionStorage.setItem('dc_return_url', returnUrl);
    return `${environment.apiUrl}/auth/google`;
  }

  errorMessage(error: unknown): string {
    const response = error as { error?: ApiErrorDto };
    return response.error?.message ?? 'Something went wrong. Please try again.';
  }
}
