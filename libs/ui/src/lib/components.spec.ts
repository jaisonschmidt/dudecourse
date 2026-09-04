import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProgressComponent } from './components';

describe('ProgressComponent', () => {
  let fixture: ComponentFixture<ProgressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ProgressComponent] }).compileComponents();
    fixture = TestBed.createComponent(ProgressComponent);
  });

  it('clamps its accessible value', () => {
    fixture.componentInstance.value = 130;
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[role="progressbar"]').getAttribute('aria-valuenow')
    ).toBe('100');
  });
});
