/**
 * Finculator FinBot — AI Financial Assistant & Active Site Controller
 * Powered by Financial RAG Semantic Knowledge Engine
 */

import { queryFinancialKnowledge } from './financialRAG.js';

export class FinBot {
  constructor(app) {
    this.app = app;
    this.isOpen = false;
    this.init();
  }

  init() {
    this.createDOM();
    this.attachEvents();
    this.addBotMessage(
      "Hello! I am **FinBot**, your financial advisor & navigation assistant.\n\nAsk me any doubt (*e.g., 'Which tax regime is better?', 'How much loan can I get on 200k?', 'How does SIP compound?'*), and I will explain the math and take you directly to the calculator!"
    );
  }

  createDOM() {
    // Remove existing if any
    const existingLauncher = document.getElementById('finbot-launcher');
    const existingDrawer = document.getElementById('finbot-drawer');
    if (existingLauncher) existingLauncher.remove();
    if (existingDrawer) existingDrawer.remove();

    // Floating Launcher Capsule Button
    const launcher = document.createElement('button');
    launcher.id = 'finbot-launcher';
    launcher.className = 'finbot-launcher';
    launcher.setAttribute('aria-label', 'Open FinBot Financial AI Assistant');
    launcher.innerHTML = `
      <span class="finbot-pulse-dot"></span>
      <svg class="finbot-launcher-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      <span class="finbot-launcher-label" id="finbot-launcher-label">Ask FinBot</span>
    `;

    // Chat Assistant Drawer Panel
    const drawer = document.createElement('div');
    drawer.id = 'finbot-drawer';
    drawer.className = 'finbot-drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-label', 'FinBot Financial Intelligence Assistant');
    drawer.innerHTML = `
      <!-- Header -->
      <div class="finbot-header">
        <div class="finbot-header-info">
          <div class="finbot-avatar-badge">✦</div>
          <div>
            <div class="finbot-header-title">FinBot Intelligence</div>
            <div class="finbot-header-sub"><span class="finbot-live-status"></span> Financial RAG Engine</div>
          </div>
        </div>
        <div class="finbot-header-ctrls">
          <button type="button" class="finbot-ctrl-btn" id="finbot-close-btn" title="Close FinBot" aria-label="Close">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>

      <!-- Quick Suggestion Chips -->
      <div class="finbot-chips-bar" id="finbot-chips-bar">
        <button type="button" class="finbot-chip" data-q="Which tax regime is better for 24L salary?">Old vs New Tax</button>
        <button type="button" class="finbot-chip" data-q="How to reduce home loan interest and tenure?">Prepay Mortgage</button>
        <button type="button" class="finbot-chip" data-q="How much loan can I get on 200k salary?">Loan Eligibility</button>
        <button type="button" class="finbot-chip" data-q="How does 50/30/20 budget work?">50/30/20 Budget</button>
        <button type="button" class="finbot-chip" data-q="How to calculate retirement corpus and FIRE number?">FIRE Number</button>
        <button type="button" class="finbot-chip" data-q="How much will 25000 monthly SIP grow to?">SIP Compounding</button>
      </div>

      <!-- Messages Log -->
      <div class="finbot-msg-list" id="finbot-msg-list"></div>

      <!-- Input Bar -->
      <form class="finbot-form" id="finbot-form">
        <input
          type="text"
          id="finbot-input-field"
          class="finbot-input-field"
          placeholder="Ask a financial doubt or where to go..."
          autocomplete="off"
          required
        />
        <button type="submit" class="finbot-submit-btn" aria-label="Send query">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </form>
    `;

    document.body.appendChild(launcher);
    document.body.appendChild(drawer);

