/**
 * Finculator Fullscreen Hero Landing Gate Component
 * Controls the gate screen that locks the website for unauthenticated users,
 * providing the white-dominant layout with two buttons (Existing User / New User).
 */

import { auth } from '../utils/auth.js';
import { FooterComponent } from './footer.js';

export class HeroLandingGate {
  constructor(app) {
    this.app = app;
    this.container = document.getElementById('auth-landing-gate-container');
    this.initDOM();
    this.attachEvents();
    this.syncAuthState();

    // Subscribe to auth state updates
    auth.onAuthChange(() => {
      this.syncAuthState();
    });
  }

  initDOM() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'auth-landing-gate-container';
      document.body.prepend(this.container);
    }

    this.container.innerHTML = `
      <div class="landing-gate-overlay" id="auth-landing-gate-overlay">
        
        <!-- 1. Top Navigation Bar -->
        <header class="landing-nav-bar">
          <div class="landing-brand-mark">
            <svg width="34" height="34" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="gate-logo-grad" x1="30" y1="70" x2="85" y2="15" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#2563EB" />
                  <stop offset="100%" stop-color="#06B6D4" />
                </linearGradient>
              </defs>
              <path d="M 48 10 A 38 38 0 1 0 86 48" fill="none" stroke="#0F172A" stroke-width="12" stroke-linecap="round" />
              <rect x="34" y="52" width="7.5" height="20" rx="3.75" fill="#2563EB" />
              <rect x="46" y="40" width="7.5" height="32" rx="3.75" fill="#3B82F6" />
              <rect x="58" y="28" width="7.5" height="44" rx="3.75" fill="#06B6D4" />
              <path d="M 32 68 L 76 24" fill="none" stroke="url(#gate-logo-grad)" stroke-width="9" stroke-linecap="round" />
              <path d="M 56 20 L 82 20 L 82 46 Z" fill="url(#gate-logo-grad)" stroke-linejoin="round" />
            </svg>
            <div>
              <span class="landing-brand-title">FINCULATOR</span>
              <span class="landing-brand-tagline">Smart Decisions. Stronger Futures.</span>
            </div>
          </div>

          <div class="landing-nav-actions">
            <div class="landing-security-pill">
              <span class="landing-security-dot"></span>
              256-Bit TLS Security
            </div>
            <button type="button" class="btn btn-outline btn-sm landing-nav-guest-btn" id="gate-nav-guest-btn">
              Continue as Guest &rarr;
            </button>
            <button type="button" class="btn btn-secondary btn-sm" id="gate-nav-login-btn" style="border-color:#CBD5E1; color:#0F172A; font-weight:600;">
              Member Login
            </button>
          </div>
        </header>

        <!-- 2. Main 2-Column Hero Body -->
        <main class="landing-hero-body hero-section">
          <div class="landing-grid hero-container">
            
            <!-- Left Column: Copy Section -->
            <div class="landing-left-col hero-content">
              <div class="landing-upper-space">
                <div class="landing-eyebrow-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                  Institutional Wealth Suite
                </div>
              </div>

              <!-- Lower Title Card -->
              <div class="landing-title-card">
                <h1 class="landing-main-title hero-title">
                  Maximizing Growth,<br/>
                  <span class="landing-title-gradient">Minimizing Risk</span>
                </h1>
                
                <p class="landing-description hero-subtitle">
                  Smarter financial tools designed to plan, project, and optimize your wealth trajectory.
                </p>

                <!-- Hero Actions: Get Started & Learn More -->
                <div class="hero-actions">
                  <a href="#get-started" class="btn btn-primary" id="hero-btn-get-started">Get Started</a>
                  <a href="#learn-more" class="btn btn-secondary" id="hero-btn-learn-more">Learn More</a>
                </div>

                <!-- Two Primary Auth Buttons -->
                <div class="landing-btn-group">
                  <!-- Button 1: Login — Existing User -->
                  <button type="button" class="landing-btn-primary" id="gate-btn-existing-user">
                    <span class="landing-btn-title">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
                      Login Account
                    </span>
                    <span class="landing-btn-sub">Existing User • Access Saved Portfolio</span>
                  </button>

                  <!-- Button 2: Sign In / Create Account — New User -->
                  <button type="button" class="landing-btn-secondary" id="gate-btn-new-user">
                    <span class="landing-btn-title">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                      Create Account
                    </span>
                    <span class="landing-btn-sub">New User • Free Credentials Dispatch</span>
                  </button>
                </div>

                <!-- Prominent Continue Without Login Option -->
                <div class="landing-guest-action-wrap">
                  <button type="button" class="landing-btn-guest" id="gate-btn-guest">
                    <div class="landing-guest-badge">FREE GUEST ACCESS</div>
                    <div class="landing-guest-content">
                      <div class="landing-guest-title-row">
                        <span class="landing-guest-title">Continue Without Login</span>
                        <span class="landing-guest-arrow-chip">
                          Open Calculators
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </span>
                      </div>
                      <p class="landing-guest-note">
                        Instant access to all 27+ loans, taxes, investments & FIRE models. No login required to compute numbers. <em>(Account only needed to save a Portfolio & Statement).</em>
                      </p>
                    </div>
                  </button>
                </div>

              </div>
            </div>

            <!-- Right Column: Hero Visual Framing -->
            <div class="landing-right-col hero-visual">
              <div class="visual-card landing-image-card">
                <picture>
                  <source 
                    srcset="hero-illustration-mobile.webp 480w, hero-illustration.webp 1000w" 
                    sizes="(max-width: 768px) 100vw, 50vw" 
                    type="image/webp"
                  >
                  <img 
                    src="image_435406.jpg" 
                    alt="Hands holding cash and calculator with upward growth arrows" 
                    class="hero-img landing-visual-img"
                    loading="eager" 
                    fetchpriority="high" 
                    width="600" 
                    height="400"
                  >
                </picture>
                <div class="card-overlay-edge"></div>

                <!-- Top Left Floating Badge -->
                <div class="landing-floating-badge badge-top-left">
                  <div class="badge-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
                  </div>
                  <div>
                    <div class="badge-text-title">27+ Financial Engines</div>
                    <div class="badge-text-sub">Instant Unlocked Access</div>
                  </div>
                </div>

                <!-- Bottom Right Floating Badge -->
                <div class="landing-floating-badge badge-bottom-right">
                  <div class="badge-icon" style="background: linear-gradient(135deg, #10B981, #059669);">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <div>
                    <div class="badge-text-title">Personal Portfolio</div>
                    <div class="badge-text-sub">Member Account Sync</div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- Services Highlights Section -->
          <div class="landing-services-section" id="landing-services-section">
            <div class="landing-services-header">
              <span class="landing-services-tag">CORE ADVISORY CAPABILITIES</span>
              <h2 class="landing-services-heading">Institutional Wealth & Strategic Calculation Engines</h2>
            </div>
            <div class="landing-services-grid">
              
              <!-- Card 1: Portfolio Management -->
              <div class="landing-service-card" role="button" tabindex="0" data-route="portfolio">
                <div class="landing-service-icon-wrap" style="background: rgba(37, 99, 235, 0.15); color: #3B82F6;">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                    <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
                  </svg>
                </div>
                <div class="landing-service-content">
                  <h3 class="landing-service-title">Portfolio Management</h3>
                  <p class="landing-service-desc">Personal Financial Statement (PFS), asset allocation donut charts, and live net worth tracking.</p>
                </div>
              </div>

              <!-- Card 2: Financial Planning -->
              <div class="landing-service-card" role="button" tabindex="0" data-route="fire">
                <div class="landing-service-icon-wrap" style="background: rgba(6, 182, 212, 0.15); color: #06B6D4;">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </div>
                <div class="landing-service-content">
                  <h3 class="landing-service-title">Financial Planning</h3>
                  <p class="landing-service-desc">FIRE freedom numbers, multi-regime income taxes, step-up SIP wealth models, and inflation forecasts.</p>
                </div>
              </div>

              <!-- Card 3: Risk Analysis -->
              <div class="landing-service-card" role="button" tabindex="0" data-route="emi">
                <div class="landing-service-icon-wrap" style="background: rgba(16, 185, 129, 0.15); color: #10B981;">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </div>
                <div class="landing-service-content">
                  <h3 class="landing-service-title">Risk Analysis</h3>
                  <p class="landing-service-desc">Loan amortization schedules, prepayment interest savings, FOIR debt eligibility, and credit payoff analysis.</p>
                </div>
              </div>

            </div>
          </div>

        </main>

        <!-- Shared Institutional Full-Width Sitewide Footer -->
        <footer class="app-footer" id="landing-site-footer"></footer>
      </div>
    `;

    // Initialize shared Footer component
    const footerEl = this.container.querySelector('#landing-site-footer');
    if (footerEl) {
      this.footer = new FooterComponent(footerEl, this.app, { isLanding: true });
    }
  }

  attachEvents() {
    // Existing User Login Button
    const loginBtn = this.container.querySelector('#gate-btn-existing-user');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        if (this.app.authModal) this.app.authModal.open('signin');
      });
    }

    // New User Create Account Button
    const registerBtn = this.container.querySelector('#gate-btn-new-user');
    if (registerBtn) {
      registerBtn.addEventListener('click', () => {
        if (this.app.authModal) this.app.authModal.open('signup');
      });
    }

    // Nav Member Login Button
    const navLoginBtn = this.container.querySelector('#gate-nav-login-btn');
    if (navLoginBtn) {
      navLoginBtn.addEventListener('click', () => {
        if (this.app.authModal) this.app.authModal.open('signin');
      });
    }

    // Continue as Guest / Return to Active Session Button (Main Title Card)
    const guestBtn = this.container.querySelector('#gate-btn-guest');
    if (guestBtn) {
      guestBtn.addEventListener('click', () => {
        const isAuth = auth.isAuthenticated();
        const guestAccess = sessionStorage.getItem('finculator_guest_access') === 'true';
        if (isAuth || guestAccess) {
          this.unlock();
        } else {
          this.dismissGuest();
        }
      });
    }

    // Continue as Guest / Return to Active Session Button (Top Navigation)
    const navGuestBtn = this.container.querySelector('#gate-nav-guest-btn');
    if (navGuestBtn) {
      navGuestBtn.addEventListener('click', () => {
        const isAuth = auth.isAuthenticated();
        const guestAccess = sessionStorage.getItem('finculator_guest_access') === 'true';
        if (isAuth || guestAccess) {
          this.unlock();
        } else {
          this.dismissGuest();
        }
      });
    }

    // Hero Actions: Get Started & Learn More
    const heroGetStarted = this.container.querySelector('#hero-btn-get-started');
    if (heroGetStarted) {
      heroGetStarted.addEventListener('click', (e) => {
        e.preventDefault();
        if (this.app.authModal) this.app.authModal.open('signup');
      });
    }

    const heroLearnMore = this.container.querySelector('#hero-btn-learn-more');
    if (heroLearnMore) {
      heroLearnMore.addEventListener('click', (e) => {
        e.preventDefault();
        const servicesSec = this.container.querySelector('#landing-services-section');
        if (servicesSec) {
          servicesSec.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }

    // Interactive Service Cards: Enter Workspace Directly
    const serviceCards = this.container.querySelectorAll('.landing-service-card');
    serviceCards.forEach(card => {
      card.addEventListener('click', () => {
        const route = card.getAttribute('data-route');
        this.dismissGuest();
        if (this.app) {
          if (route === 'portfolio') {
            setTimeout(() => {
              if (this.app.portfolio) this.app.portfolio.toggle(true);
            }, 150);
          } else if (this.app.navigateTo) {
            this.app.navigateTo(route);
          }
        }
      });
    });
  }

  dismissGuest() {
    sessionStorage.setItem('finculator_guest_access', 'true');
    this.unlock();
    if (this.app && typeof this.app.updateHomeButtonVisibility === 'function') {
      this.app.updateHomeButtonVisibility();
    }
    if (this.app && this.app.showToast) {
      this.app.showToast('✨ Guest mode active: Calculate freely across all engines! Log in anytime to save your portfolio.');
    }
  }

  syncAuthState() {
    const isAuth = auth.isAuthenticated();
    const guestAccess = sessionStorage.getItem('finculator_guest_access') === 'true';
    const overlay = this.container.querySelector('#auth-landing-gate-overlay');
    if (!overlay) return;

    this.syncLandingButtons();

    if (isAuth || guestAccess) {
      overlay.classList.add('unlocked');
      document.body.classList.remove('gate-locked');
    } else {
      overlay.classList.remove('unlocked');
      document.body.classList.add('gate-locked');
    }

    if (this.app && typeof this.app.updateHomeButtonVisibility === 'function') {
      this.app.updateHomeButtonVisibility();
    }
  }

  showLanding() {
    const overlay = this.container.querySelector('#auth-landing-gate-overlay');
    if (overlay) overlay.classList.remove('unlocked');
    document.body.classList.add('gate-locked');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.syncLandingButtons();
    if (this.app && typeof this.app.updateHomeButtonVisibility === 'function') {
      this.app.updateHomeButtonVisibility();
    }
  }

  syncLandingButtons() {
    const isAuth = auth.isAuthenticated();
    const guestAccess = sessionStorage.getItem('finculator_guest_access') === 'true';

    const navGuestBtn = this.container.querySelector('#gate-nav-guest-btn');
    const guestBtnTitle = this.container.querySelector('#gate-btn-guest .landing-guest-title');
    const guestBadge = this.container.querySelector('#gate-btn-guest .landing-guest-badge');
    const guestNote = this.container.querySelector('#gate-btn-guest .landing-guest-note');

    if (isAuth) {
      if (navGuestBtn) navGuestBtn.textContent = 'Return to Calculators →';
      if (guestBtnTitle) guestBtnTitle.textContent = 'Return to Workspace';
      if (guestBadge) guestBadge.textContent = 'ACTIVE SESSION';
      if (guestNote) guestNote.innerHTML = 'Return directly to your calculators and active calculations with full portfolio access.';
    } else if (guestAccess) {
      if (navGuestBtn) navGuestBtn.textContent = 'Return to Calculators →';
      if (guestBtnTitle) guestBtnTitle.textContent = 'Return to Calculators';
      if (guestBadge) guestBadge.textContent = 'GUEST SESSION ACTIVE';
      if (guestNote) guestNote.innerHTML = 'Instant access to all 27+ loans, taxes, investments & FIRE models. No login required to compute numbers.';
    } else {
      if (navGuestBtn) navGuestBtn.textContent = 'Continue as Guest →';
      if (guestBtnTitle) guestBtnTitle.textContent = 'Continue Without Login';
      if (guestBadge) guestBadge.textContent = 'FREE GUEST ACCESS';
      if (guestNote) guestNote.innerHTML = 'Instant access to all 27+ loans, taxes, investments & FIRE models. No login required to compute numbers. <em>(Account only needed to save a Portfolio & Statement).</em>';
    }
  }

  unlock() {
    const overlay = this.container.querySelector('#auth-landing-gate-overlay');
    if (overlay) overlay.classList.add('unlocked');
    document.body.classList.remove('gate-locked');
    if (this.app && typeof this.app.updateHomeButtonVisibility === 'function') {
      this.app.updateHomeButtonVisibility();
    }
  }

  lock() {
    sessionStorage.removeItem('finculator_guest_access');
    const overlay = this.container.querySelector('#auth-landing-gate-overlay');
    if (overlay) overlay.classList.remove('unlocked');
    document.body.classList.add('gate-locked');
    this.syncLandingButtons();
    if (this.app && typeof this.app.updateHomeButtonVisibility === 'function') {
      this.app.updateHomeButtonVisibility();
    }
  }
}
