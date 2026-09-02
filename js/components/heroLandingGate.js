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
        
        <!-- 1. Top Navigation Bar (Sticky at Top with Scroll Progress) -->
        <header class="landing-nav-bar" id="landing-nav-bar">
          <div class="landing-scroll-progress" id="landing-scroll-progress"></div>
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
            <div class="landing-eyebrow-badge reveal-on-scroll">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
              INSTITUTIONAL WEALTH SUITE
            </div>

            <!-- 2. Headline -->
            <h1 class="hero-title reveal-on-scroll">
              Maximizing Growth,<br/>
              <span class="landing-title-accent">Minimizing Risk</span>
            </h1>
            
            <!-- 3. Subtext -->
            <p class="hero-subtitle reveal-on-scroll">
              Smarter financial tools designed to plan, project, and optimize your wealth trajectory with verified mathematical precision. Instant calculation with zero forced login.
            </p>

            <!-- 4. Exactly two buttons, side by side -->
            <div class="hero-actions reveal-on-scroll">
              <button type="button" class="btn btn-primary" id="hero-btn-get-started">Get Started Free</button>
              <button type="button" class="btn btn-secondary" id="gate-btn-guest">
                Continue as Guest <span class="btn-arrow">&rarr;</span>
              </button>
            </div>
          </div>
        </section>

        <!-- 3. Slim Trust Bar Section (Interactive Counters & Live Indicators) -->
        <section class="landing-trust-bar" id="landing-trust-bar">
          <div class="trust-bar-container">
            <div class="trust-bar-item reveal-on-scroll">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
              <span><strong class="trust-counter-val" data-target="27" data-suffix="+">27+</strong> Financial Engines</span>
            </div>
            <div class="trust-bar-item reveal-on-scroll">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              <span><strong class="trust-counter-val" data-target="100" data-suffix="%">100%</strong> Client-Side Isolation</span>
            </div>
            <div class="trust-bar-item reveal-on-scroll">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span><strong class="trust-counter-val" data-target="99.9" data-suffix="%" data-decimals="1">99.9%</strong> Institutional Accuracy</span>
            </div>
            <div class="trust-bar-item reveal-on-scroll">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              <span>Zero Forced Tracking</span>
            </div>
          </div>
        </section>

        <!-- 4. Core Advisory Capabilities Section (Interactive Filtering & 3D Cards) -->
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
            <div class="landing-services-header reveal-on-scroll">
              <span class="landing-services-tag">CORE ADVISORY CAPABILITIES</span>
              <h2 class="landing-services-heading">Institutional Wealth &amp; Strategic Calculation Engines</h2>
              <p class="landing-services-sub">From personal portfolio health to complex debt structuring, choose your financial instrument.</p>
              
              <!-- Interactive Category Filter Switcher -->
              <div class="landing-filter-pills" role="tablist" aria-label="Engine Category Filters">
                <button type="button" class="filter-pill active" data-filter="all">All Engines (27+)</button>
                <button type="button" class="filter-pill" data-filter="portfolio">Net Worth &amp; Assets</button>
                <button type="button" class="filter-pill" data-filter="fire">FIRE &amp; Tax Roadmap</button>
                <button type="button" class="filter-pill" data-filter="emi">Debt &amp; Amortization</button>
              </div>
            </div>

            <div class="landing-services-grid">
              
              <!-- Card 1: Portfolio Management -->
              <div class="landing-service-card reveal-on-scroll" role="button" tabindex="0" data-route="portfolio" data-category="portfolio">
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
              <div class="landing-service-card reveal-on-scroll" role="button" tabindex="0" data-route="fire" data-category="fire">
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
              <div class="landing-service-card reveal-on-scroll" role="button" tabindex="0" data-route="emi" data-category="emi">
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
            <div class="landing-services-header reveal-on-scroll">
              <span class="landing-services-tag">ENGINEERED FOR PRECISION</span>
              <h2 class="landing-services-heading">Why Institutional Investors &amp; Planners Rely on Finculator</h2>
            </div>
            <div class="landing-benefits-grid">
              <div class="landing-benefit-item reveal-on-scroll">
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
              <div class="landing-benefit-item reveal-on-scroll">
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
              <div class="landing-benefit-item reveal-on-scroll">
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
          <div class="landing-cta-card reveal-on-scroll">
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

        <!-- 7. Floating Smooth Back-To-Top Trigger -->
        <button type="button" class="landing-float-top-btn" id="landing-float-top-btn" aria-label="Scroll to top" title="Back to top">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"></polyline></svg>
        </button>

        <!-- 8. Shared Institutional Full-Width Sitewide Footer (Sibling in flow at true bottom) -->
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

    // Initialize interactive scrolling, reading progress, parallax, reveals, live counters & 3D tilt
    this.setupInteractiveFeatures();
  }

  setupInteractiveFeatures() {
    const overlay = this.container.querySelector('#auth-landing-gate-overlay');
    if (!overlay) return;

    const navBar = this.container.querySelector('#landing-nav-bar');
    const progressBar = this.container.querySelector('#landing-scroll-progress');
    const floatTopBtn = this.container.querySelector('#landing-float-top-btn');

    // Artworks for Parallax
    const heroArt = this.container.querySelector('.hero-bg-art-img');
    const coinsArt = this.container.querySelector('.section-bg-art-img.art-coins');
    const magArt = this.container.querySelector('.section-bg-art-img.art-magnifying');
    const targetArt = this.container.querySelector('.cta-bg-art-img.art-target');

    // 1. Scroll Progress, Sticky Nav Shadow & Parallax
    let ticking = false;
    overlay.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = overlay.scrollTop;
          const maxScroll = overlay.scrollHeight - overlay.clientHeight;
          const scrollPct = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;

          // Update Reading Progress Bar
          if (progressBar) {
            progressBar.style.width = `${scrollPct.toFixed(2)}%`;
          }

          // Sticky Nav Depth on Scroll
          if (navBar) {
            if (scrollTop > 25) {
              navBar.classList.add('scrolled');
            } else {
              navBar.classList.remove('scrolled');
            }
          }

          // Floating Back-to-Top Button Visibility
          if (floatTopBtn) {
            if (scrollTop > 380) {
              floatTopBtn.classList.add('is-visible');
            } else {
              floatTopBtn.classList.remove('is-visible');
            }
          }

          // Smooth Parallax Shifts
          if (heroArt) {
            heroArt.style.transform = `translateY(${scrollTop * 0.12}px) scale(1.02)`;
          }
          if (coinsArt) {
            const coinsSec = this.container.querySelector('#landing-services-section');
            if (coinsSec) {
              const offset = scrollTop - coinsSec.offsetTop;
              coinsArt.style.transform = `translateY(${offset * 0.08}px)`;
            }
          }
          if (magArt) {
            const magSec = this.container.querySelector('#landing-benefits-section');
            if (magSec) {
              const offset = scrollTop - magSec.offsetTop;
              magArt.style.transform = `translateY(${offset * 0.08}px)`;
            }
          }
          if (targetArt) {
            const ctaSec = this.container.querySelector('#landing-cta-section');
            if (ctaSec) {
              const offset = scrollTop - ctaSec.offsetTop;
              targetArt.style.transform = `translateY(calc(-50% + ${offset * 0.06}px))`;
            }
          }

          ticking = false;
        });
        ticking = true;
      }
    });

    // 2. Floating Top Button Click (Smooth Glide)
    if (floatTopBtn) {
      floatTopBtn.addEventListener('click', () => {
        overlay.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // 3. Staggered Scroll Reveals via IntersectionObserver
    const revealEls = this.container.querySelectorAll('.reveal-on-scroll');
    if ('IntersectionObserver' in window) {
      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      }, { root: overlay, threshold: 0.12 });

      revealEls.forEach(el => revealObserver.observe(el));
    } else {
      revealEls.forEach(el => el.classList.add('is-revealed'));
    }

    // 4. Live Counter Number Animations
    const counters = this.container.querySelectorAll('.trust-counter-val');
    let countersAnimated = false;
    const trustBar = this.container.querySelector('#landing-trust-bar');

    const runCounters = () => {
      if (countersAnimated) return;
      countersAnimated = true;
      counters.forEach(counter => {
        const target = parseFloat(counter.getAttribute('data-target') || '0');
        const suffix = counter.getAttribute('data-suffix') || '';
        const decimals = parseInt(counter.getAttribute('data-decimals') || '0', 10);
        const duration = 1400; // ms
        const startTime = performance.now();

        const updateCounter = (now) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // Ease-out cubic
          const easeOut = 1 - Math.pow(1 - progress, 3);
          const current = (target * easeOut).toFixed(decimals);
          counter.textContent = `${current}${suffix}`;
          if (progress < 1) {
            requestAnimationFrame(updateCounter);
          } else {
            counter.textContent = `${target}${suffix}`;
          }
        };
        requestAnimationFrame(updateCounter);
      });
    };

    if (trustBar && 'IntersectionObserver' in window) {
      const counterObserver = new IntersectionObserver((entries) => {
        if (entries[0] && entries[0].isIntersecting) {
          runCounters();
          counterObserver.disconnect();
        }
      }, { root: overlay, threshold: 0.2 });
      counterObserver.observe(trustBar);
    } else {
      setTimeout(runCounters, 400);
    }

    // 5. Interactive 3D Tilt & Cursor Spotlight on Cards
    const interactiveCards = this.container.querySelectorAll('.landing-service-card, .landing-benefit-item');
    interactiveCards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x.toFixed(1)}px`);
        card.style.setProperty('--mouse-y', `${y.toFixed(1)}px`);

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -3.5;
        const rotateY = ((x - centerX) / centerX) * 3.5;
        card.style.transform = `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });

    // 6. Interactive Category Filter Switcher
    const filterBtns = this.container.querySelectorAll('.service-filter-btn');
    const serviceCards = this.container.querySelectorAll('.landing-service-card');

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.getAttribute('data-target');
        serviceCards.forEach(card => {
          const category = card.getAttribute('data-category');
          if (filter === 'all' || category === filter) {
            card.classList.remove('is-dimmed');
            card.classList.add('is-highlighted');
            setTimeout(() => card.classList.remove('is-highlighted'), 900);
          } else {
            card.classList.add('is-dimmed');
          }
        });
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
