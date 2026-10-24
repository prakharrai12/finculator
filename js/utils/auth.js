/**
 * Finculator Authentication & Credentials Management Engine
 * Secure REST API client with zero client-side password caching.
 * Enforces client-first privacy and strict password validation.
 */

import { migrateGuestSessionToAccount } from './storage.js';

const AUTH_STORAGE_KEY = 'finculator_auth_session';

const COMMON_PASSWORDS = new Set([
  'password', 'password123', '12345678', '123456789', '1234567890',
  'qwertyuiop', 'admin123', 'letmein123', 'welcome123', 'finculator',
  'finculator123', 'iloveyou', 'sunshine', 'princess', 'football'
]);

export function validatePasswordPolicy(password) {
  if (!password || password.length < 10) {
    return { valid: false, error: 'Password must be at least 10 characters long.' };
  }
  if (password.length > 128) {
    return { valid: false, error: 'Password must not exceed 128 characters.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter (A-Z).' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter (a-z).' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one digit (0-9).' };
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character (!@#$%^&*...).' };
  }
  const lower = password.toLowerCase();
  const stripped = lower.replace(/[^a-z]/g, '');
  if (COMMON_PASSWORDS.has(lower) || COMMON_PASSWORDS.has(stripped)) {
    return { valid: false, error: 'This password is too common and easily guessed. Please choose a stronger password.' };
  }
  return { valid: true };
}

class AuthService {
  constructor() {
    this.currentUser = this.loadSession();
    this.listeners = [];
  }

  loadSession() {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  saveSession(user, token) {
    // Only store safe public user profile fields and signed token. Never store passwords.
    this.currentUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'user',
      token
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(this.currentUser));

    // Migrate any guest session data into permanent account
    try {
      migrateGuestSessionToAccount();
    } catch (e) {
      console.warn('Guest session data migration error:', e);
    }

    this.broadcast();
  }

  clearSession() {
    this.currentUser = null;
    localStorage.removeItem(AUTH_STORAGE_KEY);
    this.broadcast();
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isAuthenticated() {
    return !!this.currentUser && !!this.currentUser.email && !!this.currentUser.token;
  }

  onAuthChange(cb) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  broadcast() {
    this.listeners.forEach((cb) => {
      try {
        cb(this.currentUser);
      } catch (err) {
        console.error('Auth listener error:', err);
      }
    });
    window.dispatchEvent(new CustomEvent('finculator:auth-changed', { detail: { user: this.currentUser } }));
  }

  /**
   * Register a new user
   */
  async register({ name, email, password }) {
    name = (name || '').trim();
    email = (email || '').trim().toLowerCase();

    if (!name || !email || !password) {
      throw new Error('Name, email, and password are required.');
    }

    const policyCheck = validatePasswordPolicy(password);
    if (!policyCheck.valid) {
      throw new Error(policyCheck.error);
    }

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Finculator-CSRF': '1'
      },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed. Please check your connection and try again.');
    }

    this.saveSession(data.user, data.token);
    return data;
  }

  /**
   * Log In
   */
  async login({ email, password }) {
    email = (email || '').trim().toLowerCase();

    if (!email || !password) {
      throw new Error('Email address and password are required.');
    }

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Finculator-CSRF': '1'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Invalid credentials or authentication server unavailable.');
    }

    this.saveSession(data.user, data.token);
    return data;
  }

  /**
   * Request password reset instructions
   */
  async forgotPassword({ email }) {
    email = (email || '').trim().toLowerCase();
    if (!email) {
      throw new Error('Please enter your email address.');
    }

    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Finculator-CSRF': '1'
      },
      body: JSON.stringify({ email })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Unable to process password reset request.');
    }

    return data;
  }

  /**
   * Reset password with one-time expiring token
   */
  async resetPassword({ token, newPassword }) {
    if (!token) throw new Error('Password reset token is required.');
    const policyCheck = validatePasswordPolicy(newPassword);
    if (!policyCheck.valid) {
      throw new Error(policyCheck.error);
    }

    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Finculator-CSRF': '1'
      },
      body: JSON.stringify({ token, newPassword })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Password reset failed. The link may have expired.');
    }

    return data;
  }

  /**
   * Log out
   */
  logout() {
    this.clearSession();
  }
}

export const auth = new AuthService();
