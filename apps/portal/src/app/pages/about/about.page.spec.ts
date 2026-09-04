import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AboutPageComponent } from './about.page';

describe('AboutPageComponent', () => {
  it('explains the portal and links to the course catalog', async () => {
    await TestBed.configureTestingModule({
      imports: [AboutPageComponent, RouterTestingModule],
    }).compileComponents();

    const fixture = TestBed.createComponent(AboutPageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Dude Course is a free learning portal');
    expect(fixture.nativeElement.textContent).toContain('Browse');
    expect(fixture.nativeElement.textContent).toContain('Enroll');
    expect(fixture.nativeElement.textContent).toContain('Complete');
    expect(fixture.nativeElement.querySelector('a[routerlink="/"]').getAttribute('href')).toBe('/');
  });
});