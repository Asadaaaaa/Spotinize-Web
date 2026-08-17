import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(window.location.origin, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        // Mobile-friendly: allow polling fallback if websocket drops
        upgrade: true,
      });

      this.socket.on('connect', () => {
        console.log('[Socket] Connected:', this.socket.id);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[Socket] Disconnected:', reason);
        // If the server disconnected us, reconnect manually
        if (reason === 'io server disconnect') {
          this.socket.connect();
        }
      });

      this.socket.on('reconnect', (attemptNumber) => {
        console.log(`[Socket] Reconnected after ${attemptNumber} attempts`);
      });

      this.socket.on('reconnect_error', (err) => {
        console.warn('[Socket] Reconnect error:', err.message);
      });

      // Handle mobile visibility changes - reconnect when app returns to foreground
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible' && this.socket && !this.socket.connected) {
            console.log('[Socket] Page visible again, forcing reconnect...');
            this.socket.connect();
          }
        });
      }
    }
    return this.socket;
  }

  getSocket() {
    if (!this.socket) {
      return this.connect();
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
export default socketService;
