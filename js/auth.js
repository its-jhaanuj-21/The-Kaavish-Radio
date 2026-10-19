/**
 * The Kaavish Radio — Authentication, Musical Profile & Friends Manager
 * Handles login, registration, initials avatar, profile preferences, and private friend lists.
 */

class AuthManager {
  constructor() {
    this.token = localStorage.getItem('kaavish_auth_token') || null;
    this.user = null;
    this.friends = [];
  }

  async init() {
    if (this.token) {
      try {
        await this.fetchCurrentUser();
      } catch (err) {
        console.warn('[AuthManager] Session invalid or expired, resetting token.');
        this.clearSession();
      }
    }
  }

  isLoggedIn() {
    return Boolean(this.token && this.user);
  }

  getAuthHeader() {
    return this.token ? `Bearer ${this.token}` : '';
  }

  async fetchCurrentUser() {
    if (!this.token) return null;

    const res = await fetch('/api/auth/me', {
      headers: { 'Authorization': this.getAuthHeader() }
    });

    if (!res.ok) {
      this.clearSession();
      return null;
    }

    const data = await res.json();
    if (data.success && data.user) {
      this.user = data.user;
      this.dispatchUpdate();
      return this.user;
    }

    this.clearSession();
    return null;
  }

  async register({ name, username, password, favSinger, favSong, status }) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        username,
        password,
        favSinger,
        favSong,
        status
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Registration failed');
    }

    this.token = data.token;
    this.user = data.user;
    localStorage.setItem('kaavish_auth_token', this.token);
    this.dispatchUpdate();
    return this.user;
  }

  async login(username, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Invalid credentials');
    }

    this.token = data.token;
    this.user = data.user;
    localStorage.setItem('kaavish_auth_token', this.token);
    this.dispatchUpdate();
    return this.user;
  }

  async updateProfile(profileData) {
    if (!this.isLoggedIn()) throw new Error('Not logged in');

    const res = await fetch('/api/auth/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.getAuthHeader()
      },
      body: JSON.stringify(profileData)
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to update profile');
    }

    this.user = data.user;
    this.dispatchUpdate();
    return this.user;
  }

  async logout() {
    if (this.token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': this.getAuthHeader() }
        });
      } catch (e) {}
    }

    this.clearSession();
  }

  clearSession() {
    this.token = null;
    this.user = null;
    this.friends = [];
    localStorage.removeItem('kaavish_auth_token');
    this.dispatchUpdate();
  }

  async getFriendsList(targetUserId = null) {
    if (!this.isLoggedIn()) return [];

    const url = targetUserId
      ? `/api/friends/list?userId=${encodeURIComponent(targetUserId)}`
      : '/api/friends/list';

    const res = await fetch(url, {
      headers: { 'Authorization': this.getAuthHeader() }
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Could not load friends list');
    }

    if (!targetUserId) {
      this.friends = data.friends || [];
    }
    return data.friends || [];
  }

  dispatchUpdate() {
    window.dispatchEvent(new CustomEvent('authstatechange', {
      detail: {
        isLoggedIn: this.isLoggedIn(),
        user: this.user
      }
    }));
  }
}

window.authManager = new AuthManager();
