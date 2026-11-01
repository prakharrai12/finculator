import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHTML } from '../js/utils/formatters.js';
import { validatePasswordPolicy } from '../js/utils/auth.js';
import { FinBot } from '../js/components/chatbot.js';

test('Security: validatePasswordPolicy enforces strict fintech standards', () => {
  // Too short (< 12)
  assert.equal(validatePasswordPolicy('Ab1!').valid, false);
  assert.match(validatePasswordPolicy('Ab1!').error, /at least 12 characters/);

  // Missing uppercase (14 chars)
  assert.equal(validatePasswordPolicy('abcdefghijkl1!').valid, false);
  assert.match(validatePasswordPolicy('abcdefghijkl1!').error, /uppercase/);

  // Missing lowercase (14 chars)
  assert.equal(validatePasswordPolicy('ABCDEFGHIJKL1!').valid, false);
  assert.match(validatePasswordPolicy('ABCDEFGHIJKL1!').error, /lowercase/);

  // Missing digit (13 chars)
  assert.equal(validatePasswordPolicy('Abcdefghijkl!').valid, false);
  assert.match(validatePasswordPolicy('Abcdefghijkl!').error, /digit/);

  // Missing special char (13 chars)
  assert.equal(validatePasswordPolicy('Abcdefghijkl1').valid, false);
  assert.match(validatePasswordPolicy('Abcdefghijkl1').error, /special character/);

  // Common password in blocklist
  assert.equal(validatePasswordPolicy('Password123456!').valid, false);
  assert.match(validatePasswordPolicy('Password123456!').error, /too common/);

  // Valid strong password
  assert.equal(validatePasswordPolicy('FinSecure@2026!').valid, true);
});

test('Security: escapeHTML neutralizes XSS payloads', () => {
  const xssPayloads = [
    '<script>alert("xss")</script>',
    '<img src=x onerror=alert(1)>',
    '"><svg onload=alert(document.cookie)>',
    "' onfocus='alert(1)'",
    '<iframe src="javascript:alert(1)"></iframe>'
  ];

  for (const payload of xssPayloads) {
    const escaped = escapeHTML(payload);
    assert.doesNotMatch(escaped, /<script>/i);
    assert.doesNotMatch(escaped, /<img/i);
    assert.doesNotMatch(escaped, /<svg/i);
    assert.doesNotMatch(escaped, /<iframe/i);
    assert.ok(escaped.includes('&lt;') || escaped.includes('&gt;') || escaped.includes('&quot;') || escaped.includes('&#39;'));
  }

  // Null & undefined safety
  assert.equal(escapeHTML(null), '');
  assert.equal(escapeHTML(undefined), '');
  assert.equal(escapeHTML(0), '0');
});

test('Security: FinBot formatMarkdown sanitizes malicious inputs and restricts routes', () => {
  // Create minimal mock instance to test formatMarkdown method
  const bot = Object.create(FinBot.prototype);

  // XSS injection in query response
  const rawMalicious = 'Here is your info: <script>alert("pwned")</script> and <img src=x onerror=alert(1)>';
  const formatted = bot.formatMarkdown(rawMalicious);
  assert.doesNotMatch(formatted, /<script>/i);
  assert.doesNotMatch(formatted, /<img/i);
  assert.ok(formatted.includes('&lt;script&gt;'));
  assert.ok(formatted.includes('&lt;img'));

  // Route traversal / injection test
  const fakeRoute = 'Here is a button: [NAVIGATE:javascript:alert(1)|Click Here]';
  const resFake = bot.formatMarkdown(fakeRoute);
  assert.doesNotMatch(resFake, /data-route="javascript/);
  assert.doesNotMatch(resFake, /<button/);

  // Legitimate whitelisted route
  const validRoute = 'Calculate your loan: [NAVIGATE:emi|Calculate EMI]';
  const resValid = bot.formatMarkdown(validRoute);
  assert.match(resValid, /<button class="finbot-action-btn" data-route="emi">/);
  assert.match(resValid, /Calculate EMI/);
});
