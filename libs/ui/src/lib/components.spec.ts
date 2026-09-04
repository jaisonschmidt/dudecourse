import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ProgressComponent, ToastComponent } from './components';

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

describe('ToastComponent', () => {
  let fixture: ComponentFixture<ToastComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ToastComponent] }).compileComponents();
    fixture = TestBed.createComponent(ToastComponent);
  });

  it('renders nothing when there is no message', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.dc-toast')).toBeNull();
  });

  it('shows the message with the success/error variant class', () => {
    fixture.componentInstance.message = 'Progress saved.';
    fixture.componentInstance.variant = 'error';
    fixture.detectChanges();
    const toast = fixture.nativeElement.querySelector('.dc-toast');
    expect(toast.textContent.trim()).toBe('Progress saved.');
    expect(toast.classList.contains('dc-toast--error')).toBe(true);
  });

  it('auto-dismisses after durationMs', fakeAsync(() => {
    const dismissed = jest.fn();
    fixture.componentInstance.dismissed.subscribe(dismissed);
    fixture.componentInstance.durationMs = 1000;
    fixture.componentInstance.message = 'Progress saved.';
    fixture.componentInstance.ngOnChanges({
      message: { currentValue: 'Progress saved.' } as never,
    });
    tick(1000);
    expect(dismissed).toHaveBeenCalledTimes(1);
  }));
});

