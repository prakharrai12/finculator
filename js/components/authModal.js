/**
 * Finculator Authentication Modal Component
 * Streamlined 2-tab glassmorphic modal (Sign In / Create Account)
 * Dispatches rich credentials email directly to user on registration or forgot-password.
 */

import { auth } from '../utils/auth.js';

export class AuthModal {
  constructor(app) {
    this.app = app;
    this.activeTab = 'signin'; // 'signin' | 'signup'
    this.isOpen = false;
    this.isPortfolioGate = false;
    this.initDOM();
    this.attachEvents();
    this.updateHeaderProfile();

    // Subscribe to auth state updates
    auth.onAuthChange(() => {
      this.updateHeaderProfile();
    });
  }

  initDOM() {
    // 1. Create Modal Backdrop & Shell
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'auth-backdrop';
    this.backdrop.id = 'auth-modal-backdrop';
    this.backdrop.innerHTML = `
      <div class="auth-card" id="auth-modal-card">
        <!-- Header -->
        <div class="auth-header">
          <div class="auth-brand">
            <div class="auth-brand-logo">
              <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M 48 10 A 38 38 0 1 0 86 48" fill="none" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" />
                <rect x="34" y="52" width="7.5" height="20" rx="3.75" fill="#2563EB" />
                <rect x="46" y="40" width="7.5" height="32" rx="3.75" fill="#3B82F6" />
                <rect x="58" y="28" width="7.5" height="44" rx="3.75" fill="#06B6D4" />
                <path d="M 32 68 L 76 24" fill="none" stroke="#06B6D4" stroke-width="9" stroke-linecap="round" />
              </svg>
            </div>
            <div>
              <div class="auth-title" id="auth-modal-title">Finculator Access</div>
              <div class="auth-subtitle">Institutional Financial Engine</div>
            </div>
          </div>
          <button type="button" class="auth-close-btn" id="auth-btn-close" aria-label="Close Modal">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <!-- Navigation Tabs: Only Sign In & Create Account -->
        <div class="auth-tabs">
          <button type="button" class="auth-tab-btn active" data-tab="signin">Login (Existing User)</button>
          <button type="button" class="auth-tab-btn" data-tab="signup">Create Account (New User)</button>
        </div>

        <!-- Body Area -->
        <div class="auth-body" id="auth-body-container">
          <!-- Dynamic Form Mount -->
        </div>
      </div>
    `;

    document.body.appendChild(this.backdrop);
    this.renderForm();
  }

