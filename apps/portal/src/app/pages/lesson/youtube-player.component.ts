import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { YoutubeService } from '../../core/services/youtube.service';

interface YoutubePlayer {
  destroy(): void;
  getDuration(): number;
  loadVideoById(videoId: string): void;
}
interface YoutubeApi {
  Player: new (element: HTMLElement, options: Record<string, unknown>) => YoutubePlayer;
}

@Component({
  selector: 'dc-youtube-player',
  standalone: true,
  template: `<div class="player-shell"><div #player></div></div>`,
  styles: [
    `
      .player-shell {
        position: relative;
        overflow: hidden;
        width: 100%;
        aspect-ratio: 16/9;
        border-radius: 1.25rem;
        background: #0b1724;
        box-shadow: var(--dc-shadow-lg);
      }
      .player-shell > div,
      .player-shell iframe {
        width: 100%;
        height: 100%;
      }
    `,
  ],
  // Emulated encapsulation would not reach the <iframe> the YouTube API injects outside Angular's control.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YoutubePlayerComponent implements OnInit, OnChanges, OnDestroy {
  private readonly youtube = inject(YoutubeService);
  @ViewChild('player', { static: true }) playerElement!: ElementRef<HTMLElement>;
  @Input({ required: true }) videoId = '';
  @Input() trackingEnabled = false;
  @Input() baselinePercent = 0;
  @Output() watchedPercent = new EventEmitter<number>();
  @Output() videoEnded = new EventEmitter<void>();
  private player?: YoutubePlayer;
  private timer?: ReturnType<typeof setInterval>;
  private baseline = 0;
  private watchedSeconds = 0;
  private lastTick = 0;
  private lastSentAt = 0;
  // Tracks which video the player was actually told to load, since this component instance is
  // reused across lesson navigations (same route, only the lessonId param changes).
  private loadedVideoId = '';

  async ngOnInit(): Promise<void> {
    await this.youtube.load();
    const api = (window as unknown as { YT: YoutubeApi }).YT;
    this.baseline = this.baselinePercent || 0;
    this.loadedVideoId = this.videoId;
    this.player = new api.Player(this.playerElement.nativeElement, {
      videoId: this.videoId,
      // Required for the postMessage handshake with the iframe API; without it onStateChange never fires.
      playerVars: { rel: 0, modestbranding: 1, origin: window.location.origin },
      events: { onStateChange: (event: { data: number }) => this.stateChanged(event.data) },
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Skip the initial binding: ngOnInit (not yet run when this first fires) handles first load.
    if (!this.player || !changes['videoId'] || this.videoId === this.loadedVideoId) return;
    this.stop();
    this.watchedSeconds = 0;
    this.baseline = this.baselinePercent || 0;
    this.loadedVideoId = this.videoId;
    this.player.loadVideoById(this.videoId);
  }

  ngOnDestroy(): void {
    this.flush();
    this.stop();
    this.player?.destroy();
  }

  private stateChanged(state: number): void {
    if (state === 1) this.start();
    if (state === 2) {
      this.tick();
      this.flush();
      this.stop();
    }
    if (state === 0) {
      // Reaching the end is the reliable completion signal; the accumulated estimate can undercount.
      this.stop();
      this.videoEnded.emit();
    }
  }

  private start(): void {
    if (!this.trackingEnabled || this.timer) return;
    this.lastTick = Date.now();
    this.lastSentAt = this.lastTick;
    this.timer = setInterval(() => {
      this.tick();
      if (Date.now() - this.lastSentAt >= 15_000) this.flush();
    }, 1_000);
  }

  private tick(): void {
    if (!this.timer) return;
    const now = Date.now();
    this.watchedSeconds += Math.min(1.5, Math.max(0, (now - this.lastTick) / 1000));
    this.lastTick = now;
  }

  private flush(): void {
    if (!this.trackingEnabled || !this.player || this.watchedSeconds <= 0) return;
    const duration = this.player.getDuration();
    if (!duration) return;
    const next = Math.min(100, Math.floor(this.baseline + (this.watchedSeconds / duration) * 100));
    if (next > this.baseline) {
      this.baseline = next;
      this.watchedPercent.emit(next);
    }
    this.watchedSeconds = 0;
    this.lastSentAt = Date.now();
  }

  private stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }
}
