import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { YoutubeService } from '../../core/services/youtube.service';
import { YoutubePlayerComponent } from './youtube-player.component';

describe('YoutubePlayerComponent', () => {
  let fixture: ComponentFixture<YoutubePlayerComponent>;
  let stateChanged: (event: { data: number }) => void;
  const destroy = jest.fn();
  const loadVideoById = jest.fn();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [YoutubePlayerComponent],
      providers: [{ provide: YoutubeService, useValue: { load: () => Promise.resolve() } }],
    }).compileComponents();

    (window as unknown as { YT: unknown }).YT = {
      Player: jest.fn((_element, options: { events: { onStateChange: typeof stateChanged } }) => {
        stateChanged = options.events.onStateChange;
        return { destroy, getDuration: () => 100, loadVideoById };
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

  it('emits ended without flushing the imprecise watch-time estimate', fakeAsync(() => {
    const ended = jest.fn();
    const emitted: number[] = [];
    fixture.componentInstance.videoEnded.subscribe(ended);
    fixture.componentInstance.watchedPercent.subscribe((value) => emitted.push(value));

    stateChanged({ data: 1 });
    tick(1_000);
    stateChanged({ data: 0 });

    expect(ended).toHaveBeenCalledTimes(1);
    expect(emitted).toEqual([]);
  }));

  it('loads the new video and resets tracking when reused for the next lesson', fakeAsync(() => {
    // Simulate finishing the first lesson near 100%, reused by the same route/component instance.
    stateChanged({ data: 1 });
    tick(15_000);
    stateChanged({ data: 2 });

    const emitted: number[] = [];
    fixture.componentInstance.watchedPercent.subscribe((value) => emitted.push(value));

    fixture.componentRef.setInput('videoId', 'next-video-id');
    fixture.componentRef.setInput('baselinePercent', 0);
    fixture.detectChanges();

    expect(loadVideoById).toHaveBeenCalledWith('next-video-id');

    stateChanged({ data: 1 });
    tick(10_000);
    stateChanged({ data: 2 });

    // Should reflect only the new lesson's watch time, not the previous lesson's baseline.
    expect(emitted).toEqual([10]);
  }));
});
