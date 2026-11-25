const API_BASE = '/api';
const DEFAULT_GET_TTL_MS = 120000;

export class ApiClient {
  static _getCache = new Map();
  static _inFlightGets = new Map();

  static _getCurrentUserKey() {
    const userStr = localStorage.getItem('spotinize_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user?.id) return String(user.id);
      } catch (e) {}
    }
    return 'anon';
  }

  static _isCacheableEndpoint(endpoint) {
    if (!endpoint || typeof endpoint !== 'string') return false;
    if (endpoint.startsWith('/search/trending')) return true;
    if (
      endpoint.startsWith('/game') ||
      endpoint.startsWith('/auth') ||
      endpoint.startsWith('/notifications') ||
      endpoint.startsWith('/audio') ||
      endpoint.startsWith('/deploy') ||
      endpoint.startsWith('/search?')
    ) {
      return false;
    }
    return true;
  }

  static clearCache() {
    this._getCache.clear();
  }

  static invalidateCache(prefixes = null) {
    if (!prefixes || !Array.isArray(prefixes) || prefixes.length === 0) {
      this._getCache.clear();
      return;
    }
    for (const key of Array.from(this._getCache.keys())) {
      const sepIdx = key.indexOf(':');
      const ep = sepIdx >= 0 ? key.slice(sepIdx + 1) : key;
      if (prefixes.some(prefix => ep.startsWith(prefix))) {
        this._getCache.delete(key);
      }
    }
  }

  static _invalidateForMutation(endpoint = '') {
    if (endpoint.startsWith('/auth/')) {
      this.clearCache();
    } else if (endpoint.startsWith('/feed')) {
      this.invalidateCache(['/feed', '/users/']);
    } else if (endpoint.startsWith('/store/') || endpoint.startsWith('/gacha/')) {
      this.invalidateCache(['/store/', '/gacha/', '/users/', '/profile']);
    } else if (endpoint.startsWith('/saved-tracks')) {
      this.invalidateCache(['/saved-tracks', '/feed', '/users/']);
    } else if (endpoint.startsWith('/follows') || endpoint.startsWith('/friends')) {
      this.invalidateCache(['/follows', '/friends', '/search/trending', '/users/', '/feed']);
    } else if (endpoint.startsWith('/daily') || endpoint.startsWith('/quests')) {
      this.invalidateCache(['/daily', '/quests', '/store/', '/users/']);
    } else if (endpoint.startsWith('/game/') || endpoint.startsWith('/ranked/')) {
      this.invalidateCache(['/leaderboard', '/ranked/', '/daily', '/quests', '/users/', '/feed', '/history']);
    } else if (endpoint.startsWith('/users/') || endpoint.startsWith('/profile')) {
      this.invalidateCache(['/users/', '/profile', '/feed']);
    } else {
      this.clearCache();
    }
  }

  static getHeaders() {
    const userStr = localStorage.getItem('spotinize_user');
    let userId = null;
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        userId = user.id;
      } catch (e) {}
    }
    const token = localStorage.getItem('spotinize_token');
    const browserId = localStorage.getItem('spotinize_browser_id');
    const guestToken = localStorage.getItem('spotinize_guest_token');

    const headers = {
      'Content-Type': 'application/json'
    };
    if (userId) headers['x-user-id'] = userId;
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (browserId) headers['x-browser-id'] = browserId;
    if (guestToken) headers['x-guest-token'] = guestToken;

    return headers;
  }

  static async request(endpoint, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const url = `${API_BASE}${endpoint}`;
    const headers = { ...this.getHeaders(), ...(options.headers || {}) };
    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const err = new Error(errData.error || `HTTP error ${response.status}`);
      err.status = response.status;
      err.code = errData.code || null;

      if (
        response.status === 401 &&
        !endpoint.startsWith('/auth/login') &&
        !endpoint.startsWith('/auth/register') &&
        localStorage.getItem('spotinize_token')
      ) {
        this.clearCache();
        window.dispatchEvent(
          new CustomEvent('spotinize:auth-invalid', {
            detail: { status: 401, code: errData.code || 'UNAUTHORIZED' }
          })
        );
      }

      throw err;
    }

    const data = await response.json();
    if (method !== 'GET') {
      this._invalidateForMutation(endpoint);
    }
    return data;
  }

  static async get(endpoint, { force = false, ttlMs = DEFAULT_GET_TTL_MS } = {}) {
    const cacheable = this._isCacheableEndpoint(endpoint);
    const cacheKey = `${this._getCurrentUserKey()}:${endpoint}`;

    if (!force && cacheable) {
      const cached = this._getCache.get(cacheKey);
      if (cached && Date.now() < cached.expiresAt) {
        return cached.data;
      }
      if (this._inFlightGets.has(cacheKey)) {
        return await this._inFlightGets.get(cacheKey);
      }
    }

    const promise = this.request(endpoint, { method: 'GET' })
      .then((data) => {
        if (cacheable) {
          this._getCache.set(cacheKey, { data, expiresAt: Date.now() + ttlMs });
        }
        return data;
      })
      .finally(() => {
        this._inFlightGets.delete(cacheKey);
      });

    if (cacheable) {
      this._inFlightGets.set(cacheKey, promise);
    }

    return await promise;
  }

  static post(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  static put(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  static patch(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  }

  static delete(endpoint, body = null) {
    const opts = { method: 'DELETE' };
    if (body !== null) {
      opts.body = JSON.stringify(body);
    }
    return this.request(endpoint, opts);
  }
}

export default ApiClient;
