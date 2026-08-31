/**
 * Finculator Application Coordinator & Router (v2.3)
 * Full 5 Category / 20+ Financial Calculator Engine
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

class FinculatorApp {
  constructor() {
    this.contentContainer = document.getElementById('main-content');
    this.currencySelect = document.getElementById('global-currency-select');
    this.navLinks = document.querySelectorAll('.nav-item');
    this.mobileMenuBtn = document.getElementById('mobile-menu-btn');
    this.sidebar = document.getElementById('app-sidebar');
    this.sidebarBackdrop = document.getElementById('sidebar-backdrop');
    this.printBtn = document.getElementById('btn-global-print');

    this.currentRoute = 'emi';
    this.init();
  }

  init() {
    this.initCurrency();
    this.initNavigation();
    this.initMobileMenu();
    this.initPrint();
    this.handleRoute();
  }

  initCurrency() {
    const savedCurrency = getStoredState('global_currency', 'USD');
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
}

// Instantiate on DOM load
document.addEventListener('DOMContentLoaded', () => {
  window.Finculator = new FinculatorApp();
});
