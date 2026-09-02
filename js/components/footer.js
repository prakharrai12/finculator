/**
 * Finculator Reusable Institutional Sitewide Footer Component
 * Shared identically across the active workspace and the landing gate page.
 */

export function getFooterHTML() {
  return `
      <div class="footer-container">
        <div class="footer-top">
          <!-- Col 1: Brand Info & Developer Profile -->
          <div class="footer-brand-col">
            <div class="brand-mark" style="color: #FFFFFF;">
              <div class="brand-logo-wrap">
                <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M 48 10 A 38 38 0 1 0 86 48" fill="none" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" />
                  <rect x="34" y="52" width="7.5" height="20" rx="3.75" fill="#2563EB" />
                  <rect x="46" y="40" width="7.5" height="32" rx="3.75" fill="#3B82F6" />
                  <rect x="58" y="28" width="7.5" height="44" rx="3.75" fill="#06B6D4" />
                  <path d="M 32 68 L 76 24" fill="none" stroke="#06B6D4" stroke-width="9" stroke-linecap="round" />
                  <path d="M 56 20 L 82 20 L 82 46 Z" fill="#06B6D4" stroke-linejoin="round" />
                </svg>
              </div>
              <div class="brand-info">
                <span class="brand-title" style="color: #FFFFFF; font-size: 1.05rem;">FINCULATOR</span>
                <span class="brand-tagline" style="color: #38BDF8; font-size: 0.65rem;">Smart Decisions. Stronger Futures.</span>
              </div>
            </div>

            <p class="footer-brand-desc">
              Institutional financial computation & wealth optimization suite architected by Prakhar Rai. Calculate, compare, and optimize loans, investments, and taxes with 100% mathematical precision.
            </p>

            <!-- Clean Icon-Only Social Row -->
            <div class="footer-social-row">
              <a href="https://github.com/prakharrai12/finculator" target="_blank" rel="noopener noreferrer" class="footer-github-btn" title="Finculator GitHub Repository & Architecture" aria-label="GitHub Repository">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                </svg>
              </a>
            </div>
          </div>

          <!-- Col 2: Loans & Mortgages -->
          <div class="footer-nav-col">
            <div class="footer-col-title">Loans & Mortgages</div>
            <ul class="footer-links">
              <li><a href="#/emi">EMI & Repayment</a></li>
              <li><a href="#/prepayment">Prepayment Analyzer</a></li>
              <li><a href="#/comparator">Loan Comparator</a></li>
              <li><a href="#/eligibility">Loan Eligibility (FOIR)</a></li>
              <li><a href="#/credit-card">Credit Card Payoff</a></li>
            </ul>
          </div>

          <!-- Col 3: Wealth & Taxes -->
          <div class="footer-nav-col">
            <div class="footer-col-title">Wealth & Taxes</div>
            <ul class="footer-links">
              <li><a href="#/invest-sip">SIP Calculator</a></li>
              <li><a href="#/invest-stepup">Step-Up SIP</a></li>
              <li><a href="#/savings-ppf">PPF (Tax-Free)</a></li>
              <li><a href="#/tax-income">Income Tax (Old vs New)</a></li>
              <li><a href="#/tax-salary">Take-Home Salary</a></li>
              <li><a href="#/fire">Retirement & FIRE</a></li>
            </ul>
          </div>

          <!-- Col 4: Stay Updated Newsletter -->
          <div class="footer-newsletter-col">
            <div class="footer-col-title">Stay Updated</div>
            <p class="footer-newsletter-desc">
              Get institutional intelligence on benchmark interest rates, fiscal policy revisions, and wealth models.
            </p>
            <form class="newsletter-form" novalidate>
              <div class="newsletter-input-group">
                <input 
                  type="email" 
                  class="newsletter-input" 
                  placeholder="Enter your email address" 
                  autocomplete="email"
                  spellcheck="false"
                  required 
                />
                <button type="submit" class="newsletter-submit-btn" aria-label="Subscribe to intelligence updates" title="Subscribe">
                  <span class="btn-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                  </span>
                </button>
              </div>
              <div class="newsletter-feedback" role="status" aria-live="polite"></div>
            </form>
          </div>
        </div>

        <!-- Footer Bottom Legal & Back to Top -->
        <div class="footer-bottom">
          <div class="footer-copyright">
            <span>© 2026 Finculator. Architected by <a href="https://github.com/prakharrai12" target="_blank" rel="noopener noreferrer" class="footer-author-link">Prakhar Rai</a>.</span>
          </div>
          <div class="footer-legal-links">
            <button type="button" class="back-to-top-btn" title="Scroll smoothly to top of page">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"></polyline></svg>
              Back to Top
            </button>
            <a href="#/emi" class="footer-legal-link">Privacy Policy</a>
            <a href="#/emi" class="footer-legal-link">Terms of Service</a>
            <a href="https://github.com/prakharrai12/finculator" target="_blank" rel="noopener noreferrer" class="footer-legal-link">Source Code</a>
          </div>
        </div>
      </div>
  `;
}

