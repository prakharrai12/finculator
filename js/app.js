/**
 * Finculator Application Coordinator & Router (v2.4)
 * Full 5 Category / 20+ Financial Calculator Engine + FinBot AI Controller
 */

import { setGlobalCurrency, getGlobalCurrency } from './utils/formatters.js';
import { getStoredState, setStoredState } from './utils/storage.js';

// Loan Suite
import { initEMICalculator } from './calculators/emiCalculator.js';
import { initPrepaymentAnalyzer } from './calculators/prepaymentAnalyzer.js';
import { initLoanComparator } from './calculators/loanComparator.js';
import { initLoanEligibility } from './calculators/loanEligibility.js';
import { initCreditCardCalculator } from './calculators/creditCardCalculator.js';

// Savings & Deposits Suite
import { initSavingsDepositsSuite } from './calculators/savingsDepositsSuite.js';

// Wealth & Investing Suite
import { initInvestmentSuite } from './calculators/investmentSuite.js';

// Tax & Business Suite
import { initTaxBusinessSuite } from './calculators/taxBusinessSuite.js';

// Long-Term Planning Suite
import { initFIRECalculator } from './calculators/fireCalculator.js';
import { initInflationCalculator } from './calculators/inflationCalculator.js';
import { initNetWorthCalculator } from './calculators/netWorthCalculator.js';
import { initBudgetPlanner } from './calculators/budgetPlanner.js';
import { initBuyVsRentCalculator } from './calculators/buyVsRentCalculator.js';

// AI Copilot, Portfolio Builder, Auth & Landing Gate
import { FinBot } from './components/chatbot.js';
import { PortfolioModal } from './components/portfolioModal.js';
import { AuthModal } from './components/authModal.js';
import { HeroLandingGate } from './components/heroLandingGate.js';

class FinculatorApp {
  constructor() {
    this.contentContainer = document.getElementById('main-content');
    this.currencySelect = document.getElementById('global-currency-select');
    this.navLinks = document.querySelectorAll('.nav-item');
    this.mobileMenuBtn = document.getElementById('mobile-menu-btn');
    this.sidebar = document.getElementById('app-sidebar');
    this.sidebarBackdrop = document.getElementById('sidebar-backdrop');
    this.printBtn = document.getElementById('btn-global-print');
    this.portfolioBtn = document.getElementById('btn-open-portfolio');

    this.currentRoute = 'emi';
    this.authModal = new AuthModal(this);
    this.landingGate = new HeroLandingGate(this);
    this.finbot = new FinBot(this);
    this.portfolio = new PortfolioModal(this);

    this.init();
    this.initPortfolioButton();
    this.initHomeButton();
  }

  initPortfolioButton() {
    if (this.portfolioBtn) {
      this.portfolioBtn.addEventListener('click', () => {
        if (this.portfolio) this.portfolio.toggle(true);
      });
    }
  }

  initHomeButton() {
    const homeBtn = document.getElementById('btn-header-home');
    if (homeBtn) {
      homeBtn.addEventListener('click', () => {
        if (this.portfolio && this.portfolio.isOpen) {
          this.portfolio.toggle(false);
        }
        if (this.landingGate) {
          this.landingGate.showLanding();
        }
      });
    }
  }

  init() {
    this.initCurrency();
    this.initNavigation();
    this.initMobileMenu();
    this.initPrint();
    this.initFooterEvents();
    this.handleRoute();
  }

  initCurrency() {
    const savedCurrency = getStoredState('global_currency', 'INR');
    if (this.currencySelect) {
      this.currencySelect.value = savedCurrency;
      setGlobalCurrency(savedCurrency);

      this.currencySelect.addEventListener('change', (e) => {
        const code = e.target.value;
        setGlobalCurrency(code);
        setStoredState('global_currency', code);
        this.renderCurrentCalculator();
      });
    }
  }

  initNavigation() {
    window.addEventListener('hashchange', () => {
      this.handleRoute();
      this.closeMobileMenu();
    });
  }

