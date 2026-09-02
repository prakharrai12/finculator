/**
 * Finculator Storage State Engine
 * Differentiates between:
 * - Temporary in-memory SessionStorage for unauthenticated Guest sessions (discarded upon session exit)
 * - Permanent LocalStorage for authenticated accounts (persists across visits)
 * Supports automatic migration of guest data when a user signs in or creates an account.
 */

const GUEST_PREFIX = 'finculator_guest_state_';
const AUTH_PREFIX = 'finculator_state_';

function isUserAuthenticated() {
  try {
    const raw = localStorage.getItem('finculator_auth_session');
    if (!raw) return false;
    const session = JSON.parse(raw);
    return !!(session && (session.email || session.token));
  } catch (_) {
    return false;
  }
}

/**
 * Retrieve state for a given calculator ID.
 * - Authenticated: reads from localStorage
 * - Guest: reads strictly from sessionStorage
 */
export function getStoredState(calculatorId, defaultState = {}) {
  try {
    if (isUserAuthenticated()) {
      const raw = localStorage.getItem(AUTH_PREFIX + calculatorId);
      if (!raw) return defaultState;
      const parsed = JSON.parse(raw);
      return { ...defaultState, ...parsed };
    } else {
      const raw = sessionStorage.getItem(GUEST_PREFIX + calculatorId);
      if (!raw) return defaultState;
      const parsed = JSON.parse(raw);
      return { ...defaultState, ...parsed };
    }
  } catch (e) {
    console.warn('Could not load stored state', e);
    return defaultState;
  }
}

/**
 * Persist state for a given calculator ID.
 * - Authenticated: persists to permanent localStorage
 * - Guest: persists strictly to temporary sessionStorage
 */
export function setStoredState(calculatorId, state) {
  try {
    if (isUserAuthenticated()) {
      localStorage.setItem(AUTH_PREFIX + calculatorId, JSON.stringify(state));
    } else {
      sessionStorage.setItem(GUEST_PREFIX + calculatorId, JSON.stringify(state));
      sessionStorage.setItem('finculator_guest_has_data', 'true');
    }
  } catch (e) {
    console.warn('Could not save stored state', e);
  }
}

/**
 * Remove stored state for a specific calculator ID.
 */
export function clearStoredState(calculatorId) {
  try {
    if (isUserAuthenticated()) {
      localStorage.removeItem(AUTH_PREFIX + calculatorId);
    } else {
      sessionStorage.removeItem(GUEST_PREFIX + calculatorId);
    }
  } catch (e) {
    console.warn('Could not clear stored state', e);
  }
}

/**
 * Automatically migrate all temporary guest session calculations, inputs,
 * and portfolio entries into the authenticated user's permanent localStorage.
 */
export function migrateGuestSessionToAccount() {
  try {
    let migratedCount = 0;
    const keysToRemove = [];

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(GUEST_PREFIX)) {
        const calculatorId = key.substring(GUEST_PREFIX.length);
        const guestData = sessionStorage.getItem(key);
        if (guestData) {
          localStorage.setItem(AUTH_PREFIX + calculatorId, guestData);
          migratedCount++;
        }
        keysToRemove.push(key);
      }
    }

    // Clean up temporary guest session keys
    keysToRemove.forEach((k) => sessionStorage.removeItem(k));
    sessionStorage.removeItem('finculator_guest_has_data');
    sessionStorage.removeItem('finculator_guest_access');

    return migratedCount;
  } catch (e) {
    console.warn('Could not migrate guest session to account', e);
    return 0;
  }
}

/**
 * Clear all temporary guest session data.
 */
export function clearGuestSession() {
  try {
    const keysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.startsWith(GUEST_PREFIX) || key === 'finculator_guest_has_data')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => sessionStorage.removeItem(k));
    sessionStorage.removeItem('finculator_guest_access');
    sessionStorage.removeItem('finculator_downloaded_pdf');
  } catch (e) {
    console.warn('Could not clear guest session', e);
  }
}

/**
 * Check if the guest user has modified or created calculations in this session.
 */
export function hasGuestSessionData() {
  try {
    if (sessionStorage.getItem('finculator_guest_has_data') === 'true') return true;
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(GUEST_PREFIX)) return true;
    }
    return false;
  } catch (_) {
    return false;
  }
}