export class FooterComponent {
  constructor(container, app = null, options = {}) {
    this.container = container;
    this.app = app;
    this.isLanding = options.isLanding || false;
    this.init();
  }

  init() {
    if (!this.container) return;
    this.container.classList.add('app-footer');
    this.container.innerHTML = getFooterHTML();
    this.attachEvents();
  }

  attachEvents() {
    // Back to Top Smooth Scroll
    const backToTopBtn = this.container.querySelector('.back-to-top-btn');
    if (backToTopBtn) {
      backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const overlay = document.getElementById('auth-landing-gate-overlay');
        if (overlay) {
          overlay.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }

    // Functional Newsletter Subscription
    const newsletterForm = this.container.querySelector('.newsletter-form');
    const emailInput = this.container.querySelector('.newsletter-input');
    const feedbackEl = this.container.querySelector('.newsletter-feedback');
    const submitBtn = this.container.querySelector('.newsletter-submit-btn');

    if (newsletterForm && emailInput) {
      // Clear error styling on input change
      emailInput.addEventListener('input', () => {
        const group = emailInput.closest('.newsletter-input-group');
        if (group) group.classList.remove('input-error');
        if (feedbackEl) {
          feedbackEl.textContent = '';
          feedbackEl.className = 'newsletter-feedback';
        }
      });

      // Submit handler with real validation and server persistence
      newsletterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim().toLowerCase();
        const emailPattern = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
        const group = emailInput.closest('.newsletter-input-group');

        if (!email || !emailPattern.test(email)) {
          if (group) group.classList.add('input-error');
          if (feedbackEl) {
            feedbackEl.textContent = 'Please enter a valid email address (e.g. name@example.com).';
            feedbackEl.className = 'newsletter-feedback error';
          }
          emailInput.focus();
          return;
        }

        // Loading state
        if (group) group.classList.remove('input-error');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.style.opacity = '0.6';
        }
        if (feedbackEl) {
          feedbackEl.textContent = 'Subscribing...';
          feedbackEl.className = 'newsletter-feedback';
        }

        try {
          const resp = await fetch('/api/newsletter/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });

          let data = {};
          try {
            data = await resp.json();
          } catch (_) {}

          if (resp.ok && data.success) {
            if (data.alreadySubscribed) {
              if (feedbackEl) {
                feedbackEl.textContent = data.message || 'You are already subscribed to Finculator updates!';
                feedbackEl.className = 'newsletter-feedback success';
              }
              if (this.app && this.app.showToast) {
                this.app.showToast('ℹ️ You are already subscribed to Finculator intelligence!');
              }
            } else {
              if (feedbackEl) {
                feedbackEl.textContent = data.message || 'Subscribed! You will receive interest rate and wealth intelligence.';
                feedbackEl.className = 'newsletter-feedback success';
              }
              emailInput.value = '';
              if (this.app && this.app.showToast) {
                this.app.showToast('🎉 Successfully subscribed to Finculator Intelligence!');
              }
            }
          } else {
            const errorMsg = data.error || 'Subscription failed. Please check your email and try again.';
            if (group) group.classList.add('input-error');
            if (feedbackEl) {
              feedbackEl.textContent = errorMsg;
              feedbackEl.className = 'newsletter-feedback error';
            }
          }
        } catch (err) {
          // Fallback to local storage for offline / static demonstration
          try {
            const localSubs = JSON.parse(localStorage.getItem('finculator_newsletter_subscribers') || '[]');
            if (!localSubs.includes(email)) {
              localSubs.push(email);
              localStorage.setItem('finculator_newsletter_subscribers', JSON.stringify(localSubs));
            }
            if (feedbackEl) {
              feedbackEl.textContent = 'Subscribed! You will receive interest rate and wealth intelligence.';
              feedbackEl.className = 'newsletter-feedback success';
            }
            emailInput.value = '';
            if (this.app && this.app.showToast) {
              this.app.showToast('🎉 Successfully subscribed to Finculator Intelligence!');
            }
          } catch (localErr) {
            if (feedbackEl) {
              feedbackEl.textContent = 'Unable to subscribe right now. Please try again later.';
              feedbackEl.className = 'newsletter-feedback error';
            }
          }
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
          }
        }
      });;
    }

    // If instantiated on the landing page, clicking a calculator link unlocks workspace
    if (this.isLanding) {
      const navLinks = this.container.querySelectorAll('.footer-links a, .footer-legal-link');
      navLinks.forEach(link => {
        link.addEventListener('click', () => {
          const href = link.getAttribute('href');
          if (href && href.startsWith('#/')) {
            sessionStorage.setItem('finculator_guest_access', 'true');
            if (this.app && this.app.landingGate) {
              this.app.landingGate.unlock();
            }
          }
        });
      });
    }
  }
}