  initMobileMenu() {
    if (this.mobileMenuBtn && this.sidebar && this.sidebarBackdrop) {
      this.mobileMenuBtn.addEventListener('click', () => {
        this.sidebar.classList.toggle('open');
        this.sidebarBackdrop.classList.toggle('open');
      });

      this.sidebarBackdrop.addEventListener('click', () => {
        this.closeMobileMenu();
      });
    }
  }

  closeMobileMenu() {
    if (this.sidebar) this.sidebar.classList.remove('open');
    if (this.sidebarBackdrop) this.sidebarBackdrop.classList.remove('open');
  }

  initPrint() {
    if (this.printBtn) {
      this.printBtn.addEventListener('click', () => {
        window.print();
      });
    }
  }

  initFooterEvents() {
    // Back to Top Smooth Scroll
    const backToTopBtn = document.getElementById('footer-back-to-top');
    if (backToTopBtn) {
      backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Functional Newsletter Subscription
    const newsletterForm = document.getElementById('footer-newsletter-form');
    const emailInput = document.getElementById('newsletter-email-input');
    const feedbackEl = document.getElementById('newsletter-feedback');
    const submitBtn = document.getElementById('newsletter-submit-btn');

    if (newsletterForm && emailInput) {
      // Clear error styling on input change
      emailInput.addEventListener('input', () => {
        const inputGroup = emailInput.closest('.newsletter-input-group');
        if (inputGroup) inputGroup.classList.remove('input-error');
        if (feedbackEl && feedbackEl.classList.contains('error')) {
          feedbackEl.textContent = '';
          feedbackEl.className = 'newsletter-feedback';
        }
      });

      newsletterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim().toLowerCase();
        const inputGroup = emailInput.closest('.newsletter-input-group');

        // Email regex pattern validation
        const emailPattern = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
        if (!email || !emailPattern.test(email)) {
          if (inputGroup) inputGroup.classList.add('input-error');
          if (feedbackEl) {
            feedbackEl.textContent = 'Please enter a valid email address (e.g. name@example.com).';
            feedbackEl.className = 'newsletter-feedback error';
          }
          emailInput.focus();
          return;
        }

        // Processing state
        if (inputGroup) inputGroup.classList.remove('input-error');
        if (submitBtn) submitBtn.disabled = true;
        if (feedbackEl) {
          feedbackEl.textContent = 'Subscribing...';
          feedbackEl.className = 'newsletter-feedback';
        }

        try {
          const response = await fetch('/api/newsletter/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });

          let data = {};
          try {
            data = await response.json();
          } catch (_) {}

          if (response.ok && data.success) {
            if (feedbackEl) {
              feedbackEl.textContent = data.message || 'Subscribed! You will receive interest rate and wealth intelligence.';
              feedbackEl.className = 'newsletter-feedback success';
            }
            this.showToast(data.alreadySubscribed 
              ? 'ℹ️ You are already subscribed to Finculator intelligence!' 
              : '🎉 Successfully subscribed to Finculator Intelligence!');
            emailInput.value = '';
          } else {
            const errorMsg = data.error || 'Subscription failed. Please check your email and try again.';
            if (inputGroup) inputGroup.classList.add('input-error');
            if (feedbackEl) {
              feedbackEl.textContent = errorMsg;
              feedbackEl.className = 'newsletter-feedback error';
            }
          }
        } catch (err) {
          // Offline / Static Server Fallback
          try {
            const stored = JSON.parse(localStorage.getItem('finculator_newsletter_subscribers') || '[]');
            if (!stored.includes(email)) {
              stored.push(email);
              localStorage.setItem('finculator_newsletter_subscribers', JSON.stringify(stored));
            }
            if (feedbackEl) {
              feedbackEl.textContent = 'Subscribed! You will receive interest rate and wealth intelligence.';
              feedbackEl.className = 'newsletter-feedback success';
            }
            this.showToast('🎉 Successfully subscribed to Finculator Intelligence!');
            emailInput.value = '';
          } catch (_) {
            if (feedbackEl) {
              feedbackEl.textContent = 'Unable to subscribe right now. Please try again later.';
              feedbackEl.className = 'newsletter-feedback error';
            }
          }
        } finally {
          if (submitBtn) submitBtn.disabled = false;
        }
      });
    }
  }

