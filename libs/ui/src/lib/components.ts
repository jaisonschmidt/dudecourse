import { ChangeDetectionStrategy, Component, Directive, HostBinding, Input } from '@angular/core';

@Directive({
  selector: 'button[dcButton], a[dcButton]',
  standalone: true,
})
export class ButtonDirective {
  @Input() variant: 'primary' | 'secondary' | 'ghost' = 'primary';
  @HostBinding('class.dc-button') readonly baseClass = true;
  @HostBinding('class.dc-button--secondary') get secondary(): boolean {
    return this.variant === 'secondary';
  }
  @HostBinding('class.dc-button--ghost') get ghost(): boolean {
    return this.variant === 'ghost';
  }
}

@Directive({ selector: 'a[dcLink]', standalone: true })
export class LinkDirective {
  @HostBinding('class.dc-link') readonly baseClass = true;
}

@Directive({ selector: 'input[dcInput]', standalone: true })
export class InputDirective {
  @HostBinding('class.dc-input') readonly baseClass = true;
}

@Component({
  selector: 'dc-logo',
  standalone: true,
  template: `
    <span class="dc-logo__mark" aria-hidden="true">
      <svg viewBox="0 0 52 52" role="img">
        <path d="M7 5h17c13 0 22 8 22 21S37 47 24 47H7V5Z" fill="currentColor" />
        <path d="m21 17 14 9-14 9V17Z" fill="#fff8ed" />
        <circle cx="43" cy="9" r="5" fill="#f97360" />
      </svg>
    </span>
    @if (!compact) {
      <span class="dc-logo__text">Dude Course</span>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoComponent {
  @Input() compact = false;
}

@Component({
  selector: 'dc-header',
  standalone: true,
  template: `<header class="dc-header">
    <div class="dc-shell dc-header__inner"><ng-content /></div>
  </header>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {}

@Component({
  selector: 'dc-footer',
  standalone: true,
  template: `<footer class="dc-footer">
    <div class="dc-shell"><ng-content /></div>
  </footer>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {}

@Component({
  selector: 'dc-hero',
  standalone: true,
  template: `
    <section class="dc-hero">
      <div class="dc-hero__content">
        @if (eyebrow) {
          <p class="dc-eyebrow">{{ eyebrow }}</p>
        }
        <h1>{{ title }}</h1>
        <p class="dc-hero__description">{{ description }}</p>
        <div class="dc-hero__actions"><ng-content /></div>
      </div>
      <div class="dc-hero__art" aria-hidden="true"><span>▶</span><i></i><b>90%</b></div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroComponent {
  @Input() eyebrow = '';
  @Input({ required: true }) title = '';
  @Input({ required: true }) description = '';
}

@Component({
  selector: 'dc-card',
  standalone: true,
  template: `<article class="dc-card"><ng-content /></article>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {}

@Component({
  selector: 'dc-progress',
  standalone: true,
  template: `
    <div class="dc-progress__labels">
      <span>{{ label }}</span
      ><strong>{{ safeValue }}%</strong>
    </div>
    <div
      class="dc-progress__track"
      role="progressbar"
      [attr.aria-label]="label"
      aria-valuemin="0"
      aria-valuemax="100"
      [attr.aria-valuenow]="safeValue"
    >
      <span [style.width.%]="safeValue"></span>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressComponent {
  @Input() value = 0;
  @Input() label = 'Progress';

  get safeValue(): number {
    return Math.min(100, Math.max(0, Math.round(this.value)));
  }
}

@Component({
  selector: 'dc-badge',
  standalone: true,
  template: `<span class="dc-badge" [class.dc-badge--complete]="variant === 'complete'"
    ><ng-content
  /></span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeComponent {
  @Input() variant: 'default' | 'complete' = 'default';
}

@Component({
  selector: 'dc-state-panel',
  standalone: true,
  template: `<section class="dc-state-panel"><ng-content /></section>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatePanelComponent {}
