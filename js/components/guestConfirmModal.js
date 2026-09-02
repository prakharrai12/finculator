/**
 * Finculator Guest Home Confirmation Modal
 * Warns guest users when navigating to Home that session progress will be lost
 * and provides options to "Log In / Sign Up to Save" or "Continue to Home (Discard)".
 */

import { clearGuestSession } from '../utils/storage.js';

export class GuestConfirmModal {
  constructor(app) {
    this.app = app;
    this.isOpen = false;
    this.initDOM();
    this.attachEvents();
  }

  initDOM() {
    this.container = document.createElement('div');
    this.container.className = 'guest-confirm-backdrop';
    this.container.id = 'guest-confirm-modal-backdrop';
    this.container.setAttribute('role', 'dialog');
    this.container.setAttribute('aria-modal', 'true');
    this.container.setAttribute('aria-labelledby', 'guest-confirm-title');

    this.container.innerHTML = `
      <div class="guest-confirm-card" role="document">
        <!-- Top Close Button -->
        <button type="button" class="guest-confirm-close-btn" id="btn-guest-confirm-close" aria-label="Close dialog" title="Cancel & Return">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <!-- Warning Icon & Title -->
        <div class="guest-confirm-header">
          <div class="guest-confirm-icon-wrap" aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <div class="guest-confirm-eyebrow">GUEST SESSION WARNING</div>
          <h2 class="guest-confirm-title" id="guest-confirm-title">Return to Home Screen?</h2>
          <p class="guest-confirm-desc">
            You are currently exploring Finculator in <strong>Guest Mode</strong>. If you return to the home screen without logging in, your calculation inputs and portfolio entries will not be saved.
          </p>
        </div>

        <!-- Callout Banner -->
        <div class="guest-confirm-callout">
          <div class="guest-confirm-callout-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
          </div>
          <div class="guest-confirm-callout-text">
            <strong>Save your work automatically:</strong> Log in or create a free institutional account. All calculations from this session will be preserved permanently in your workspace.
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="guest-confirm-actions">
          <button type="button" class="btn btn-primary guest-confirm-login-btn" id="btn-guest-confirm-login">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
              <polyline points="10 17 15 12 10 7"></polyline>
              <line x1="15" y1="12" x2="3" y2="12"></line>
            </svg>
            Log In / Sign Up to Save
          </button>
          <button type="button" class="btn guest-confirm-discard-btn" id="btn-guest-confirm-discard">
            Continue to Home (Discard Progress)
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);
  }

  attachEvents() {
    // Close button
    const closeBtn = this.container.querySelector('#btn-guest-confirm-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Click outside backdrop to dismiss
    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) {
        this.close();
      }
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Action 1: Log In / Sign Up
    const loginBtn = this.container.querySelector('#btn-guest-confirm-login');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        this.close();
        if (this.app && this.app.authModal) {
          this.app.authModal.open('signin');
        }
      });
    }

    // Action 2: Continue to Home (Discard)
    const discardBtn = this.container.querySelector('#btn-guest-confirm-discard');
    if (discardBtn) {
      discardBtn.addEventListener('click', () => {
        this.close();
        window.__bypassExitWarning = true;
        clearGuestSession();

        if (this.app) {
          if (this.app.portfolio && this.app.portfolio.isOpen) {
            this.app.portfolio.toggle(false);
          }
          if (this.app.landingGate) {
            this.app.landingGate.lock();
          }
          if (this.app.updateHomeButtonVisibility) {
            this.app.updateHomeButtonVisibility();
          }
          if (this.app.showToast) {
            this.app.showToast('Guest session ended. Progress discarded.');
          }
        }

        setTimeout(() => {
          window.__bypassExitWarning = false;
        }, 600);
      });
    }
  }

  open() {
    this.isOpen = true;
    this.container.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.isOpen = false;
    this.container.classList.remove('active');
    document.body.style.overflow = '';
  }
}
