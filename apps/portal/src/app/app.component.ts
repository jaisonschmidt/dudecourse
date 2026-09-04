import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonDirective, FooterComponent, HeaderComponent, LogoComponent } from '@dudecourse/ui';
import { AuthService } from './core/services/auth.service';

@Component({
  standalone: true,
  imports: [RouterModule, ButtonDirective, FooterComponent, HeaderComponent, LogoComponent],
  selector: 'dc-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  readonly auth = inject(AuthService);
  readonly year = new Date().getFullYear();

  constructor() {
    this.auth.loadCurrentUser().subscribe();
  }

  logout(): void {
    this.auth.logout().subscribe();
  }
}
