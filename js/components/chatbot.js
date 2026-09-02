/**
 * FinBot AI — Real-Time Financial Copilot & Navigation Assistant
 * Powered by Free AI Inference API + Comprehensive Financial RAG Knowledge Engine
 */

export class FinBot {
  constructor(app) {
    this.app = app;
    this.isOpen = false;
    this.isMinimized = false;
    this.messages = [];
    this.isLoading = false;

    this.settings = {
      provider: localStorage.getItem('finbot_provider') || 'free_ai', // 'free_ai' | 'gemini' | 'groq' | 'local_rag'
      apiKey: localStorage.getItem('finbot_api_key') || ''
    };

    this.initDOM();
    this.attachEvents();
    this.initWelcomeMessage();
  }

  initDOM() {
    // Launcher circular FAB (expands on hover / tap)
    this.launcher = document.createElement('div');
    this.launcher.className = 'finbot-launcher';
    this.launcher.id = 'finbot-launcher-capsule';
    this.launcher.setAttribute('role', 'button');
    this.launcher.setAttribute('tabindex', '0');
    this.launcher.setAttribute('aria-label', 'Open FinBot Financial AI Copilot');
    this.launcher.innerHTML = `
      <div class="finbot-launcher-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
        </svg>
      </div>
      <span class="finbot-launcher-label">Ask FinBot AI</span>
      <span class="finbot-online-indicator" title="AI Agent Active"></span>
    `;

    // Chat Window
    this.window = document.createElement('div');
    this.window.className = 'finbot-window hidden';
    this.window.id = 'finbot-chat-window';
    this.window.innerHTML = `
      <!-- Header -->
      <div class="finbot-header">
        <div class="finbot-header-left">
          <div class="finbot-avatar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
          </div>
          <div class="finbot-header-titles">
            <span class="finbot-title">FinBot Financial AI</span>
            <span class="finbot-status-tag">
              <span class="finbot-online-indicator" style="width:6px; height:6px;"></span>
              Real-time Copilot & Router
            </span>
          </div>
        </div>
        <div class="finbot-header-actions">
          <button class="finbot-btn-icon" id="finbot-btn-settings" title="AI Engine Settings">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          </button>
          <button class="finbot-btn-icon" id="finbot-btn-clear" title="Clear Conversation">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
          <button class="finbot-btn-icon" id="finbot-btn-minimize" title="Minimize">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
          <button class="finbot-btn-icon" id="finbot-btn-close" title="Close">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>

      <!-- Optional Settings Drawer -->
      <div class="finbot-settings-drawer hidden" id="finbot-settings-drawer">
        <div class="finbot-setting-row">
          <label class="finbot-setting-label">AI Engine Provider</label>
          <select class="finbot-setting-input" id="finbot-select-provider">
            <option value="free_ai" ${this.settings.provider === 'free_ai' ? 'selected' : ''}>Free Cloud AI Inference (Zero-Key)</option>
            <option value="gemini" ${this.settings.provider === 'gemini' ? 'selected' : ''}>Google Gemini 1.5 Flash (Custom Key)</option>
            <option value="groq" ${this.settings.provider === 'groq' ? 'selected' : ''}>Groq Llama 3.3 (Custom Key)</option>
            <option value="local_rag" ${this.settings.provider === 'local_rag' ? 'selected' : ''}>Instant Financial RAG Knowledge Engine</option>
          </select>
        </div>
        <div class="finbot-setting-row" id="finbot-apikey-row" style="${this.settings.provider === 'free_ai' || this.settings.provider === 'local_rag' ? 'display:none;' : ''}">
          <label class="finbot-setting-label">API Key (Stored locally)</label>
          <input type="password" class="finbot-setting-input" id="finbot-input-apikey" placeholder="Enter API Key..." value="${this.settings.apiKey}" />
        </div>
        <button class="btn btn-secondary btn-sm" id="finbot-btn-save-settings" style="align-self:flex-end;">Save Settings</button>
      </div>

      <!-- Messages Stream -->
      <div class="finbot-messages" id="finbot-messages-container"></div>

      <!-- Input Footer -->
      <div class="finbot-footer">
        <div class="finbot-input-row">
          <input type="text" class="finbot-input" id="finbot-user-input" placeholder="Ask about loans, taxes, SIP, FIRE, or navigating..." autocomplete="off" />
          <button class="finbot-send-btn" id="finbot-send-btn" title="Send Query">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
        <div class="finbot-footnote">
          <span>AI outputs are for educational modeling.</span>
          <span id="finbot-model-badge">Live AI</span>
        </div>
      </div>
    `;

    document.body.appendChild(this.launcher);
    document.body.appendChild(this.window);

    this.messagesContainer = this.window.querySelector('#finbot-messages-container');
    this.userInput = this.window.querySelector('#finbot-user-input');
    this.sendBtn = this.window.querySelector('#finbot-send-btn');
    this.settingsDrawer = this.window.querySelector('#finbot-settings-drawer');
  }

