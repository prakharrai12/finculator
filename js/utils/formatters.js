/**
 * Finculator Currency & Number Formatting Utilities (v2)
 * Supports full international & Indian Lakh/Crore localized numeral grouping
 */

export const CURRENCIES = {
  USD: { symbol: '$', code: 'USD', name: 'US Dollar ($)', locale: 'en-US' },
  EUR: { symbol: '€', code: 'EUR', name: 'Euro (€)', locale: 'de-DE' },
  GBP: { symbol: '£', code: 'GBP', name: 'British Pound (£)', locale: 'en-GB' },
  INR: { symbol: '₹', code: 'INR', name: 'Indian Rupee (₹)', locale: 'en-IN' },
  JPY: { symbol: '¥', code: 'JPY', name: 'Japanese Yen (¥)', locale: 'ja-JP' },
  CAD: { symbol: 'C$', code: 'CAD', name: 'Canadian Dollar (C$)', locale: 'en-CA' },
  AUD: { symbol: 'A$', code: 'AUD', name: 'Australian Dollar (A$)', locale: 'en-AU' },
  CHF: { symbol: '₣', code: 'CHF', name: 'Swiss Franc (₣)', locale: 'de-CH' }
};

let currentCurrency = 'USD';

export function setGlobalCurrency(code) {
  if (CURRENCIES[code]) {
    currentCurrency = code;
  }
}

export function getGlobalCurrency() {
  return CURRENCIES[currentCurrency] || CURRENCIES.USD;
}

/**
 * Format a number as currency with proper symbol, localized thousands/lakh grouping, and decimals
 * @param {number} value 
 * @param {string} [currencyCode]
 * @param {boolean} [showDecimals=true]
 * @returns {string}
 */
export function formatCurrency(value, currencyCode = currentCurrency, showDecimals = true) {
  const curr = CURRENCIES[currencyCode] || CURRENCIES.USD;
  const num = Number(value) || 0;

  // Zero check
  if (Math.abs(num) < 0.005) {
    return `${curr.symbol}0.00`;
  }

  const hasDecimals = showDecimals && (num % 1 !== 0 || Math.abs(num) < 1000);
  const minDigits = hasDecimals ? 2 : 0;
  const maxDigits = hasDecimals ? 2 : 0;

  try {
    const formatted = new Intl.NumberFormat(curr.locale, {
      minimumFractionDigits: minDigits,
      maximumFractionDigits: maxDigits
    }).format(num);

    return `${curr.symbol}${formatted}`;
  } catch (e) {
    return `${curr.symbol}${num.toFixed(2)}`;
  }
}

/**
 * Format standard number with locale grouping
 * @param {number} value 
 * @param {number} [decimals=2]
 * @returns {string}
 */
export function formatNumber(value, decimals = 2) {
  const curr = CURRENCIES[currentCurrency] || CURRENCIES.USD;
  const num = Number(value) || 0;

  try {
    return new Intl.NumberFormat(curr.locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  } catch (e) {
    return num.toFixed(decimals);
  }
}

/**
 * Format percentage value
 * @param {number} value 
 * @param {number} [decimals=1]
 * @returns {string}
 */
export function formatPercent(value, decimals = 1) {
  const num = Number(value) || 0;
  return `${num.toFixed(decimals)}%`;
}

/**
 * Parse raw input string to clean numeric float
 * @param {string|number} input 
 * @returns {number}
 */
export function parseNumeric(input) {
  if (typeof input === 'number') return isNaN(input) ? 0 : input;
  if (!input) return 0;
  const cleaned = String(input).replace(/[^0-9.-]+/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}
