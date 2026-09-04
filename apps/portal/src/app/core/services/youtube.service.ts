import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class YoutubeService {
  private readonly document = inject(DOCUMENT);
  private loading?: Promise<void>;

  load(): Promise<void> {
    const scope = window as unknown as { YT?: unknown; onYouTubeIframeAPIReady?: () => void };
    if (scope.YT) return Promise.resolve();
    if (this.loading) return this.loading;
    this.loading = new Promise<void>((resolve) => {
      const previous = scope.onYouTubeIframeAPIReady;
      scope.onYouTubeIframeAPIReady = () => {
        previous?.();
        resolve();
      };
      const script = this.document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      this.document.head.appendChild(script);
    });
    return this.loading;
  }
}