  showToast(message) {
    const toast = document.getElementById('app-toast');
    if (toast) {
      toast.textContent = message;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 3000);
    }
  }

  handleRoute() {
    const rawHash = window.location.hash.slice(2) || 'emi';

    if (rawHash === 'login' || rawHash === 'signin') {
      if (this.authModal) this.authModal.open('signin');
      return;
    } else if (rawHash === 'register' || rawHash === 'signup') {
      if (this.authModal) this.authModal.open('signup');
      return;
    } else if (rawHash === 'credentials') {
      if (this.authModal) this.authModal.open('credentials');
      return;
    } else if (rawHash === 'inbox') {
      if (this.authModal) this.authModal.open('inbox');
      return;
    }

    this.currentRoute = rawHash;

    // Update active nav link
    this.navLinks.forEach((link) => {
      const route = link.getAttribute('data-route');
      if (route === rawHash) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    this.renderCurrentCalculator();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  renderCurrentCalculator() {
    if (!this.contentContainer) return;
    this.contentContainer.innerHTML = '';

    const route = this.currentRoute;

    // 1. Loans & Mortgages
    if (route === 'emi') {
      initEMICalculator(this.contentContainer);
    } else if (route === 'prepayment') {
      initPrepaymentAnalyzer(this.contentContainer);
    } else if (route === 'comparator') {
      initLoanComparator(this.contentContainer);
    } else if (route === 'eligibility') {
      initLoanEligibility(this.contentContainer);
    } else if (route === 'credit-card') {
      initCreditCardCalculator(this.contentContainer);
    }
    // 2. Savings & Deposits (routes map into suite with tab preset)
    else if (route.startsWith('savings-')) {
      const tab = route.replace('savings-', '');
      const state = getStoredState('savings_deposits', {});
      state.activeTab = tab;
      setStoredState('savings_deposits', state);
      initSavingsDepositsSuite(this.contentContainer);
    }
    // 3. Wealth & Investing
    else if (route.startsWith('invest-')) {
      const tab = route.replace('invest-', '');
      const state = getStoredState('investments', {});
      state.activeTab = tab;
      setStoredState('investments', state);
      initInvestmentSuite(this.contentContainer);
    }
    // 4. Tax & Business
    else if (route.startsWith('tax-')) {
      const tab = route.replace('tax-', '');
      const state = getStoredState('tax_business', {});
      state.activeTab = tab;
      setStoredState('tax_business', state);
      initTaxBusinessSuite(this.contentContainer);
    }
    // 5. Long-Term Planning
    else if (route === 'fire') {
      initFIRECalculator(this.contentContainer);
    } else if (route === 'inflation') {
      initInflationCalculator(this.contentContainer);
    } else if (route === 'net-worth') {
      initNetWorthCalculator(this.contentContainer);
    } else if (route === 'budget') {
      initBudgetPlanner(this.contentContainer);
    } else if (route === 'buy-vs-rent') {
      initBuyVsRentCalculator(this.contentContainer);
    } else {
      // Fallback
      initEMICalculator(this.contentContainer);
    }
  }

  navigateTo(target) {
    if (target === 'portfolio' || target === 'my-portfolio') {
      if (this.portfolio) this.portfolio.toggle(true);
      return;
    }

    let normalized = target;
    if (target === 'taxes' || target === 'tax') normalized = 'tax-income';
    else if (target === 'investments' || target === 'invest' || target === 'sip') normalized = 'invest-sip';
    else if (target === 'savings' || target === 'deposits') normalized = 'savings-compound';
    
    window.location.hash = `#/${normalized}`;
  }
}

// Instantiate on DOM load
document.addEventListener('DOMContentLoaded', () => {
  window.Finculator = new FinculatorApp();
});
