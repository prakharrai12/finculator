/**
 * Finculator AI Financial Assistant & Site Controller ("FinBot")
 * Institutional Knowledge Engine & Automated Site Navigator
 */

export class FinBot {
  constructor(app) {
    this.app = app;
    this.isOpen = false;
    this.history = [];
    this.init();
  }

  init() {
    this.createDOM();
    this.attachEvents();
    this.addBotMessage(
      "Hello! I am **FinBot**, your institutional financial intelligence assistant. Ask me about any financial concept (FOIR, FIRE number, Tax Regimes, SIP vs Lump Sum, Amortization) or tell me what you want to calculate, and I'll explain it and navigate you directly to the right tool!"
    );
  }

  createDOM() {
    // Floating Launcher Button
    const launcher = document.createElement('button');
    launcher.id = 'finbot-launcher';
    launcher.className = 'finbot-launcher';
    launcher.setAttribute('aria-label', 'Open FinBot Financial AI Assistant');
    launcher.innerHTML = `
      <div class="finbot-launcher-pulse"></div>
      <div class="finbot-launcher-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"></path>
          <rect x="4" y="8" width="16" height="12" rx="4"></rect>
          <line x1="9" y1="13" x2="9.01" y2="13"></line>
          <line x1="15" y1="13" x2="15.01" y2="13"></line>
          <path d="M10 17h4"></path>
        </svg>
      </div>
      <span class="finbot-launcher-text">Ask FinBot</span>
    `;

    // Chat Drawer Window
    const drawer = document.createElement('div');
    drawer.id = 'finbot-drawer';
    drawer.className = 'finbot-drawer';
    drawer.innerHTML = `
      <div class="finbot-header">
        <div class="finbot-header-left">
          <div class="finbot-avatar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </div>
          <div>
            <div class="finbot-title">FinBot Intelligence</div>
            <div class="finbot-status"><span class="finbot-status-dot"></span> Online · Site Controller</div>
          </div>
        </div>
        <div class="finbot-header-actions">
          <button class="finbot-btn-icon" id="finbot-minimize-btn" title="Minimize Chat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>

      <!-- Quick Suggestion Prompts -->
      <div class="finbot-suggestions-bar" id="finbot-suggestions">
        <button class="finbot-chip" data-query="Which tax regime is better for ₹24 Lakhs salary?">Old vs New Tax</button>
        <button class="finbot-chip" data-query="How to reduce my home loan interest and tenure?">Prepay Loan</button>
        <button class="finbot-chip" data-query="How much loan can I get on ₹200k salary?">Loan Eligibility</button>
        <button class="finbot-chip" data-query="How does 50/30/20 budget work?">50/30/20 Budget</button>
        <button class="finbot-chip" data-query="What is FIRE and how to calculate retirement corpus?">FIRE Retirement</button>
        <button class="finbot-chip" data-query="SIP vs Lump Sum investment">SIP vs Lump Sum</button>
      </div>

      <!-- Messages Log -->
      <div class="finbot-messages" id="finbot-messages"></div>

      <!-- Input Bar -->
      <form class="finbot-input-form" id="finbot-form">
        <input
          type="text"
          id="finbot-input"
          class="finbot-input"
          placeholder="Ask a financial doubt or where to go..."
          autocomplete="off"
          required
        />
        <button type="submit" class="finbot-send-btn" aria-label="Send Message">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </form>
    `;

    document.body.appendChild(launcher);
    document.body.appendChild(drawer);

    this.launcher = launcher;
    this.drawer = drawer;
    this.messagesContainer = drawer.querySelector('#finbot-messages');
    this.input = drawer.querySelector('#finbot-input');
    this.form = drawer.querySelector('#finbot-form');
    this.minimizeBtn = drawer.querySelector('#finbot-minimize-btn');
    this.suggestions = drawer.querySelector('#finbot-suggestions');
  }

