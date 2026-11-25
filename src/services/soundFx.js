/**
 * Modern Clean Synth Sound Effects Engine (Web Audio API, zero external assets, 0ms latency)
 */
class SoundFxService {
  constructor() {
    this.ctx = null;
    this.enabled = this._loadEnabled();
  }

  _loadEnabled() {
    try {
      const v = localStorage.getItem('spotinize_sfx');
      return v === null ? true : v === 'true';
    } catch {
      return true;
    }
  }

  isEnabled() {
    return this.enabled;
  }

  setEnabled(val) {
    this.enabled = Boolean(val);
    try {
      localStorage.setItem('spotinize_sfx', String(this.enabled));
    } catch {}
  }

  _getMasterVolume() {
    try {
      if (localStorage.getItem('spotinize_muted') === 'true') return 0;
      const v = parseFloat(localStorage.getItem('spotinize_volume'));
      if (!Number.isNaN(v) && v >= 0 && v <= 1) return v;
    } catch {}
    return 0.85;
  }

  _ensureContext() {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  _playTone({ freq = 440, endFreq = null, duration = 0.12, delay = 0, gain = 0.14, type = 'sine' }) {
    if (!this.enabled) return;
    const vol = this._getMasterVolume();
    if (vol <= 0) return;

    const ctx = this._ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq && endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    }

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3600, now);

    const peak = Math.max(0.001, gain * vol);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(peak, now + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(filter);
    filter.connect(g);
    g.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playTap() {
    this._playTone({ freq: 620, endFreq: 740, duration: 0.045, gain: 0.06, type: 'sine' });
  }

  playRevealNext() {
    this._playTone({ freq: 440, endFreq: 660, duration: 0.09, gain: 0.1, type: 'triangle' });
  }

  playCorrect(isSniper = false) {
    // Clean major triad arpeggio (C5 -> E5 -> G5, + C6 for 0.1s Sniper)
    this._playTone({ freq: 523.25, duration: 0.14, delay: 0, gain: 0.13, type: 'triangle' });
    this._playTone({ freq: 659.25, duration: 0.14, delay: 0.06, gain: 0.13, type: 'triangle' });
    this._playTone({ freq: 783.99, duration: 0.22, delay: 0.12, gain: 0.15, type: 'sine' });
    if (isSniper) {
      this._playTone({ freq: 1046.5, duration: 0.3, delay: 0.18, gain: 0.16, type: 'sine' });
    }
  }

  playWrong() {
    this._playTone({ freq: 220, endFreq: 146.83, duration: 0.16, gain: 0.13, type: 'triangle' });
  }

  playSkip() {
    this._playTone({ freq: 392, duration: 0.09, delay: 0, gain: 0.09, type: 'sine' });
    this._playTone({ freq: 329.63, duration: 0.14, delay: 0.07, gain: 0.09, type: 'sine' });
  }

  playBuzz() {
    this._playTone({ freq: 587.33, endFreq: 880, duration: 0.09, gain: 0.16, type: 'triangle' });
  }

  playVictory() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this._playTone({ freq: n, duration: idx === 3 ? 0.36 : 0.14, delay: idx * 0.08, gain: 0.14, type: 'triangle' });
    });
  }

  playCrateTap(step = 1) {
    const base = 240 + Math.min(8, step) * 48;
    this._playTone({ freq: base, endFreq: base * 1.28, duration: 0.075, gain: 0.14, type: 'triangle' });
  }

  playCrateBurst() {
    this._playTone({ freq: 330, endFreq: 880, duration: 0.16, gain: 0.15, type: 'sine' });
  }

  playCrateReveal(rarity = 'COMMON') {
    const r = String(rarity || 'COMMON').toUpperCase();
    if (r === 'MYTHIC' || r === 'LEGENDARY') {
      [523.25, 659.25, 783.99, 987.77, 1046.5].forEach((n, idx) => {
        this._playTone({ freq: n, duration: 0.38, delay: idx * 0.065, gain: 0.15, type: 'triangle' });
      });
    } else if (r === 'EPIC') {
      [440, 554.37, 659.25].forEach((n, idx) => {
        this._playTone({ freq: n, duration: 0.24, delay: idx * 0.07, gain: 0.13, type: 'triangle' });
      });
    } else {
      this._playTone({ freq: 523.25, duration: 0.14, delay: 0, gain: 0.11, type: 'sine' });
      this._playTone({ freq: 659.25, duration: 0.2, delay: 0.07, gain: 0.11, type: 'sine' });
    }
  }

  playReward() {
    this._playTone({ freq: 880, duration: 0.1, delay: 0, gain: 0.11, type: 'sine' });
    this._playTone({ freq: 1318.5, duration: 0.22, delay: 0.07, gain: 0.13, type: 'sine' });
  }

  playNotif() {
    this._playTone({ freq: 659.25, duration: 0.1, delay: 0, gain: 0.1, type: 'sine' });
    this._playTone({ freq: 987.77, duration: 0.18, delay: 0.07, gain: 0.1, type: 'sine' });
  }
}

export const soundFx = new SoundFxService();
export default soundFx;
