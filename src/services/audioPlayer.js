class AudioCluePlayer {
  constructor() {
    this.audio = null;
    this.stopTimeout = null;
    this.isPlaying = false;
    this.onStateChange = null;
    this.blobCache = new Map();
    this.loadingPromises = new Map();
  }

  stop() {
    if (this.audio) {
      try {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.audio.src = '';
        this.audio.load(); // Release mobile audio resources
      } catch (e) {}
      this.audio = null;
    }
    if (this.stopTimeout) {
      clearTimeout(this.stopTimeout);
      this.stopTimeout = null;
    }
    this.isPlaying = false;
    if (this.onStateChange) this.onStateChange(false);
  }

  /**
   * Preload an audio clue URL into memory as an object URL for 0ms instant playback
   */
  async preload(url) {
    if (!url) return null;
    if (this.blobCache.has(url)) return this.blobCache.get(url);
    if (this.loadingPromises.has(url)) return this.loadingPromises.get(url);

    const promise = (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        this.blobCache.set(url, objectUrl);
        return objectUrl;
      } catch (err) {
        console.warn('Audio preload fallback for:', url, err.message);
        return url;
      } finally {
        this.loadingPromises.delete(url);
      }
    })();

    this.loadingPromises.set(url, promise);
    return promise;
  }

  /**
   * Returns true if the audio URL is already preloaded and ready in memory
   */
  isReady(url) {
    return Boolean(url && this.blobCache.has(url));
  }

  /**
   * Plays clue from audio URL with exact duration cut
   */
  async playClue(audioUrl, durationSeconds, onEnd = null) {
    this.stop();
    if (!audioUrl) {
      if (onEnd) onEnd();
      return;
    }

    const playableUrl = await this.preload(audioUrl);

    this.isPlaying = true;
    if (this.onStateChange) this.onStateChange(true);

    try {
      this.audio = new Audio(playableUrl || audioUrl);
      // Mobile: set attributes for inline playback
      this.audio.setAttribute('playsinline', '');
      this.audio.setAttribute('webkit-playsinline', '');
      this.audio.preload = 'auto';
      this.audio.currentTime = 0;

      this.audio.addEventListener('ended', () => {
        this.stop();
        if (onEnd) onEnd();
      }, { once: true });

      // Mobile browsers may reject play() - handle gracefully
      const playPromise = this.audio.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch((err) => {
          console.warn('Audio play rejected (mobile restriction):', err.message);
          // Retry once on user gesture context
          this.stop();
          if (onEnd) onEnd();
        });
      }

      // Ensure exact cutoff at durationSeconds
      this.stopTimeout = setTimeout(() => {
        this.stop();
        if (onEnd) onEnd();
      }, durationSeconds * 1000);

    } catch (err) {
      console.warn('Audio playback error:', err.message);
      this.stop();
      if (onEnd) onEnd();
    }
  }

  /**
   * Clean up blob URLs to free memory (call when leaving game)
   */
  cleanup() {
    this.stop();
    for (const [, objectUrl] of this.blobCache) {
      try { URL.revokeObjectURL(objectUrl); } catch (e) {}
    }
    this.blobCache.clear();
    this.loadingPromises.clear();
  }
}

export const audioPlayer = new AudioCluePlayer();
export default audioPlayer;
