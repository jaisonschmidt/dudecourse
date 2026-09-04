import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import { YoutubeService } from '../../core/services/youtube.service';

interface YoutubePlayer {
  destroy(): void;
  getDuration(): number;
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YoutubePlayerComponent implements OnInit, OnDestroy {
  private readonly youtube = inject(YoutubeService);
  @ViewChild('player', { static: true }) playerElement!: ElementRef<HTMLElement>;
  @Input({ required: true }) videoId = '';
  @Input() trackingEnabled = false;
  @Output() watchedPercent = new EventEmitter<number>();
  private player?: YoutubePlayer;
  private timer?: ReturnType<typeof setInterval>;
  private baseline = 0;
  private watchedSeconds = 0;
  private lastTick = 0;
  private lastSentAt = 0;

  @Input() set baselinePercent(value: number) {
    this.baseline = Math.max(this.baseline, value || 0);
  }

  async ngOnInit(): Promise<void> {
    await this.youtube.load();
    const api = (window as unknown as { YT: YoutubeApi }).YT;
    this.player = new api.Player(this.playerElement.nativeElement, {
      videoId: this.videoId,
      playerVars: { rel: 0, modestbranding: 1 },
      events: { onStateChange: (event: { data: number }) => this.stateChanged(event.data) },
    });
  }

  ngOnDestroy(): void {
    this.flush();
    this.stop();
    this.player?.destroy();
  }

  private stateChanged(state: number): void {
    if (state === 1) this.start();
    if (state === 0 || state === 2) {
      this.tick();
      this.flush();
      this.stop();
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