  attachEvents() {
    this.launcher.addEventListener('click', () => this.toggleChat());
    this.minimizeBtn.addEventListener('click', () => this.toggleChat(false));

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = this.input.value.trim();
      if (!query) return;
      this.input.value = '';
      this.handleUserQuery(query);
    });

    this.suggestions.addEventListener('click', (e) => {
      const chip = e.target.closest('.finbot-chip');
      if (chip) {
        const q = chip.getAttribute('data-query');
        this.handleUserQuery(q);
      }
    });

    // Delegation for Action Buttons inside chat bubbles
    this.messagesContainer.addEventListener('click', (e) => {
      const actionBtn = e.target.closest('.finbot-action-btn');
      if (actionBtn) {
        const route = actionBtn.getAttribute('data-route');
        if (route) {
          this.navigateToRoute(route);
        }
      }
    });
  }

  toggleChat(forceState) {
    this.isOpen = typeof forceState === 'boolean' ? forceState : !this.isOpen;
    if (this.isOpen) {
      this.drawer.classList.add('active');
      this.launcher.classList.add('active');
      this.input.focus();
      this.scrollToBottom();
    } else {
      this.drawer.classList.remove('active');
      this.launcher.classList.remove('active');
    }
  }

  addUserMessage(text) {
    const bubble = document.createElement('div');
    bubble.className = 'finbot-msg finbot-user-msg';
    bubble.textContent = text;
    this.messagesContainer.appendChild(bubble);
    this.scrollToBottom();
  }

  addBotMessage(markdownText, action = null) {
    const bubble = document.createElement('div');
    bubble.className = 'finbot-msg finbot-bot-msg';

    let html = this.formatMarkdown(markdownText);
    if (action) {
      html += `
        <div class="finbot-action-card">
          <div class="finbot-action-desc">${action.desc || 'Take me there now:'}</div>
          <button class="finbot-action-btn" data-route="${action.route}">
            <span>${action.label}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </button>
        </div>
      `;
    }

    bubble.innerHTML = html;
    this.messagesContainer.appendChild(bubble);
    this.scrollToBottom();
  }

  scrollToBottom() {
    setTimeout(() => {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }, 50);
  }

  formatMarkdown(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
  }

  navigateToRoute(route) {
    window.location.hash = `#/${route}`;
    const toast = document.getElementById('app-toast');
    if (toast) {
      toast.textContent = `Navigated to ${route.toUpperCase()} Calculator`;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2200);
    }
  }

  handleUserQuery(query) {
    this.addUserMessage(query);

    // Show typing indicator
    const typing = document.createElement('div');
    typing.className = 'finbot-msg finbot-bot-msg finbot-typing';
    typing.innerHTML = '<span>.</span><span>.</span><span>.</span>';
    this.messagesContainer.appendChild(typing);
    this.scrollToBottom();

    setTimeout(() => {
      typing.remove();
      const response = this.evaluateFinancialQuery(query.toLowerCase());
      this.addBotMessage(response.text, response.action);

      // If response requires immediate navigation
      if (response.autoNavigate && response.action?.route) {
        this.navigateToRoute(response.action.route);
      }
    }, 380);
  }

  evaluateFinancialQuery(q) {
    // 1. TAX (Old vs New Regime, Deductions, Slab rates)
    if (q.includes('tax') || q.includes('regime') || q.includes('80c') || q.includes('tds') || q.includes('deduction')) {
      if (q.includes('200k') || q.includes('24 lakh') || q.includes('24l') || q.includes('better')) {
        return {
          text: "For an annual salary of **₹24 Lakhs (₹200,000 / month)**:\n• **New Tax Regime** is typically better unless you claim more than ₹3.75–₹4 Lakhs in combined exemptions (HRA, 80C, 80D, home loan interest).\n• In the New Regime, standard deduction is **₹75,000** and tax slabs are concessional.\n• Let me open the **Income Tax (Old vs New)** calculator so you can compare exact liabilities side-by-side.",
          action: { label: 'Open Income Tax Calculator', route: 'tax-income', desc: 'Compare Old vs New Tax on ₹24L:' }
        };
      }
      return {
        text: "The **Income Tax Calculator** compares the Old and New tax regimes side-by-side under current Indian Finance Act rules. It factors in Section 80C, 80D, HRA, Standard Deduction (₹75k in New, ₹50k in Old), and 4% Health & Education Cess.",
        action: { label: 'Go to Income Tax Calculator', route: 'tax-income', desc: 'Evaluate your tax slabs:' }
      };
    }

    // 2. TAKE-HOME SALARY / IN-HAND PAY
    if (q.includes('salary') || q.includes('take home') || q.includes('in hand') || q.includes('ctc') || q.includes('paycheck')) {
      return {
        text: "To determine your **Net Monthly In-Hand Salary** from your Gross CTC:\n• We calculate Basic Salary (typically 40%-50%), Employee EPF (12%), Professional Tax (₹2,500/yr), and monthly TDS withholding.\n• For a **₹24 Lakh CTC (₹200k/mo)**, your net monthly take-home is approximately **₹1,60,000 / month**.",
        action: { label: 'Open Take-Home Salary Calculator', route: 'tax-salary', desc: 'Break down CTC into Net In-Hand:' }
      };
    }

    // 3. LOAN PREPAYMENT & TENURE CUT-OFF
    if (q.includes('prepay') || q.includes('save interest') || q.includes('early payoff') || q.includes('part payment') || q.includes('cut tenure')) {
      return {
        text: "Making prepayments directly reduces your **principal balance**, preventing compound interest from accumulating on that capital:\n• An extra monthly payment of even 5%-10%, or an annual 1-month bonus prepayment, can cut a 20-year home loan down to **13-14 years** and save **₹15 Lakhs+** in lifetime interest!",
        action: { label: 'Open Prepayment Analyzer', route: 'prepayment', desc: 'Calculate tenure & interest saved:' }
      };
    }

    // 4. LOAN ELIGIBILITY / BORROWING POWER / FOIR
    if (q.includes('eligib') || q.includes('foir') || q.includes('how much loan') || q.includes('borrow') || q.includes('dti')) {
      return {
        text: "**FOIR (Fixed Obligation to Income Ratio)** is the underwriting metric banks use to cap your maximum monthly debt.\n• Most banks allow up to **50% FOIR**. On a **₹200,000 / month** salary with ₹20,000 existing EMIs, your safe available EMI is **₹80,000 / month**.\n• At 8.5% interest for 20 years, you qualify for an estimated **₹92 Lakhs – ₹1.1 Crore** loan!",
        action: { label: 'Open Loan Eligibility Calculator', route: 'eligibility', desc: 'Calculate your borrowing capacity:' }
      };
    }

    // 5. EMI & LOAN REPAYMENT / AMORTIZATION
    if (q.includes('emi') || q.includes('mortgage') || q.includes('loan repayment') || q.includes('amortization') || q.includes('home loan')) {
      return {
        text: "The **EMI (Equated Monthly Installment)** formula is:\n`E = P × r × (1+r)^n / ((1+r)^n - 1)`\nFor a ₹50 Lakh home loan at 8.5% for 20 years, your monthly EMI is **₹43,391**. Early in the loan, 80%+ of each payment goes toward interest, while principal amortization accelerates in later years.",
        action: { label: 'Open EMI Calculator', route: 'emi', desc: 'See your full amortization step-down:' }
      };
    }

    // 6. LOAN COMPARATOR
    if (q.includes('compare loan') || q.includes('comparator') || q.includes('15 year vs 30') || q.includes('two loans') || q.includes('offers')) {
      return {
        text: "The **Loan Comparator** lets you evaluate up to 3 bank offers side-by-side. It computes monthly EMI, lifetime interest, and tags the **'Best Value (Lowest Lifetime Cost)'** automatically.",
        action: { label: 'Open Loan Comparator', route: 'comparator', desc: 'Compare 3 loan scenarios:' }
      };
    }

    // 7. CREDIT CARD DEBT / MINIMUM DUE TRAP
    if (q.includes('credit card') || q.includes('minimum due') || q.includes('debt trap') || q.includes('card interest') || q.includes('apr')) {
      return {
        text: "Paying only the **5% Minimum Due** on credit cards is a severe debt trap because cards compound at 36%-42% APR. A ₹50,000 balance paid via minimum dues takes over **14 years** and costs ₹80,000+ in interest! Switching to an accelerated fixed payment clears it in months.",
        action: { label: 'Open Credit Card Calculator', route: 'credit-card', desc: 'See payoff timeline & interest saved:' }
      };
    }

    // 8. SIP / MUTUAL FUNDS / STEP-UP
    if (q.includes('sip') || q.includes('mutual fund') || q.includes('step up') || q.includes('step-up') || q.includes('recurring invest')) {
      if (q.includes('step')) {
        return {
          text: "A **Step-Up SIP** increases your monthly contribution annually (e.g. +10% matching salary increments). Stepping up by 10% each year can yield **almost double the corpus** of a flat SIP over 15–20 years!",
          action: { label: 'Open Step-Up SIP Calculator', route: 'invest-stepup', desc: 'Model annual percentage step-ups:' }
        };
      }
      return {
        text: "A **SIP (Systematic Investment Plan)** compounds monthly investments using rupee-cost averaging. Investing **₹25,000 / month** at a historical 12% equity CAGR grows to **₹1.25 Crore** in 15 years, with ₹80 Lakhs coming purely from compounding gains!",
        action: { label: 'Open SIP Calculator', route: 'invest-sip', desc: 'Calculate wealth accumulation:' }
      };
    }

    // 9. LUMP SUM / COMPOUND INTEREST
    if (q.includes('lump') || q.includes('compound interest') || q.includes('fd') || q.includes('fixed deposit') || q.includes('ppf')) {
      if (q.includes('ppf')) {
        return {
          text: "**PPF (Public Provident Fund)** provides sovereign EEE tax exemption (Exempt on deposit, Exempt on interest, Exempt on maturity) with compounding for 15 years.",
          action: { label: 'Open PPF Calculator', route: 'savings-ppf', desc: 'Calculate 15-year tax-free returns:' }
        };
      }
      return {
        text: "The **Compound Interest Engine** computes exponential growth across Daily, Monthly, Quarterly, and Annual intervals: `A = P(1 + r/n)^(nt)`. Even a modest one-time lump sum doubles every 6 years at 12% annual return.",
        action: { label: 'Open Compound Interest Suite', route: 'savings-compound', desc: 'Test compounding frequencies:' }
      };
    }

    // 10. RETIREMENT & FIRE (Financial Independence, Retire Early)
    if (q.includes('fire') || q.includes('retire') || q.includes('pension') || q.includes('freedom') || q.includes('safe withdrawal')) {
      return {
        text: "**FIRE (Financial Independence, Retire Early)** targets are calculated using the 25x–30x expense rule based on a **3.5%–4.0% Safe Withdrawal Rate (SWR)**.\n• We model **Lean FIRE (75%)**, **Standard FIRE (100%)**, **Fat FIRE (130%)**, and **Coast FIRE** milestones, adjusted for inflation.",
        action: { label: 'Open Retirement & FIRE Engine', route: 'fire', desc: 'Map your retirement blueprint:' }
      };
    }

    // 11. BUDGET 50/30/20
    if (q.includes('budget') || q.includes('50/30/20') || q.includes('wants') || q.includes('needs') || q.includes('spend')) {
      return {
        text: "The **50/30/20 Rule** structures cash flow:\n• **50% Needs**: Housing, utilities, groceries, EMIs.\n• **30% Wants**: Leisure, dining, travel, shopping.\n• **20% Savings**: SIPs, mutual funds, emergency buffer.\nFor a ₹200k/month salary, that translates to ₹1,00,000 Needs, ₹60,000 Wants, and ₹40,000 Savings.",
        action: { label: 'Open 50/30/20 Budget Planner', route: 'budget', desc: 'Allocate monthly cash flows:' }
      };
    }

    // 12. INFLATION
    if (q.includes('inflation') || q.includes('purchasing power') || q.includes('future cost') || q.includes('cpi')) {
      return {
        text: "**Inflation** erodes purchasing power exponentially. At a standard 6% inflation rate, living expenses double every 12 years. The Inflation Adjuster calculates future equivalent costs and purchasing power degradation.",
        action: { label: 'Open Inflation Adjuster', route: 'inflation', desc: 'Calculate future purchasing power:' }
      };
    }

    // 13. BUY VS RENT
    if (q.includes('buy vs rent') || q.includes('rent vs buy') || q.includes('rent') || q.includes('homeownership')) {
      return {
        text: "The **Buy vs Rent Calculator** compares the long-term wealth of purchasing a home (down payment, mortgage interest, property tax, maintenance, and home appreciation) vs. renting and investing the surplus capital in the stock market over 10–30 years.",
        action: { label: 'Open Buy vs Rent Calculator', route: 'buy-vs-rent', desc: 'Analyze real estate vs equities:' }
      };
    }

    // 14. NET WORTH
    if (q.includes('net worth') || q.includes('assets') || q.includes('liabilities') || q.includes('wealth')) {
      return {
        text: "**Net Worth = Total Assets − Total Liabilities**. Tracking your liquid assets, real estate, provident funds, and subtracting outstanding debts reveals your financial solvency ratio.",
        action: { label: 'Open Net Worth Calculator', route: 'net-worth', desc: 'Audit your complete balance sheet:' }
      };
    }

    // 15. GST & BUSINESS (Margin, Break-even)
    if (q.includes('gst') || q.includes('margin') || q.includes('markup') || q.includes('break even') || q.includes('breakeven')) {
      if (q.includes('gst')) {
        return {
          text: "The **GST Calculator** supports standard slabs (5%, 12%, 18%, 28%) with **Add GST (Exclusive)** and **Remove GST (Inclusive)** modes, splitting taxes into CGST and SGST.",
          action: { label: 'Open GST Calculator', route: 'tax-gst', desc: 'Calculate GST additions/removals:' }
        };
      }
      return {
        text: "The **Profit Margin & Break-Even** modules compute gross margin %, markup on cost, contribution margin per unit, and the exact sales units needed to recover fixed overheads.",
        action: { label: 'Open Break-Even Calculator', route: 'tax-breakeven', desc: 'Determine business thresholds:' }
      };
    }

    // 16. GENERAL FALLBACK / GREETING
    if (q.includes('hi') || q.includes('hello') || q.includes('hey') || q.includes('who are you')) {
      return {
        text: "Hello! I am **FinBot**, your dedicated financial computation assistant. You can ask me:\n• *'How much loan can I get on 200k salary?'*\n• *'Should I choose Old or New tax regime?'*\n• *'How much will a ₹25,000 monthly SIP grow to?'*\n• *'Take me to loan prepayment'*\n• *'Explain FOIR or FIRE'*",
        action: { label: 'Explore Wealth Suite', route: 'invest-sip', desc: 'Start with Systematic Investment Plans:' }
      };
    }

    // Default intelligent guidance
    return {
      text: `I understand you are asking about **"${q}"**. Finculator includes 20+ specialized financial engines across Loans, Savings, Wealth, Taxes, and Long-Term Planning. What specific area would you like to explore?`,
      action: { label: 'View Loan Suite', route: 'emi', desc: 'Explore Loans & Mortgages:' }
    };
  }
}
