/**
 * Haptic Feedback Engine (navigator.vibrate with graceful fallback)
 */
class HapticsService {
  constructor() {
    this.enabled = this._loadEnabled();
  }

  _loadEnabled() {
    try {
      const v = localStorage.getItem('spotinize_haptics');
      return v === null ? true : v === 'true';
    } catch {
      return true;
    }
  }

  isSupported() {
    return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
  }

  isEnabled() {
    return this.enabled;
  }

  setEnabled(val) {
    this.enabled = Boolean(val);
    try {
      localStorage.setItem('spotinize_haptics', String(this.enabled));
    } catch {}
  }

  _vibrate(pattern) {
    if (!this.enabled || !this.isSupported()) return;
    try {
      navigator.vibrate(pattern);
    } catch {}
  }

  tap() {
    this._vibrate(10);
  }

  cluePlay() {
    this._vibrate(12);
  }

  revealNext() {
    this._vibrate(16);
  }

  correct() {
    this._vibrate([20, 40, 35]);
  }

  wrong() {
    this._vibrate([35, 30, 35]);
  }

  buzz() {
    this._vibrate([25, 20, 45]);
  }

  victory() {
    this._vibrate([30, 40, 30, 40, 60]);
  }

  crateTap(step = 1) {
    this._vibrate(Math.min(45, 14 + step * 7));
  }

  crateReveal(rarity = 'COMMON') {
    const r = String(rarity || 'COMMON').toUpperCase();
    if (r === 'MYTHIC' || r === 'LEGENDARY') {
      this._vibrate([35, 40, 50, 40, 75]);
    } else if (r === 'EPIC') {
      this._vibrate([20, 30, 35]);
    } else {
      this._vibrate(18);
    }
  }

  reward() {
    this._vibrate([15, 30, 25]);
  }
}

export const haptics = new HapticsService();
export default haptics;
