import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { YoutubeService } from '../../core/services/youtube.service';
import { YoutubePlayerComponent } from './youtube-player.component';

describe('YoutubePlayerComponent', () => {
  let fixture: ComponentFixture<YoutubePlayerComponent>;
  let stateChanged: (event: { data: number }) => void;
  const destroy = jest.fn();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [YoutubePlayerComponent],
      providers: [{ provide: YoutubeService, useValue: { load: () => Promise.resolve() } }],
    }).compileComponents();

    (window as unknown as { YT: unknown }).YT = {
      Player: jest.fn((_element, options: { events: { onStateChange: typeof stateChanged } }) => {
        stateChanged = options.events.onStateChange;
        return { destroy, getDuration: () => 100 };
      }),
    };
    fixture = TestBed.createComponent(YoutubePlayerComponent);
    fixture.componentRef.setInput('videoId', 'video-id');
    fixture.componentRef.setInput('trackingEnabled', true);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    fixture.destroy();
    jest.clearAllMocks();
  });

  it('counts real PLAYING time and flushes it on pause', fakeAsync(() => {
    const emitted: number[] = [];
    fixture.componentInstance.watchedPercent.subscribe((value) => emitted.push(value));

    stateChanged({ data: 1 });
    tick(10_000);
    stateChanged({ data: 2 });

    expect(emitted).toEqual([10]);
  }));

  it('does not track playback for a guest', fakeAsync(() => {
    fixture.componentRef.setInput('trackingEnabled', false);
    const emitted: number[] = [];
    fixture.componentInstance.watchedPercent.subscribe((value) => emitted.push(value));

    stateChanged({ data: 1 });
    tick(16_000);
    stateChanged({ data: 2 });

    expect(emitted).toEqual([]);
  }));
});
