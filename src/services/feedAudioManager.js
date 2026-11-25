/**
 * Single Global Audio Manager for Feed previews, Global Trends, Search, and Profile tracks.
 * Guarantees only ONE preview track plays across the entire app at any time.
 */
class FeedAudioManager {
  constructor() {
    this.audio = null;
    this.currentKey = null;
    this.isPlaying = false;
    this.isLoading = false;
    this.listeners = new Set();
    this.volume = this._loadVolume();
    this.muted = this._loadMuted();
  }

  _loadVolume() {
    try {
      const v = parseFloat(localStorage.getItem('spotinize_volume'));
      if (!Number.isNaN(v) && v >= 0 && v <= 1) return v;
    } catch (e) {}
    return 0.85;
  }

  _loadMuted() {
    try {
      return localStorage.getItem('spotinize_muted') === 'true';
    } catch (e) {}
    return false;
  }

  setVolume(val) {
    const clamped = Math.max(0, Math.min(1, Number(val)));
    this.volume = clamped;
    if (clamped > 0) this.muted = false;
    if (this.audio) {
      this.audio.volume = this.muted ? 0 : this.volume;
    }
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
    if (this.audio) {
      this.audio.volume = this.muted ? 0 : this.volume;
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  getState() {
    return {
      currentKey: this.currentKey,
      isPlaying: this.isPlaying,
      isLoading: this.isLoading
    };
  }

  _emit() {
    const state = this.getState();
    for (const fn of this.listeners) {
      try {
        fn(state);
      } catch (e) {}
    }
  }

  stop() {
    if (this.audio) {
      try {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.audio.src = '';
      } catch (e) {}
      this.audio = null;
    }
    this.currentKey = null;
    this.isPlaying = false;
    this.isLoading = false;
    this._emit();
  }

  /**
   * Toggle play/pause for a given track key + url.
   * Supports direct previewUrl, internal /api/audio/clue/:trackId, or /api/spotify/track-detail lookup.
   */
  async toggle({ key, previewUrl, trackId, title, artist, spotifyId, duration = 10 }) {
    if (!key) return;

    // Clicking the currently playing track pauses/stops it
    if (this.currentKey === key && (this.isPlaying || this.isLoading)) {
      this.stop();
      return;
    }

    let src = previewUrl || (trackId ? `/api/audio/clue/${encodeURIComponent(trackId)}?duration=${duration}` : null);

    if (!src && (title || spotifyId)) {
      this.stop();
      this.currentKey = key;
      this.isLoading = true;
      this.isPlaying = false;
      this._emit();
      try {
        const params = new URLSearchParams();
        if (spotifyId) params.set('spotifyId', spotifyId);
        if (title) params.set('title', title);
        if (artist) params.set('artist', artist);
        const resp = await fetch(`/api/spotify/track-detail?${params.toString()}`);
        const json = await resp.json().catch(() => null);
        if (this.currentKey !== key) return;
        src = json?.track?.previewUrl || null;
      } catch (_) {
        src = null;
      }
      if (!src) {
        this.stop();
        return;
      }
    }

    if (!src) return;

    if (this.currentKey !== key) {
      this.stop();
      this.currentKey = key;
      this.isLoading = true;
      this.isPlaying = false;
      this._emit();
    }

    const audio = new Audio(src);
    audio.preload = 'auto';
    audio.volume = this.muted ? 0 : this.volume;
    this.audio = audio;

    audio.addEventListener('playing', () => {
      if (this.audio !== audio) return;
      this.isLoading = false;
      this.isPlaying = true;
      this._emit();
    });

    audio.addEventListener('ended', () => {
      if (this.audio !== audio) return;
      this.stop();
    });

    audio.addEventListener('error', () => {
      if (this.audio !== audio) return;
      // If direct previewUrl failed and we have a trackId, fallback to Spotinize audio clue endpoint
      if (previewUrl && trackId && audio.src !== `/api/audio/clue/${encodeURIComponent(trackId)}?duration=${duration}`) {
        this.toggle({ key, previewUrl: null, trackId, duration });
        return;
      }
      this.stop();
    });

    try {
      await audio.play();
    } catch (err) {
      if (this.audio === audio) {
        this.stop();
      }
    }
  }
}

export const feedAudioManager = new FeedAudioManager();
export default feedAudioManager;
