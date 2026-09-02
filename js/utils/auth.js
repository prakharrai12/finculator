/**
 * Finculator Authentication & Credentials Management Engine
 * Provides dual-mode (REST API + LocalStorage fallback) authentication,
 * session management, and credential dispatch handling.
 */

import { migrateGuestSessionToAccount } from './storage.js';

const AUTH_STORAGE_KEY = 'finculator_auth_session';
const USERS_STORAGE_KEY = 'finculator_local_users';
const SENT_EMAILS_STORAGE_KEY = 'finculator_local_sent_emails';

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
    this.currentUser = { ...user, token };
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
    return !!this.currentUser && !!this.currentUser.email;
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
    name = name.trim();
    email = email.trim().toLowerCase();

    // 1. Try Backend API
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }
      this.saveSession(data.user, data.token);
      return data;
    } catch (apiErr) {
      // 2. Fallback to LocalStorage Auth
      console.warn('Backend API unavailable, using offline client storage:', apiErr.message);
      return this.localRegister({ name, email, password });
    }
  }

  /**
   * Log In
   */
  async login({ email, password }) {
    email = email.trim().toLowerCase();

    // 1. Try Backend API
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed.');
      }
      this.saveSession(data.user, data.token);
      return data;
    } catch (apiErr) {
      // 2. Fallback to LocalStorage
      console.warn('Backend API login fallback:', apiErr.message);
      return this.localLogin({ email, password });
    }
  }

  /**
   * Send Credentials to Email
   */
  async sendCredentials({ email }) {
    email = email.trim().toLowerCase();

    try {
      const res = await fetch('/api/auth/send-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not send credentials.');
      }
      return data;
    } catch (err) {
      console.warn('Backend sendCredentials fallback:', err.message);
      return this.localSendCredentials({ email });
    }
  }

  /**
   * Forgot Password
   */
  async forgotPassword({ email }) {
    email = email.trim().toLowerCase();

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not process request.');
      }
      return data;
    } catch (err) {
      return this.localForgotPassword({ email });
    }
  }

  /**
   * Fetch sent email logs for inbox simulation
   */
  async getSentEmails() {
    try {
      const res = await fetch('/api/auth/sent-emails');
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    const local = localStorage.getItem(SENT_EMAILS_STORAGE_KEY);
    return local ? JSON.parse(local) : [];
  }

  /**
   * Log out
   */
  logout() {
    this.clearSession();
  }

  // --- LocalStorage Fallback Methods ---

  localRegister({ name, email, password }) {
    let users = [];
    try {
      users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
    } catch {}

    if (users.some((u) => u.email === email)) {
      throw new Error('An account with this email address already exists.');
    }

    const userId = 'usr_' + Math.random().toString(36).substring(2, 9);
    const token = 'tok_' + Math.random().toString(36).substring(2, 12);
    const user = { id: userId, name, email, password };
    users.push(user);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    const emailRec = this.saveLocalEmail(
      email,
      'Welcome to Finculator — Your Account Credentials',
      `<p>Hello <strong>${name}</strong>,</p><p>Your Finculator account has been created. Keep your login credentials safe.</p>`
    );

    this.saveSession({ id: userId, name, email }, token);
    return {
      success: true,
      message: 'Account created successfully. Credentials sent.',
      user: { id: userId, name, email },
      token,
      emailPreview: emailRec
    };
  }

  localLogin({ email, password }) {
    let users = [];
    try {
      users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
    } catch {}

    const match = users.find((u) => u.email === email && u.password === password);
    if (!match) {
      throw new Error('Invalid email or password.');
    }

    const token = 'tok_' + Math.random().toString(36).substring(2, 12);
    this.saveSession({ id: match.id, name: match.name, email: match.email }, token);
    return {
      success: true,
      message: `Welcome back, ${match.name}!`,
      user: { id: match.id, name: match.name, email: match.email },
      token
    };
  }

  localSendCredentials({ email }) {
    let users = [];
    try {
      users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
    } catch {}

    let user = users.find((u) => u.email === email);
    const tempPass = 'Fin@' + Math.floor(1000 + Math.random() * 9000);
    const name = user ? user.name : email.split('@')[0];

    if (!user) {
      user = { id: 'usr_' + Math.random().toString(36).substring(2, 9), name, email, password: tempPass };
      users.push(user);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }

    const emailRec = this.saveLocalEmail(
      email,
      'Your Finculator Login Credentials & Access Pass',
      `<p>Hello <strong>${name}</strong>,</p><p>Here are your requested login credentials:</p><p><strong>Email:</strong> ${email}<br/><strong>Access Pass:</strong> <code>${tempPass}</code></p>`
    );

    return {
      success: true,
      message: `Credentials dispatched to ${email}`,
      emailPreview: emailRec
    };
  }

  localForgotPassword({ email }) {
    const code = 'RST-' + Math.floor(100000 + Math.random() * 900000);
    const emailRec = this.saveLocalEmail(
      email,
      'Finculator Password Reset Code',
      `<p>Your one-time password reset code is: <strong>${code}</strong></p>`
    );
    return {
      success: true,
      message: `Password reset instructions sent to ${email}`,
      emailPreview: emailRec
    };
  }

  saveLocalEmail(to, subject, html) {
    let emails = [];
    try {
      emails = JSON.parse(localStorage.getItem(SENT_EMAILS_STORAGE_KEY) || '[]');
    } catch {}

    const rec = {
      id: 'eml_' + Math.random().toString(36).substring(2, 9),
      to,
      from: 'auth@finculator.io',
      subject,
      bodyHtml: html,
      bodyText: html.replace(/<[^>]+>/g, ' '),
      sentAt: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      status: 'DELIVERED'
    };
    emails.unshift(rec);
    localStorage.setItem(SENT_EMAILS_STORAGE_KEY, JSON.stringify(emails.slice(0, 50)));
    return rec;
  }
}

export const auth = new AuthService();
