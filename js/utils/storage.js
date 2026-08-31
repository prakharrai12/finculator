/**
 * Finculator Local Storage State Engine
 * Automatically preserves calculator inputs across sessions
 */

const PREFIX = 'finculator_state_';

export function getStoredState(calculatorId, defaultState = {}) {
  try {
    const raw = localStorage.getItem(PREFIX + calculatorId);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw);
    return { ...defaultState, ...parsed };
  } catch (e) {
    console.warn('Could not load saved state from localStorage', e);
    return defaultState;
  }
}

export function setStoredState(calculatorId, state) {
  try {
    localStorage.setItem(PREFIX + calculatorId, JSON.stringify(state));
  } catch (e) {
    console.warn('Could not save state to localStorage', e);
  }
}

export function clearStoredState(calculatorId) {
  try {
    localStorage.removeItem(PREFIX + calculatorId);
  } catch (e) {
    console.warn('Could not clear state from localStorage', e);
  }
}
