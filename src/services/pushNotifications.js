/**
 * Browser / ServiceWorker Push Notification Manager
 */
class PushNotificationService {
  constructor() {
    this.registration = null;
    this.enabled = this._loadEnabled();
  }

  _loadEnabled() {
    try {
      const v = localStorage.getItem('spotinize_push');
      return v === null ? true : v === 'true';
    } catch {
      return true;
    }
  }

  isSupported() {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  getPermission() {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission; // 'default' | 'granted' | 'denied'
  }

  isEnabled() {
    return this.enabled && this.getPermission() === 'granted';
  }

  setEnabled(val) {
    this.enabled = Boolean(val);
    try {
      localStorage.setItem('spotinize_push', String(this.enabled));
    } catch {}
  }

  async registerWorker() {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;
    try {
      if (!this.registration) {
        this.registration = await navigator.serviceWorker.register('/sw.js');
      }
      return this.registration;
    } catch {
      return null;
    }
  }

  async requestPermission() {
    if (!this.isSupported()) return 'unsupported';
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.setEnabled(true);
        await this.registerWorker();
      } else {
        this.setEnabled(false);
      }
      return permission;
    } catch {
      return 'denied';
    }
  }

  async show({ title, body, tag = 'spotinize-notif', url = '/main', force = false }) {
    if (!this.isSupported()) return false;
    if (Notification.permission !== 'granted') return false;
    if (!this.enabled && !force) return false;

    try {
      const reg = await this.registerWorker();
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title || 'Spotinize', {
          body: body || '',
          tag,
          renotify: true,
          data: { url }
        });
        return true;
      }

      const n = new Notification(title || 'Spotinize', {
        body: body || '',
        tag
      });
      n.onclick = () => {
        try {
          window.focus();
        } catch {}
        n.close();
      };
      return true;
    } catch {
      return false;
    }
  }
}

export const pushNotifications = new PushNotificationService();
export default pushNotifications;