    this.launcher = launcher;
    this.drawer = drawer;
    this.launcherLabel = launcher.querySelector('#finbot-launcher-label');
    this.msgList = drawer.querySelector('#finbot-msg-list');
    this.input = drawer.querySelector('#finbot-input-field');
    this.form = drawer.querySelector('#finbot-form');
    this.closeBtn = drawer.querySelector('#finbot-close-btn');
    this.chipsBar = drawer.querySelector('#finbot-chips-bar');
  }

  attachEvents() {
    this.launcher.addEventListener('click', () => {
      this.toggleChat();
    });

    this.closeBtn.addEventListener('click', () => {
      this.toggleChat(false);
    });

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = this.input.value.trim();
      if (!q) return;
      this.input.value = '';
      this.handleQuery(q);
    });

    this.chipsBar.addEventListener('click', (e) => {
      const chip = e.target.closest('.finbot-chip');
      if (chip) {
        const q = chip.getAttribute('data-q');
        this.handleQuery(q);
      }
    });

    // Action button navigation delegation
    this.msgList.addEventListener('click', (e) => {
      const actionBtn = e.target.closest('.finbot-nav-action-btn');
      if (actionBtn) {
        const route = actionBtn.getAttribute('data-route');
        if (route) {
          this.navigateTo(route);
        }
      }
    });

    // Close on Escape
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.toggleChat(false);
      }
    });
  }

  toggleChat(forceState) {
    this.isOpen = typeof forceState === 'boolean' ? forceState : !this.isOpen;
    if (this.isOpen) {
      this.drawer.classList.add('is-open');
      this.launcher.classList.add('is-active');
      this.launcherLabel.textContent = 'Close FinBot';
      setTimeout(() => this.input.focus(), 150);
      this.scrollToBottom();
    } else {
      this.drawer.classList.remove('is-open');
      this.launcher.classList.remove('is-active');
      this.launcherLabel.textContent = 'Ask FinBot';
    }
  }

  addUserMessage(text) {
    const bubble = document.createElement('div');
    bubble.className = 'finbot-msg finbot-user-bubble';
    bubble.textContent = text;
    this.msgList.appendChild(bubble);
    this.scrollToBottom();
  }

  addBotMessage(markdownText, action = null) {
    const bubble = document.createElement('div');
    bubble.className = 'finbot-msg finbot-bot-bubble';

    let html = this.renderMarkdown(markdownText);
    if (action) {
      html += `
        <div class="finbot-card-action">
          <div class="finbot-card-action-title">Direct Action:</div>
          <button type="button" class="finbot-nav-action-btn" data-route="${action.route}">
            <span>${action.label}</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
      `;
    }

    bubble.innerHTML = html;
    this.msgList.appendChild(bubble);
    this.scrollToBottom();
  }

  scrollToBottom() {
    setTimeout(() => {
      this.msgList.scrollTop = this.msgList.scrollHeight;
    }, 40);
  }

  renderMarkdown(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
  }

  navigateTo(route) {
    window.location.hash = `#/${route}`;
    const toast = document.getElementById('app-toast');
    if (toast) {
      toast.textContent = `Navigated to ${route.toUpperCase()} Calculator`;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2200);
    }
  }

  handleQuery(query) {
    this.addUserMessage(query);

    // Show typing dots
    const typing = document.createElement('div');
    typing.className = 'finbot-msg finbot-bot-bubble finbot-typing-dots';
    typing.innerHTML = '<span></span><span></span><span></span>';
    this.msgList.appendChild(typing);
    this.scrollToBottom();

    setTimeout(() => {
      typing.remove();

      // Retrieve financial answer from RAG
      const ragResult = queryFinancialKnowledge(query);

      if (ragResult && ragResult.doc) {
        const doc = ragResult.doc;
        this.addBotMessage(doc.answer, {
          label: doc.actionLabel,
          route: doc.route
        });
      } else {
        // Fallback intelligent responder
        this.addBotMessage(
          `I analyzed your query: *"**${query}**"*. Finculator provides 20+ specialized financial engines for loans, savings, investments, taxes, and retirement.\n\nChoose an option below to jump directly into the interface:`,
          {
            label: 'Open EMI & Repayment Calculator',
            route: 'emi'
          }
        );
      }
    }, 320);
  }
}