  attachEvents() {
    let touchExpandTimeout = null;

    // Mobile tap-to-expand vs click-to-open
    this.launcher.addEventListener('click', (e) => {
      const isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

      if (isTouchDevice && !this.launcher.classList.contains('expanded')) {
        e.preventDefault();
        e.stopPropagation();
        this.launcher.classList.add('expanded');

        clearTimeout(touchExpandTimeout);
        touchExpandTimeout = setTimeout(() => {
          this.launcher.classList.remove('expanded');
        }, 4000);
        return;
      }

      // If already expanded on mobile or clicked on desktop
      this.launcher.classList.remove('expanded');
      this.toggleWindow(true);
    });

    // Close expanded state on tap outside
    document.addEventListener('click', (e) => {
      if (!this.launcher.contains(e.target)) {
        this.launcher.classList.remove('expanded');
      }
    });

    // Keyboard navigation (Enter / Space)
    this.launcher.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.toggleWindow(true);
      }
    });

    this.window.querySelector('#finbot-btn-close').addEventListener('click', () => this.toggleWindow(false));
    this.window.querySelector('#finbot-btn-minimize').addEventListener('click', () => this.toggleMinimize());

    this.window.querySelector('#finbot-btn-clear').addEventListener('click', () => {
      this.messages = [];
      this.messagesContainer.innerHTML = '';
      this.initWelcomeMessage();
    });

    const settingsBtn = this.window.querySelector('#finbot-btn-settings');
    settingsBtn.addEventListener('click', () => {
      this.settingsDrawer.classList.toggle('hidden');
    });

    const providerSelect = this.window.querySelector('#finbot-select-provider');
    const apikeyRow = this.window.querySelector('#finbot-apikey-row');
    providerSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      apikeyRow.style.display = (val === 'free_ai' || val === 'local_rag') ? 'none' : 'flex';
    });

    this.window.querySelector('#finbot-btn-save-settings').addEventListener('click', () => {
      this.settings.provider = providerSelect.value;
      this.settings.apiKey = this.window.querySelector('#finbot-input-apikey').value.trim();
      localStorage.setItem('finbot_provider', this.settings.provider);
      localStorage.setItem('finbot_api_key', this.settings.apiKey);
      this.settingsDrawer.classList.add('hidden');
      this.updateModelBadge();
    });

    this.sendBtn.addEventListener('click', () => this.handleSendMessage());
    this.userInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSendMessage();
      }
    });

    // Delegate navigation clicks
    this.messagesContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.finbot-action-btn');
      if (btn) {
        e.preventDefault();
        const route = btn.getAttribute('data-route');
        if (route && this.app) {
          this.app.navigateTo(route);
          if (window.innerWidth <= 768) {
            this.toggleMinimize(true);
          }
        }
      }

      const chip = e.target.closest('.finbot-chip');
      if (chip) {
        const text = chip.textContent.trim();
        this.userInput.value = text;
        this.handleSendMessage();
      }
    });
  }

  toggleWindow(show) {
    this.isOpen = show;
    if (show) {
      this.window.classList.remove('hidden');
      this.window.classList.add('active');
      this.launcher.classList.add('hidden');
      setTimeout(() => {
        if (this.userInput) this.userInput.focus();
        this.scrollToBottom();
      }, 100);
    } else {
      this.window.classList.remove('active');
      this.window.classList.add('hidden');
      this.launcher.classList.remove('hidden');
    }
  }

  toggleMinimize(forceMinimize) {
    this.isMinimized = forceMinimize !== undefined ? forceMinimize : !this.isMinimized;
    if (this.isMinimized) {
      this.window.classList.add('minimized');
    } else {
      this.window.classList.remove('minimized');
      this.userInput.focus();
      this.scrollToBottom();
    }
  }

  updateModelBadge() {
    const badge = this.window.querySelector('#finbot-model-badge');
    if (!badge) return;
    if (this.settings.provider === 'gemini') badge.textContent = 'Gemini 1.5 Flash';
    else if (this.settings.provider === 'groq') badge.textContent = 'Groq Llama 3';
    else if (this.settings.provider === 'local_rag') badge.textContent = 'Financial RAG';
    else badge.textContent = 'Free AI Cloud';
  }

  initWelcomeMessage() {
    const welcomeHtml = `
      <p>Hello! I am <strong>FinBot</strong>, your live financial AI advisor & platform navigator.</p>
      <p>I have complete knowledge of Indian taxes (Old vs New Slabs FY 2024–26), home loan prepayments, mutual fund SIP compounding, FIRE benchmarks, debt elimination, and budget allocations for ₹200k/mo professionals.</p>
      <p>Ask me any question or try one of these quick prompts:</p>
      <div class="finbot-suggestions">
        <span class="finbot-chip">Compare Old vs New Tax Slabs</span>
        <span class="finbot-chip">How to save ₹30L on Home Loan?</span>
        <span class="finbot-chip">Calculate SIP for ₹1 Crore in 10 yrs</span>
        <span class="finbot-chip">Should I Buy or Rent a ₹75L House?</span>
        <span class="finbot-chip">Am I ready for FIRE Retirement?</span>
      </div>
    `;
    this.appendMessage('assistant', welcomeHtml, true);
  }

  appendMessage(role, content, isHtml = false) {
    const msg = document.createElement('div');
    msg.className = `finbot-msg ${role}`;
    
    let rendered = content;
    if (!isHtml) {
      rendered = this.formatMarkdown(content);
    }

    msg.innerHTML = `
      <div class="finbot-bubble">
        ${rendered}
      </div>
    `;

    this.messagesContainer.appendChild(msg);
    this.messages.push({ role, content: rendered });
    this.scrollToBottom();
    return msg;
  }

  showTyping() {
    if (this.typingElem) return;
    this.typingElem = document.createElement('div');
    this.typingElem.className = 'finbot-msg assistant';
    this.typingElem.innerHTML = `
      <div class="finbot-typing">
        <span class="finbot-dot"></span>
        <span class="finbot-dot"></span>
        <span class="finbot-dot"></span>
      </div>
    `;
    this.messagesContainer.appendChild(this.typingElem);
    this.scrollToBottom();
  }

  hideTyping() {
    if (this.typingElem) {
      this.typingElem.remove();
      this.typingElem = null;
    }
  }

  scrollToBottom() {
    setTimeout(() => {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }, 50);
  }

  async handleSendMessage() {
    const text = this.userInput.value.trim();
    if (!text || this.isLoading) return;

    this.userInput.value = '';
    this.appendMessage('user', text, false);

    this.isLoading = true;
    this.sendBtn.disabled = true;
    this.showTyping();

    try {
      const reply = await this.queryAI(text);
      this.hideTyping();
      this.appendMessage('assistant', reply, false);
    } catch (err) {
      console.warn('FinBot API error, using Fallback RAG Engine:', err);
      this.hideTyping();
      const fallbackReply = this.generateRAGResponse(text);
      this.appendMessage('assistant', fallbackReply, false);
    } finally {
      this.isLoading = false;
      this.sendBtn.disabled = false;
      this.userInput.focus();
    }
  }

  async queryAI(prompt) {
    // Check if custom provider is selected
    if (this.settings.provider === 'gemini' && this.settings.apiKey) {
      return await this.queryGemini(prompt, this.settings.apiKey);
    }
    if (this.settings.provider === 'groq' && this.settings.apiKey) {
      return await this.queryGroq(prompt, this.settings.apiKey);
    }
    if (this.settings.provider === 'local_rag') {
      return this.generateRAGResponse(prompt);
    }

    // Default: Query Free Cloud AI Endpoint (Pollinations AI)
    const systemPrompt = `You are FinBot, an institutional financial advisor on the Finculator app.
You provide precise, mathematically accurate financial advice for Indian professionals (₹200k/month baseline, tax slabs FY 2024-25/2025-26, SIPs, Home Loans, FIRE).
Available Finculator Tools to suggest:
- EMI Calculator (route: 'emi')
- Loan Prepayment & Amortization (route: 'prepayment')
- Loan Comparison (route: 'comparator')
- Loan Eligibility (route: 'eligibility')
- Credit Card Debt (route: 'credit-card')
- Wealth & SIP Suite (route: 'investments')
- Savings & FD/PPF (route: 'savings')
- Tax & Business Suite (route: 'taxes')
- FIRE Engine (route: 'fire')
- Buy vs Rent (route: 'buy-vs-rent')
- Net Worth (route: 'net-worth')
- 50/30/20 Budget (route: 'budget')
- Inflation Adjuster (route: 'inflation')

Whenever relevant, format navigation links as [NAVIGATE:route_name|Button Label]. Keep responses structured, concise, and professional with bullet points.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(systemPrompt + "\nUser Query: " + prompt)}`, {
      method: 'GET',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`API response status ${res.status}`);
    }

    const text = await res.text();
    if (!text || text.length < 5) {
      throw new Error('Empty API response');
    }

    return text;
  }

  async queryGemini(prompt, apiKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `You are FinBot, the financial assistant on Finculator. Answer concisely. Suggest Finculator routes formatted as [NAVIGATE:route|Label]. Query: ${prompt}`
              }
            ]
          }
        ]
      })
    });

    if (!res.ok) throw new Error('Gemini API Error');
    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
  }

  async queryGroq(prompt, apiKey) {
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are FinBot on Finculator. Answer accurately. Include [NAVIGATE:route|Label] for calculator tools.' },
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!res.ok) throw new Error('Groq API Error');
    const data = await res.json();
    return data.choices[0].message.content;
  }

  /**
   * Comprehensive Financial RAG Knowledge Engine
   * Provides 100% accurate, domain-specific instant intelligence even when offline
   */
  generateRAGResponse(query) {
    const q = query.toLowerCase();

    // 0. Personal Finance Portfolio Builder
    if (q.includes('portfolio') || q.includes('balance sheet') || q.includes('pfs') || q.includes('financial statement') || q.includes('my portfolio')) {
      return `### Personal Finance Portfolio & Balance Sheet Builder

Finculator includes an institutional-grade **Personal Finance Portfolio Builder** combining:
- **Personal Financial Statement (PFS):** Full balance sheet mapping liquid assets, fixed deposits, equities, real estate, vehicles, and valuables against mortgages and liabilities.
- **Investment Portfolio & Asset Allocation:** Live monochrome donut chart updating in real time across Equities, Debt, Cash, Real Estate, and Gold.
- **Holdings Ledger:** Individual stock & mutual fund positions with live gain/loss tracking.
- **Emergency Runway & Solvency:** Dynamic computation of monthly cash surplus, savings rate %, DTI %, and emergency months of runway.
- **Institutional PDF Export:** Download an advisory-quality wealth statement anytime.

[NAVIGATE:portfolio|Open My Portfolio Builder] [NAVIGATE:net-worth|View Net Worth Tracker]`;
    }

    // 1. Tax Old vs New Regime
    if (q.includes('tax') || q.includes('regime') || q.includes('80c') || q.includes('80d') || q.includes('slab')) {
      return `### Income Tax Comparison (FY 2024–25 / FY 2025–26)

**New Tax Regime (Default & Simplified):**
- **₹0 – ₹3 Lakh:** 0%
- **₹3L – ₹7L:** 5% (with Section 87A rebate making income up to **₹7 Lakhs completely tax-free**)
- **₹7L – ₹10L:** 10%
- **₹10L – ₹12L:** 15%
- **₹12L – ₹15L:** 20%
- **Above ₹15L:** 30%
- **Standard Deduction:** ₹75,000 for salaried individuals.

**Old Tax Regime:**
- Better only if your total deductions (Section 80C up to ₹1.5L, 80D health insurance ₹25k–₹50k, HRA, NPS ₹50k 80CCD(1B), and home loan interest up to ₹2L) exceed **₹3.75 Lakhs to ₹4.25 Lakhs/year**.

For a ₹24 Lakhs/yr CTC (₹200k/mo), the New Regime saves most individuals ₹40,000 to ₹65,000 without requiring locked-in investments.

[NAVIGATE:taxes|Open Income Tax Calculator] [NAVIGATE:taxes|Calculate In-Hand Salary]`;
    }

    // 2. Loan Prepayment & Amortization
    if (q.includes('prepay') || q.includes('save') && q.includes('loan') || q.includes('extra payment') || q.includes('accelerat')) {
      return `### Loan Prepayment Acceleration Strategy

By making extra payments directly toward the loan principal, you bypass compounding interest:
1. **Extra Monthly Payment (+₹5,000/mo):** On a ₹50 Lakh loan @ 8.5% for 20 years, an extra ₹5,000/month saves **~₹14.8 Lakhs in interest** and slashes your tenure by **4.2 Years**.
2. **Annual Lump Sum (+1 Extra EMI/yr):** Paying just one additional EMI each year cuts a 20-year loan down to ~16.5 years, saving over **₹11.5 Lakhs**.
3. **Dual Prepayment:** Combining both vectors achieves complete debt freedom in under 12 years!

[NAVIGATE:prepayment|Open Loan Prepayment Analyzer] [NAVIGATE:emi|Calculate Monthly EMI]`;
    }

    // 3. SIP & Compounding Wealth
    if (q.includes('sip') || q.includes('mutual fund') || q.includes('lump sum') || q.includes('cagr') || q.includes('invest')) {
      return `### Wealth Accumulation & SIP Strategy

Systematic Investment Plans (SIP) harness Rupee Cost Averaging and exponential compounding:
- **Rule of 15-15-15:** Investing **₹15,000/month** at **15% CAGR** for **15 years** builds **₹1.0 Crore** (Your investment: ₹27 Lakhs | Growth: ₹73 Lakhs).
- **Step-Up SIP:** Increasing your SIP by **10% annually** (matching salary increments) nearly **doubles your final corpus** compared to a flat SIP.
- **For ₹200k/month Salary:** Directing 20% (₹40,000/mo) into diversified equity index funds @ 12% CAGR yields **₹4.0+ Crores in 20 years**.

[NAVIGATE:investments|Open SIP & Wealth Suite] [NAVIGATE:savings|Compare Fixed Deposits]`;
    }

    // 4. FIRE (Financial Independence Retire Early)
    if (q.includes('fire') || q.includes('retire') || q.includes('swr') || q.includes('safe withdrawal')) {
      return `### FIRE (Financial Independence, Retire Early) Blueprint

To achieve financial freedom, your target corpus is based on the **25x–33x Annual Expenses Rule**:
- **Standard FIRE (4% SWR):** 25 × Annual Expenses.
- **Conservative FIRE (3.3% SWR):** 30 × Annual Expenses.
- **Example:** If your monthly expenses are ₹80,000 (₹9.6 Lakhs/yr), your target baseline FIRE corpus today is **₹2.4 Crores to ₹2.88 Crores**.
- **Inflation Adjustment:** At 6% inflation, retiring in 20 years requires adjusting this corpus to account for rising costs of living.

[NAVIGATE:fire|Open FIRE Corpus Engine] [NAVIGATE:inflation|Check Inflation Erosion]`;
    }

    // 5. Buy vs Rent
    if (q.includes('buy') || q.includes('rent') || q.includes('house') || q.includes('real estate')) {
      return `### Buy vs. Rent Quantitative Framework

The financial verdict depends on the **Price-to-Rent Ratio** and capital opportunity cost:
- **Buying (Homeowner Equity):** Builds tangible property equity and offers emotional stability. Total cost includes EMI (P+I), stamp duty (6–7%), property tax, and maintenance (1–2%/yr).
- **Renting + Investing Difference:** Rent is typically 2.5%–3.5% rental yield in Indian metros. Renting and investing the down payment (₹15L–₹20L) plus EMI-to-rent differential in a 12% equity portfolio frequently produces higher liquid net worth over 15–20 years.

[NAVIGATE:buy-vs-rent|Compare Buy vs Rent] [NAVIGATE:emi|Calculate Home Loan EMI]`;
    }

    // 6. 50/30/20 Budgeting
    if (q.includes('budget') || q.includes('50/30/20') || q.includes('salary') || q.includes('expense')) {
      return `### 50/30/20 Budgeting Rule (Calibrated for ₹200k/month)

- **50% Needs (₹1,00,000 / mo):** Rent/Home EMI, groceries, utilities, school fees, essential health insurance, vehicle fuel.
- **30% Wants (₹60,000 / mo):** Dining out, vacations, gadgets, entertainment, streaming subscriptions, leisure.
- **20% Wealth & Savings (₹40,000 / mo):** Mutual fund SIPs, emergency fund (6 months expenses), PPF/NPS, debt prepayments.

[NAVIGATE:budget|Open 50/30/20 Budget Planner] [NAVIGATE:net-worth|Track Total Net Worth]`;
    }

    // 7. Credit Card Debt Trap
    if (q.includes('credit card') || q.includes('minimum due') || q.includes('debt') || q.includes('apr')) {
      return `### The Credit Card Minimum-Due Trap

Credit cards in India charge **3.5% per month (42% to 48% APR)** on revolving balances:
- **Paying Only Minimum (5%):** A ₹1,00,000 balance takes **over 14 years to clear** and costs **₹1.8+ Lakhs in pure interest**!
- **Accelerated Fixed Payment (₹5,000/mo):** Clears the entire ₹1 Lakh debt in **2.2 Years**, saving over **₹1.4 Lakhs in interest**.

[NAVIGATE:credit-card|Open Credit Card Payoff Calculator] [NAVIGATE:comparator|Compare Low-Interest Personal Loans]`;
    }

    // 8. General Navigation / Default Fallback
    return `### Finculator Financial Intelligence

I can assist you with complete mathematical simulations across:
1. **Loan Optimization:** EMI schedules, prepayment interest savings, balance transfers, eligibility ratios.
2. **Wealth & Investing:** SIP growth, Step-Up SIPs, lump sum compound curves, CAGR returns.
3. **Taxes & Compliance:** Old vs New Income Tax regimes, in-hand take-home salary, GST calculator.
4. **Retirement & Milestones:** FIRE number calculations, safe withdrawal rates, inflation erosion, 50/30/20 budget.

What specific financial goal or calculation would you like to explore?

[NAVIGATE:emi|Loan EMI] [NAVIGATE:investments|SIP Calculator] [NAVIGATE:taxes|Tax Calculator] [NAVIGATE:fire|FIRE Planner]`;
  }

  formatMarkdown(text) {
    if (!text) return '';

    let html = text
      // Replace [NAVIGATE:route|Label] with interactive buttons
      .replace(/\[NAVIGATE:([a-zA-Z0-9_-]+)\|([^\]]+)\]/g, (match, route, label) => {
        return `<button class="finbot-action-btn" data-route="${route}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          ${label}
        </button>`;
      })
      // Headers
      .replace(/^### (.*$)/gim, '<h4 style="margin: 0.4rem 0 0.3rem 0; color: #FFFFFF; font-size: 0.95rem;">$1</h4>')
      .replace(/^## (.*$)/gim, '<h3 style="margin: 0.5rem 0 0.3rem 0; color: #FFFFFF; font-size: 1rem;">$1</h3>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Inline Code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Bullet lists
      .replace(/^\s*-\s+(.*$)/gim, '<li>$1</li>')
      // Wrap sequential <li> in <ul>
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      // Line breaks
      .replace(/\n\n/g, '<br/>');

    return html;
  }
}