  attachEvents() {
    // Backdrop click close
    this.backdrop.addEventListener('click', (e) => {
      if (e.target === this.backdrop) {
        this.close();
      }
    });

    // Close button
    const closeBtn = this.backdrop.querySelector('#auth-btn-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Tab switching
    this.backdrop.querySelectorAll('.auth-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this.setTab(tab);
      });
    });
  }

  setTab(tab) {
    this.activeTab = tab === 'signup' ? 'signup' : 'signin';
    this.backdrop.querySelectorAll('.auth-tab-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === this.activeTab);
    });
    this.renderForm();
  }

  open(tab = 'signin') {
    this.setTab(tab);
    this.backdrop.classList.add('active');
    this.isOpen = true;
  }

  openWithPortfolioGate() {
    this.isPortfolioGate = true;
    this.open('signup');
  }

  close() {
    this.backdrop.classList.remove('active');
    this.isOpen = false;
  }

  renderForm() {
    const container = this.backdrop.querySelector('#auth-body-container');
    if (!container) return;

    const portfolioBanner = this.isPortfolioGate ? `
      <div style="background: rgba(37, 99, 235, 0.12); border: 1px solid rgba(37, 99, 235, 0.3); border-radius: 10px; padding: 12px 14px; margin-bottom: 1.25rem; display: flex; align-items: flex-start; gap: 10px;">
        <div style="color: #38BDF8; font-size: 1.15rem; line-height: 1;">🔒</div>
        <div style="font-size: 0.8rem; color: #E2E8F0; line-height: 1.45;">
          <strong style="color: #38BDF8; display: block; margin-bottom: 2px;">Account Required for Portfolio Builder</strong>
          Please log in or create a free account to build your asset & liability balance sheet, save your investor profile, and export PDF statements.
        </div>
      </div>
    ` : '';

    if (this.activeTab === 'signin') {
      container.innerHTML = `
        ${portfolioBanner}
        <form id="form-auth-signin">
          <div class="auth-form-group">
            <label class="auth-label" for="auth-signin-email">Email Address</label>
            <div class="auth-input-wrap">
              <input type="email" id="auth-signin-email" class="auth-input" placeholder="name@example.com" required autocomplete="username" />
            </div>
          </div>

          <div class="auth-form-group">
            <div class="auth-helper-row" style="margin-bottom: 0.4rem;">
              <label class="auth-label" for="auth-signin-pw" style="margin-bottom: 0;">Password</label>
              <button type="button" class="auth-link" id="btn-forgot-credentials">Forgot Password? Email Credentials</button>
            </div>
            <div class="auth-input-wrap">
              <input type="password" id="auth-signin-pw" class="auth-input" placeholder="••••••••" required autocomplete="current-password" />
              <button type="button" class="auth-input-toggle-pw" id="toggle-pw-btn" aria-label="Toggle Password Visibility">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              </button>
            </div>
          </div>

          <div class="auth-helper-row" style="margin-top: 0.8rem;">
            <label style="display:flex; align-items:center; gap: 0.4rem; cursor:pointer; font-size: 0.8rem; color: #94A3B8;">
              <input type="checkbox" id="auth-remember-me" checked style="accent-color: #38BDF8;" /> Remember Session
            </label>
            <button type="button" class="auth-link" id="btn-switch-to-signup">New here? Create Account</button>
          </div>

          <button type="submit" class="auth-submit-btn" id="btn-submit-signin">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
            Sign In & Unlock Workspace
          </button>
        </form>
      `;

      this.bindSignInEvents(container);
    } else {
      container.innerHTML = `
        ${portfolioBanner}
        <form id="form-auth-signup">
          <div class="auth-form-group">
            <label class="auth-label" for="auth-signup-name">Full Name</label>
            <div class="auth-input-wrap">
              <input type="text" id="auth-signup-name" class="auth-input" placeholder="e.g. Alex Morgan" required autocomplete="name" />
            </div>
          </div>

          <div class="auth-form-group">
            <label class="auth-label" for="auth-signup-email">Email Address</label>
            <div class="auth-input-wrap">
              <input type="email" id="auth-signup-email" class="auth-input" placeholder="name@example.com" required autocomplete="email" />
            </div>
          </div>

          <div class="auth-form-group">
            <label class="auth-label" for="auth-signup-pw">Create Password</label>
            <div class="auth-input-wrap">
              <input type="password" id="auth-signup-pw" class="auth-input" placeholder="Minimum 6 characters" minlength="6" required autocomplete="new-password" />
            </div>
          </div>

          <div style="background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 8px; padding: 12px; margin-top: 0.75rem; font-size: 0.78rem; color: #38BDF8; line-height: 1.45;">
            ✉️ <strong>Direct Credentials Dispatch:</strong> A formal welcome email with your verified login credentials and security tokens will be sent directly to your email address.
          </div>

          <button type="submit" class="auth-submit-btn" id="btn-submit-signup">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
            Create Account & Send Credentials
          </button>

          <div style="text-align:center; margin-top: 1rem;">
            <button type="button" class="auth-link" id="btn-switch-to-signin">Already have an account? Sign In</button>
          </div>
        </form>
      `;

      this.bindSignUpEvents(container);
    }
  }

  bindSignInEvents(container) {
    const form = container.querySelector('#form-auth-signin');
    const togglePw = container.querySelector('#toggle-pw-btn');
    const pwInput = container.querySelector('#auth-signin-pw');
    const emailInput = container.querySelector('#auth-signin-email');

    if (togglePw && pwInput) {
      togglePw.addEventListener('click', () => {
        pwInput.type = pwInput.type === 'password' ? 'text' : 'password';
      });
    }

    const switchBtn = container.querySelector('#btn-switch-to-signup');
    if (switchBtn) {
      switchBtn.addEventListener('click', () => this.setTab('signup'));
    }

    const forgotBtn = container.querySelector('#btn-forgot-credentials');
    if (forgotBtn) {
      forgotBtn.addEventListener('click', async () => {
        const email = (emailInput && emailInput.value.trim()) || prompt('Enter your registered email address:');
        if (!email) return;

        forgotBtn.textContent = 'Sending credentials...';
        try {
          const res = await auth.sendCredentials({ email });
          this.showToast(res.message || `Credentials sent directly to ${email}!`);
        } catch (err) {
          alert(err.message || 'Could not send credentials.');
        } finally {
          forgotBtn.textContent = 'Forgot Password? Email Credentials';
        }
      });
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value;
        const password = pwInput.value;
        const submitBtn = container.querySelector('#btn-submit-signin');

        submitBtn.disabled = true;
        submitBtn.textContent = 'Authenticating...';

        try {
          const res = await auth.login({ email, password });
          this.showToast(`Welcome back, ${res.user.name || res.user.email}!`);
          this.close();

          if (this.isPortfolioGate) {
            this.isPortfolioGate = false;
            setTimeout(() => {
              if (this.app && this.app.portfolio) this.app.portfolio.toggle(true);
            }, 300);
          }
        } catch (err) {
          alert(err.message || 'Login failed.');
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Sign In & Unlock Workspace';
        }
      });
    }
  }

  bindSignUpEvents(container) {
    const form = container.querySelector('#form-auth-signup');
    const switchBtn = container.querySelector('#btn-switch-to-signin');
    if (switchBtn) {
      switchBtn.addEventListener('click', () => this.setTab('signin'));
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = container.querySelector('#auth-signup-name').value;
        const email = container.querySelector('#auth-signup-email').value;
        const password = container.querySelector('#auth-signup-pw').value;
        const submitBtn = container.querySelector('#btn-submit-signup');

        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating Account & Dispatching Credentials...';

        try {
          const res = await auth.register({ name, email, password });
          this.showToast(`🎉 Account created! Credentials sent directly to ${email}`);
          this.close();

          if (this.isPortfolioGate) {
            this.isPortfolioGate = false;
            setTimeout(() => {
              if (this.app && this.app.portfolio) this.app.portfolio.toggle(true);
            }, 300);
          }
        } catch (err) {
          alert(err.message || 'Registration failed.');
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Create Account & Send Credentials';
        }
      });
    }
  }

  updateHeaderProfile() {
    const user = auth.getCurrentUser();
    let authWrap = document.querySelector('#header-auth-wrapper');

    if (!authWrap) {
      const headerActions = document.querySelector('.header-actions');
      if (!headerActions) return;

      authWrap = document.createElement('div');
      authWrap.className = 'header-auth-wrapper';
      authWrap.id = 'header-auth-wrapper';

      const homeBtn = headerActions.querySelector('#btn-header-home');
      if (homeBtn && homeBtn.nextSibling) {
        headerActions.insertBefore(authWrap, homeBtn.nextSibling);
      } else {
        headerActions.prepend(authWrap);
      }
    }

    if (user && user.email) {
      const initials = (user.name || user.email).substring(0, 2).toUpperCase();
      authWrap.innerHTML = `
        <button type="button" class="header-user-btn" id="header-user-menu-btn" title="Account Menu">
          <div class="header-user-avatar">${initials}</div>
          <span class="header-user-name">${user.name || user.email.split('@')[0]}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0F172A" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>

        <div class="header-auth-dropdown" id="header-auth-dropdown">
          <div style="padding: 0.5rem 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 0.35rem;">
            <div style="font-size:0.85rem; font-weight:700; color:#FFFFFF;">${user.name || 'Investor'}</div>
            <div style="font-size:0.72rem; color:#94A3B8; overflow:hidden; text-overflow:ellipsis;">${user.email}</div>
          </div>
          <button type="button" class="header-dropdown-item" id="btn-hdr-open-portfolio">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
            My Portfolio
          </button>
          <button type="button" class="header-dropdown-item logout-item" id="btn-hdr-logout">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Sign Out & Lock
          </button>
        </div>
      `;

      // Attach dropdown events
      const menuBtn = authWrap.querySelector('#header-user-menu-btn');
      const dropdown = authWrap.querySelector('#header-auth-dropdown');

      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('active');
      });

      document.addEventListener('click', () => {
        dropdown.classList.remove('active');
      });

      authWrap.querySelector('#btn-hdr-open-portfolio').addEventListener('click', () => {
        dropdown.classList.remove('active');
        if (this.app && this.app.portfolio) this.app.portfolio.toggle(true);
      });

      authWrap.querySelector('#btn-hdr-logout').addEventListener('click', () => {
        dropdown.classList.remove('active');
        sessionStorage.removeItem('finculator_guest_access');
        auth.logout();
        if (this.app && this.app.landingGate) {
          this.app.landingGate.lock();
        }
        this.showToast('Signed out. Website locked.');
      });
    } else {
      authWrap.innerHTML = `
        <button type="button" class="btn btn-secondary btn-sm" id="btn-header-signin" style="border-color: #CBD5E1; color: #0F172A; font-weight: 700; background: #F8FAFC;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
          Sign In / Register
        </button>
      `;

      authWrap.querySelector('#btn-header-signin').addEventListener('click', () => {
        this.isPortfolioGate = false;
        this.open('signin');
      });
    }

    if (this.app && typeof this.app.updateHomeButtonVisibility === 'function') {
      this.app.updateHomeButtonVisibility();
    }
  }

  showToast(msg) {
    const toast = document.querySelector('#app-toast');
    if (toast) {
      toast.textContent = msg;
      toast.classList.add('visible');
      setTimeout(() => toast.classList.remove('visible'), 3500);
    }
  }
}
