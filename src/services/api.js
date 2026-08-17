const API_BASE = '/api';

export class ApiClient {
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

    const headers = {
      'Content-Type': 'application/json'
    };
    if (userId) headers['x-user-id'] = userId;
    if (token) headers['Authorization'] = `Bearer ${token}`;

    return headers;
  }

  static async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = { ...this.getHeaders(), ...(options.headers || {}) };
    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error ${response.status}`);
    }

    return await response.json();
  }

  static get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  static post(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }
}

export default ApiClient;
