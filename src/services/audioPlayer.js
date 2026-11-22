class AudioCluePlayer {
  constructor() {
    this.audio = null;
    this.stopTimeout = null;
    this.isPlaying = false;
    this.onStateChange = null;

    // Web Audio API state & decoded buffers
    this.audioCtx = null;
    this.hasPrimedContext = false;
    this.activeSource = null;
    this.activeGain = null;
    this.lastAudioActivityAt = 0;
    this.currentPlayId = 0;

    this.arrayBufferCache = new Map();
    this.audioBufferCache = new Map();
    this.blobCache = new Map();
    this.loadingPromises = new Map();

    // Persisted volume & mute state
    let savedVol = 1.0;
    let savedMuted = false;
    try {
      const v = parseFloat(localStorage.getItem('spotinize_volume'));
      if (!Number.isNaN(v) && v >= 0 && v <= 1) savedVol = v;
      savedMuted = localStorage.getItem('spotinize_muted') === 'true';
    } catch (e) {}
    this.volume = savedVol;
    this.muted = savedMuted;
  }

  getVolume() {
    return this.volume;
  }

  isMuted() {
    return this.muted;
  }

  _getEffectiveVolume() {
    return this.muted ? 0 : this.volume;
  }

  setVolume(val) {
    const clamped = Math.max(0, Math.min(1, Number(val)));
    this.volume = clamped;
    if (clamped > 0 && this.muted) {
      this.muted = false;
      try { localStorage.setItem('spotinize_muted', 'false'); } catch (e) {}
    }
    try { localStorage.setItem('spotinize_volume', String(clamped)); } catch (e) {}
    this._applyLiveVolume();
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
    try { localStorage.setItem('spotinize_muted', String(this.muted)); } catch (e) {}
    this._applyLiveVolume();
  }

  _applyLiveVolume() {
    const eff = this._getEffectiveVolume();
    if (this.activeGain && this.audioCtx) {
      try {
        this.activeGain.gain.setValueAtTime(Math.max(0.0001, eff), this.audioCtx.currentTime);
      } catch (e) {}
    }
    if (this.audio) {
      try {
        this.audio.volume = eff;
      } catch (e) {}
    }
  }

  _getAudioContext() {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
    return this.audioCtx;
  }

  /**
   * Synchronously unlocks AudioContext inside a user gesture and primes the DAC output.
   */
  unlock() {
    try {
      const ctx = this._getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      if (!this.hasPrimedContext) {
        this.hasPrimedContext = true;
        const silentBuf = ctx.createBuffer(1, 1, ctx.sampleRate || 44100);
        const src = ctx.createBufferSource();
        src.buffer = silentBuf;
        src.connect(ctx.destination);
        src.start(0);
      }
    } catch (e) {}
  }

  stop() {
    this.currentPlayId++;

    if (this.activeSource) {
      try {
        this.activeSource.onended = null;
        this.activeSource.stop();
        this.activeSource.disconnect();
      } catch (e) {}
      this.activeSource = null;
    }

    if (this.activeGain) {
      try {
        this.activeGain.disconnect();
      } catch (e) {}
      this.activeGain = null;
    }

    if (this.audio) {
      try {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.audio.src = '';
        this.audio.load();
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
   * Preloads an audio clue URL into ArrayBuffer + pre-decoded AudioBuffer + Blob cache.
   */
  async preload(url) {
    if (!url) return false;
    if (this.audioBufferCache.has(url) || this.arrayBufferCache.has(url) || this.blobCache.has(url)) {
      return true;
    }
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url);
    }

    const promise = (async () => {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);

          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            throw new Error('Unexpected JSON response for audio clue');
          }

          const arrayBuffer = await res.arrayBuffer();
          if (!arrayBuffer || arrayBuffer.byteLength <= 300) {
            throw new Error('Audio payload too small or empty');
          }

          this.arrayBufferCache.set(url, arrayBuffer);
          const blob = new Blob([arrayBuffer], { type: contentType || 'audio/mpeg' });
          this.blobCache.set(url, URL.createObjectURL(blob));

          // Eagerly decode PCM buffer for 0ms instant Web Audio playback
          const ctx = this._getAudioContext();
          if (ctx) {
            try {
              const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
              if (decoded && decoded.duration > 0) {
                this.audioBufferCache.set(url, decoded);
              }
            } catch (decodeErr) {
              // Context may still be suspended prior to user gesture; arrayBufferCache will decode on click
            }
          }

          return true;
        } catch (err) {
          if (attempt === 0) {
            await new Promise(r => setTimeout(r, 300));
          } else {
            console.warn('Audio preload failed for:', url, err.message);
          }
        }
      }
      return false;
    })();

    this.loadingPromises.set(url, promise);
    try {
      return await promise;
    } finally {
      this.loadingPromises.delete(url);
    }
  }

  /**
   * Returns true if the audio URL is already preloaded in memory.
   */
  isReady(url) {
    return Boolean(
      url && (this.audioBufferCache.has(url) || this.arrayBufferCache.has(url) || this.blobCache.has(url))
    );
  }

  /**
   * Finds first audible sample within the first 120ms to skip MP3 encoder padding (~26ms).
   */
  _findAudibleStartSeconds(audioBuffer) {
    if (!audioBuffer || audioBuffer.duration <= 0.05) return 0;

    const sampleRate = audioBuffer.sampleRate || 44100;
    const maxScanSamples = Math.min(audioBuffer.length, Math.floor(sampleRate * 0.12));
    const channels = Math.min(audioBuffer.numberOfChannels || 1, 2);
    const channelData = [];
    for (let ch = 0; ch < channels; ch++) {
      channelData.push(audioBuffer.getChannelData(ch));
    }

    const threshold = 0.008; // ~ -42 dB
    for (let i = 0; i < maxScanSamples; i++) {
      for (let ch = 0; ch < channels; ch++) {
        if (Math.abs(channelData[ch][i]) >= threshold) {
          const detectedSec = i / sampleRate;
          const offset = Math.max(0, detectedSec - 0.002);
          if (audioBuffer.duration - offset >= 0.04) {
            return offset;
          }
          return 0;
        }
      }
    }

    return 0;
  }

  /**
   * Plays clue from audio URL using Web Audio API primary path + hardened HTMLAudio fallback.
   */
  async playClue(audioUrl, durationSeconds, onEnd = null) {
    this.unlock();
    this.stop();

    if (!audioUrl) {
      if (onEnd) onEnd();
      return;
    }

    const playId = this.currentPlayId;
    this.isPlaying = true;
    if (this.onStateChange) this.onStateChange(true);

    try {
      await this.preload(audioUrl);
      if (playId !== this.currentPlayId) return;

      // Primary Path: Web Audio API (zero HTMLAudio buffer lag, DAC warm-up for 0.1s)
      const ctx = this._getAudioContext();
      if (ctx) {
        const wasCold = ctx.state !== 'running' || (Date.now() - this.lastAudioActivityAt > 4000);
        if (ctx.state === 'suspended') {
          await ctx.resume();
          if (playId !== this.currentPlayId) return;
        }

        let audioBuffer = this.audioBufferCache.get(audioUrl);
        if (!audioBuffer && this.arrayBufferCache.has(audioUrl)) {
          try {
            audioBuffer = await ctx.decodeAudioData(this.arrayBufferCache.get(audioUrl).slice(0));
            if (playId !== this.currentPlayId) return;
            if (audioBuffer) {
              this.audioBufferCache.set(audioUrl, audioBuffer);
            }
          } catch (decodeErr) {
            console.warn('Web Audio decode fallback:', decodeErr.message);
          }
        }

        if (audioBuffer && audioBuffer.duration > 0) {
          // Wake cold OS/Bluetooth DAC with 60ms silent primer before scheduling short 0.1s clue
          let leadSec = 0.005;
          if (wasCold) {
            leadSec = 0.06;
            const primerSamples = Math.max(1, Math.round((ctx.sampleRate || 44100) * 0.06));
            const primerBuf = ctx.createBuffer(1, primerSamples, ctx.sampleRate || 44100);
            const primerSrc = ctx.createBufferSource();
            primerSrc.buffer = primerBuf;
            primerSrc.connect(ctx.destination);
            primerSrc.start(ctx.currentTime);
          }

          const startAt = ctx.currentTime + leadSec;
          const offsetSec = this._findAudibleStartSeconds(audioBuffer);
          const playDur = Math.max(0.05, Math.min(durationSeconds, audioBuffer.duration - offsetSec));

          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;

          const gainNode = ctx.createGain();
          const targetGain = Math.max(0.0001, this._getEffectiveVolume());
          gainNode.gain.setValueAtTime(0.0001, startAt);
          gainNode.gain.linearRampToValueAtTime(targetGain, startAt + 0.004);
          gainNode.gain.setValueAtTime(targetGain, startAt + Math.max(0.005, playDur - 0.012));
          gainNode.gain.linearRampToValueAtTime(0.0001, startAt + playDur);

          source.connect(gainNode);
          gainNode.connect(ctx.destination);

          this.activeSource = source;
          this.activeGain = gainNode;

          let finished = false;
          const finishPlayback = () => {
            if (finished) return;
            finished = true;
            if (this.stopTimeout) {
              clearTimeout(this.stopTimeout);
              this.stopTimeout = null;
            }
            if (playId !== this.currentPlayId) return;
            this.lastAudioActivityAt = Date.now();
            try { source.disconnect(); } catch (e) {}
            try { gainNode.disconnect(); } catch (e) {}
            if (this.activeSource === source) this.activeSource = null;
            if (this.activeGain === gainNode) this.activeGain = null;
            this.isPlaying = false;
            if (this.onStateChange) this.onStateChange(false);
            if (onEnd) onEnd();
          };

          source.onended = finishPlayback;
          source.start(startAt, offsetSec, playDur);

          // Generous safety timeout ONLY if backgrounded tab suppresses onended
          this.stopTimeout = setTimeout(() => {
            try { source.stop(); } catch (e) {}
            finishPlayback();
          }, Math.ceil((leadSec + playDur + 0.4) * 1000));

          return;
        }
      }

      // Fallback Path: Hardened HTMLAudioElement (cutoff timer only starts on 'playing')
      const playableUrl = this.blobCache.get(audioUrl) || audioUrl;
      this.audio = new Audio(playableUrl);
      this.audio.volume = this._getEffectiveVolume();
      this.audio.setAttribute('playsinline', '');
      this.audio.setAttribute('webkit-playsinline', '');
      this.audio.preload = 'auto';
      this.audio.currentTime = 0;

      const currentAudio = this.audio;
      currentAudio.addEventListener('playing', () => {
        if (playId !== this.currentPlayId) return;
        this.lastAudioActivityAt = Date.now();
        this.stopTimeout = setTimeout(() => {
          if (playId !== this.currentPlayId) return;
          this.stop();
          if (onEnd) onEnd();
        }, durationSeconds * 1000 + 80);
      }, { once: true });

      currentAudio.addEventListener('ended', () => {
        if (playId !== this.currentPlayId) return;
        this.lastAudioActivityAt = Date.now();
        this.stop();
        if (onEnd) onEnd();
      }, { once: true });

      const playPromise = currentAudio.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch((err) => {
          console.warn('Audio play rejected (mobile restriction):', err.message);
          if (playId !== this.currentPlayId) return;
          this.stop();
          if (onEnd) onEnd();
        });
      }
    } catch (err) {
      console.warn('Audio playback error:', err.message);
      if (playId === this.currentPlayId) {
        this.stop();
        if (onEnd) onEnd();
      }
    }
  }

  /**
   * Clean up cached audio buffers and blob URLs when leaving game (keeps AudioContext alive).
   */
  cleanup() {
    this.stop();
    for (const [, objectUrl] of this.blobCache) {
      try { URL.revokeObjectURL(objectUrl); } catch (e) {}
    }
    this.blobCache.clear();
    this.arrayBufferCache.clear();
    this.audioBufferCache.clear();
    this.loadingPromises.clear();
  }
}

export const audioPlayer = new AudioCluePlayer();
export default audioPlayer;
