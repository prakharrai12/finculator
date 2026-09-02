/**
 * Finculator Fullscreen Hero Landing Gate Component
 * Modern Institutional Dark Theme (#0b0f19)
 * Sequential Document Flow:
 * Top Navbar -> Hero Section -> Services -> Institutional Pillars -> Final CTA -> Sitewide Footer
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
        
        <!-- 1. Top Navigation Bar (Sticky at Top) -->
        <header class="landing-nav-bar">
          <div class="landing-brand-mark">
            <svg width="34" height="34" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="gate-logo-grad" x1="30" y1="70" x2="85" y2="15" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#3B6FD4" />
                  <stop offset="100%" stop-color="#4A7FE0" />
                </linearGradient>
              </defs>
              <path d="M 48 10 A 38 38 0 1 0 86 48" fill="none" stroke="#0F172A" stroke-width="10" stroke-linecap="round" />
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
            <button type="button" class="btn btn-secondary btn-sm landing-nav-guest-btn" id="gate-nav-guest-btn">
              Continue as Guest &rarr;
            </button>
            <button type="button" class="btn btn-primary btn-sm" id="gate-nav-login-btn">
              Member Login
            </button>
          </div>
        </header>

        <!-- 2. Hero Section (Image Fully Covers Background Behind Content) -->
        <section class="hero-section" id="landing-hero-section">
          <!-- Background Artwork Layer: Strictly in background (z-index: 1), fully covering background -->
          <div class="hero-bg-art-wrapper visual-card" aria-hidden="true">
            <picture>
              <source 
                srcset="hero-illustration-mobile.webp 540w, hero-illustration.webp 1200w" 
                sizes="(max-width: 768px) 100vw, 100vw" 
                type="image/webp"
              >
              <img 
                src="image_435406.jpg" 
                alt="" 
                class="hero-bg-art-img hero-img"
                loading="eager" 
                fetchpriority="high" 
                width="1376" 
                height="768"
              >
            </picture>
            <div class="hero-bg-overlay-left card-overlay-edge"></div>
            <div class="hero-bg-blur-bottom"></div>
            <div class="hero-bg-fade-bottom"></div>
          </div>

          <div class="hero-container">
            <!-- 1. Eyebrow badge -->
            <div class="landing-eyebrow-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
              INSTITUTIONAL WEALTH SUITE
            </div>

            <!-- 2. Headline -->
            <h1 class="hero-title">
              Maximizing Growth,<br/>
              <span class="landing-title-accent">Minimizing Risk</span>
            </h1>
            
            <!-- 3. Subtext -->
            <p class="hero-subtitle">
              Smarter financial tools designed to plan, project, and optimize your wealth trajectory with verified mathematical precision. Instant calculation with zero forced login.
            </p>

            <!-- 4. Exactly two buttons, side by side -->
            <div class="hero-actions">
              <button type="button" class="btn btn-primary" id="hero-btn-get-started">Get Started Free</button>
              <button type="button" class="btn btn-secondary" id="gate-btn-guest">
                Continue as Guest <span class="btn-arrow">&rarr;</span>
              </button>
            </div>
          </div>
        </section>

        <!-- 3. Slim Trust Bar Section (Directly below hero, above capabilities) -->
        <section class="landing-trust-bar" id="landing-trust-bar">
          <div class="trust-bar-container">
            <div class="trust-bar-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
              <span>27+ Financial Engines</span>
            </div>
            <div class="trust-bar-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              <span>Client-Side Isolation</span>
            </div>
            <div class="trust-bar-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Institutional Accuracy</span>
            </div>
            <div class="trust-bar-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              <span>Zero Forced Tracking</span>
            </div>
          </div>
        </section>

        <!-- 4. Core Advisory Capabilities Section (Sibling in flow) -->
        <section class="landing-services-section" id="landing-services-section">
          <!-- Background Section Artwork: Hand holding coin stacks with rising growth chart -->
          <div class="section-bg-art-wrapper" aria-hidden="true">
            <picture>
              <source srcset="art_coins_growth.webp" type="image/webp">
              <img src="art_coins_growth.png" alt="" class="section-bg-art-img art-coins" loading="lazy" width="440" height="360">
            </picture>
            <div class="section-bg-art-mask"></div>
          </div>

          <div class="landing-section-container">
            <div class="landing-services-header">
              <span class="landing-services-tag">CORE ADVISORY CAPABILITIES</span>
              <h2 class="landing-services-heading">Institutional Wealth &amp; Strategic Calculation Engines</h2>
              <p class="landing-services-sub">From personal portfolio health to complex debt structuring, choose your financial instrument.</p>
            </div>
            <div class="landing-services-grid">
              
              <!-- Card 1: Portfolio Management -->
              <div class="landing-service-card" role="button" tabindex="0" data-route="portfolio">
                <div class="service-card-top">
                  <div class="landing-service-icon-wrap">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                      <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
                    </svg>
                  </div>
                  <span class="service-pill-badge">NET WORTH &amp; ASSETS</span>
                </div>
                <div class="landing-service-content">
                  <h3 class="landing-service-title">Portfolio Management</h3>
                  <p class="landing-service-desc">Personal Financial Statement (PFS), asset allocation donut breakdown, and real-time net worth intelligence.</p>
                </div>
                <span class="landing-service-link">Launch Portfolio <span class="link-arrow">&rarr;</span></span>
              </div>

              <!-- Card 2: Financial Planning -->
              <div class="landing-service-card" role="button" tabindex="0" data-route="fire">
                <div class="service-card-top">
                  <div class="landing-service-icon-wrap">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                  </div>
                  <span class="service-pill-badge">TAX &amp; FIRE ROADMAP</span>
                </div>
                <div class="landing-service-content">
                  <h3 class="landing-service-title">Financial Planning</h3>
                  <p class="landing-service-desc">FIRE freedom numbers, multi-regime income taxes, step-up SIP wealth models, and inflation forecasts.</p>
                </div>
                <span class="landing-service-link">Plan Trajectory <span class="link-arrow">&rarr;</span></span>
              </div>

              <!-- Card 3: Risk Analysis -->
              <div class="landing-service-card" role="button" tabindex="0" data-route="emi">
                <div class="service-card-top">
                  <div class="landing-service-icon-wrap">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                  </div>
                  <span class="service-pill-badge">DEBT &amp; AMORTIZATION</span>
                </div>
                <div class="landing-service-content">
                  <h3 class="landing-service-title">Risk Analysis</h3>
                  <p class="landing-service-desc">Loan amortization schedules, prepayment interest savings, FOIR debt eligibility, and credit payoff analysis.</p>
                </div>
                <span class="landing-service-link">Analyze Debt <span class="link-arrow">&rarr;</span></span>
              </div>

            </div>
          </div>
        </section>

        <!-- 5. Institutional Pillars & Trust Section ("Why Finculator") -->
        <section class="landing-benefits-section" id="landing-benefits-section">
          <!-- Background Section Artwork: Hand with magnifying glass inspecting bar chart -->
          <div class="section-bg-art-wrapper" aria-hidden="true">
            <picture>
              <source srcset="art_magnifying_bars.webp" type="image/webp">
              <img src="art_magnifying_bars.png" alt="" class="section-bg-art-img art-magnifying" loading="lazy" width="420" height="350">
            </picture>
            <div class="section-bg-art-mask"></div>
          </div>

          <div class="landing-section-container">
            <div class="landing-services-header">
              <span class="landing-services-tag">ENGINEERED FOR PRECISION</span>
              <h2 class="landing-services-heading">Why Institutional Investors &amp; Planners Rely on Finculator</h2>
            </div>
            <div class="landing-benefits-grid">
              <div class="landing-benefit-item">
                <div class="benefit-card-top">
                  <div class="landing-benefit-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
                  </div>
                  <span class="benefit-pill-badge">DETERMINISTIC</span>
                </div>
                <div>
                  <h4 class="landing-benefit-title">Verified Mathematical Accuracy</h4>
                  <p class="landing-benefit-text">Amortization schedules and compounding engines rigorously tested against benchmark calculation standards.</p>
                </div>
              </div>
              <div class="landing-benefit-item">
                <div class="benefit-card-top">
                  <div class="landing-benefit-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  </div>
                  <span class="benefit-pill-badge">CLIENT-SIDE ONLY</span>
                </div>
                <div>
                  <h4 class="landing-benefit-title">Client-Side Data Privacy</h4>
                  <p class="landing-benefit-text">Guest calculations run 100% in your local browser session. No forced tracking or unwanted third-party data harvesting.</p>
                </div>
              </div>
              <div class="landing-benefit-item">
                <div class="benefit-card-top">
                  <div class="landing-benefit-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                  </div>
                  <span class="benefit-pill-badge">PRINT-READY</span>
                </div>
                <div>
                  <h4 class="landing-benefit-title">Advisory-Grade Export Statements</h4>
                  <p class="landing-benefit-text">Export formatted balance sheets, debt amortization timetables, and FIRE milestones with print-ready precision.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 6. Final Call to Action Section (Sibling in flow) -->
        <section class="landing-cta-section" id="landing-cta-section">
          <div class="landing-cta-card">
            <!-- Background Section Artwork: Hand pointing at target bullseye with arrow -->
            <div class="cta-bg-art-wrapper" aria-hidden="true">
              <picture>
                <source srcset="art_target_bullseye.webp" type="image/webp">
                <img src="art_target_bullseye.png" alt="" class="cta-bg-art-img art-target" loading="lazy" width="340" height="275">
              </picture>
            </div>
            <div class="cta-content-wrapper">
              <h2 class="landing-cta-title">Ready to Master Your Capital Trajectory?</h2>
              <p class="landing-cta-sub">Join institutional investors, independent advisers, and forward-looking individuals who trust Finculator for uncompromising calculation accuracy.</p>
              <div class="landing-cta-actions">
                <button type="button" class="btn btn-primary" id="landing-cta-signup-btn">Get Started Free</button>
                <button type="button" class="landing-cta-link-btn" id="landing-cta-guest-btn">
                  Launch Guest Calculators <span class="link-arrow">&rarr;</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- 7. Shared Institutional Full-Width Sitewide Footer (Sibling in flow at true bottom) -->
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
    // Top Nav: Member Login Button
    const navLoginBtn = this.container.querySelector('#gate-nav-login-btn');
    if (navLoginBtn) {
      navLoginBtn.addEventListener('click', () => {
        if (this.app && this.app.authModal) this.app.authModal.open('signin');
      });
    }

    // Top Nav: Continue as Guest Button
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

    // Hero: Get Started Free Button
    const heroGetStarted = this.container.querySelector('#hero-btn-get-started');
    if (heroGetStarted) {
      heroGetStarted.addEventListener('click', () => {
        if (this.app && this.app.authModal) this.app.authModal.open('signup');
      });
    }

    // Hero: Continue as Guest Button
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

    // Final CTA Actions
    const ctaSignup = this.container.querySelector('#landing-cta-signup-btn');
    if (ctaSignup) {
      ctaSignup.addEventListener('click', () => {
        if (this.app && this.app.authModal) this.app.authModal.open('signup');
      });
    }

    const ctaGuest = this.container.querySelector('#landing-cta-guest-btn');
    if (ctaGuest) {
      ctaGuest.addEventListener('click', () => {
        this.dismissGuest();
      });
    }
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

    if (isAuth || guestAccess) {
      this.unlock();
    } else {
      this.lock();
    }
  }

  lock() {
    const overlay = this.container.querySelector('#auth-landing-gate-overlay');
    if (overlay) {
      overlay.classList.remove('unlocked');
    }
    document.body.classList.add('gate-locked');
    if (this.app && typeof this.app.updateHomeButtonVisibility === 'function') {
      this.app.updateHomeButtonVisibility();
    }
  }

  unlock() {
    const overlay = this.container.querySelector('#auth-landing-gate-overlay');
    if (overlay) {
      overlay.classList.add('unlocked');
    }
    document.body.classList.remove('gate-locked');
    if (this.app && typeof this.app.updateHomeButtonVisibility === 'function') {
      this.app.updateHomeButtonVisibility();
    }
  }
}
