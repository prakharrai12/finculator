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

// AI Copilot & Portfolio Builder
import { FinBot } from './components/chatbot.js';
import { PortfolioModal } from './components/portfolioModal.js';

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
    this.init();
    this.finbot = new FinBot(this);
    this.portfolio = new PortfolioModal(this);
    this.initPortfolioButton();
  }

  initPortfolioButton() {
    if (this.portfolioBtn) {
      this.portfolioBtn.addEventListener('click', () => {
        if (this.portfolio) this.portfolio.toggle(true);
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
    // Copy Email to Clipboard
    const copyEmailBtn = document.getElementById('footer-copy-email-btn');
    const emailLabel = document.getElementById('footer-email-label');
    if (copyEmailBtn && emailLabel) {
      copyEmailBtn.addEventListener('click', async () => {
        const email = copyEmailBtn.getAttribute('data-email') || 'prakharrai12@gmail.com';
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(email);
          } else {
            const temp = document.createElement('textarea');
            temp.value = email;
            document.body.appendChild(temp);
            temp.select();
            document.execCommand('copy');
            temp.remove();
          }

          emailLabel.textContent = 'Copied to Clipboard!';
          this.showToast(`Email ${email} copied to clipboard!`);

          setTimeout(() => {
            emailLabel.textContent = email;
          }, 2400);
        } catch (err) {
          this.showToast(`Contact: ${email}`);
        }
      });
    }

    // Back to Top Button
    const backToTopBtn = document.getElementById('footer-back-to-top');
    if (backToTopBtn) {
      backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Newsletter Subscribe Form
    const newsletterForm = document.getElementById('footer-newsletter-form');
    if (newsletterForm) {
      newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('newsletter-email-input');
        if (input && input.value) {
          this.showToast('Subscribed to Finculator institutional intelligence updates!');
          input.value = '';
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
