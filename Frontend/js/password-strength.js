/**
 * Password Strength Meter and Visibility Toggle Controller
 *
 * What it Does: Simple non IT Terms
 * Evaluates passwords in real-time as users type them, shows a colored strength bar
 * (Weak, Fair, Good, Strong), checks requirements (8+ letters and numbers), and adds
 * eye peek buttons to easily view or hide passwords.
 */

(function () {
  'use strict';

  const METER_TEMPLATE = [
    '<div class="strength-track">',
    '  <span class="strength-bar"></span>',
    '  <span class="strength-bar"></span>',
    '  <span class="strength-bar"></span>',
    '  <span class="strength-bar"></span>',
    '</div>',
    '<div class="strength-meta">',
    '  <span class="strength-label">Strength: <strong class="strength-rating strength-empty">Not entered</strong></span>',
    '</div>',
    '<div class="strength-criteria">',
    '  <span class="strength-rule" data-rule="length">8+ characters</span>',
    '  <span class="strength-rule" data-rule="letter">Letters</span>',
    '  <span class="strength-rule" data-rule="number">Numbers</span>',
    '</div>'
  ].join('');

  /**
   * Evaluates the strength of a given password string.
   * System requirements: min 8 characters, at least 1 letter, at least 1 number.
   * Bonus criteria: mixed case, special character, 12+ characters.
   */
  function evaluatePassword(password) {
    const pwd = String(password || '');
    const length = pwd.length;

    const hasLength = length >= 8;
    const hasLetter = /[A-Za-z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    const hasMixed = /[a-z]/.test(pwd) && /[A-Z]/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
    const isLong = length >= 12;

    let error = '';
    if (!hasLength) {
      error = 'Password must be at least 8 characters long.';
    } else if (!hasLetter || !hasNumber) {
      error = 'Password must contain at least one letter and one number.';
    }

    if (length === 0) {
      return {
        score: 0,
        level: 'empty',
        label: 'Not entered',
        isValid: false,
        error: 'Password is required.',
        rules: { length: false, letter: false, number: false }
      };
    }

    if (error) {
      return {
        score: 1,
        level: 'weak',
        label: 'Weak',
        isValid: false,
        error,
        rules: { length: hasLength, letter: hasLetter, number: hasNumber }
      };
    }

    // Base requirements are met. Calculate bonus strength.
    let bonus = 0;
    if (hasMixed) bonus++;
    if (hasSpecial) bonus++;
    if (isLong) bonus++;

    if (bonus === 0) {
      return {
        score: 2,
        level: 'fair',
        label: 'Fair',
        isValid: true,
        error: '',
        rules: { length: true, letter: true, number: true }
      };
    }

    if (bonus === 1) {
      return {
        score: 3,
        level: 'good',
        label: 'Good',
        isValid: true,
        error: '',
        rules: { length: true, letter: true, number: true }
      };
    }

    return {
      score: 4,
      level: 'strong',
      label: 'Strong',
      isValid: true,
      error: '',
      rules: { length: true, letter: true, number: true }
    };
  }

  /**
   * Helper returning error string or empty string if valid.
   */
  function passwordError(password) {
    return evaluatePassword(password).error;
  }

  /**
   * Updates a password strength meter container based on evaluation results.
   */
  function updateMeter(meter, evaluation) {
    if (!meter) return;

    // Update textual label
    const ratingEl = meter.querySelector('.strength-rating');
    if (ratingEl) {
      ratingEl.textContent = evaluation.label;
      ratingEl.className = `strength-rating strength-${evaluation.level}`;
    }

    // Update 4 visual segmented bars
    const bars = meter.querySelectorAll('.strength-bar');
    bars.forEach((bar, idx) => {
      if (idx < evaluation.score) {
        bar.className = `strength-bar is-filled level-${evaluation.level}`;
      } else {
        bar.className = 'strength-bar';
      }
    });

    // Update individual rule pill badges
    const rules = meter.querySelectorAll('.strength-rule');
    rules.forEach(rule => {
      const type = rule.dataset.rule;
      const isMet = Boolean(evaluation.rules && evaluation.rules[type]);
      rule.classList.toggle('is-met', isMet);
      rule.setAttribute('aria-checked', isMet ? 'true' : 'false');
    });
  }

  /**
   * Updates a password confirmation match indicator.
   */
  function updateMatchIndicator(indicator, pwdVal, confirmVal) {
    if (!indicator) return;

    if (!confirmVal) {
      indicator.className = 'password-match-indicator';
      indicator.textContent = 'Must match password';
      return;
    }

    if (pwdVal === confirmVal) {
      indicator.className = 'password-match-indicator match-success';
      indicator.textContent = '✓ Passwords match';
    } else {
      indicator.className = 'password-match-indicator match-error';
      indicator.textContent = '✗ Passwords do not match';
    }
  }

  /**
   * Universal Show/Hide Password peek button handler.
   */
  function attachPasswordToggles() {
    document.querySelectorAll('[data-password-toggle], [data-toggle-password]').forEach(button => {
      if (button._toggleBound) return;
      button._toggleBound = true;
      button.addEventListener('click', () => {
        const targetId = button.dataset.passwordToggle || button.dataset.togglePassword;
        const input = document.getElementById(targetId);
        if (!input) return;
        const showing = input.type === 'text';
        input.type = showing ? 'password' : 'text';
        button.textContent = showing ? 'Show' : 'Hide';
        button.setAttribute('aria-label', `${showing ? 'Show' : 'Hide'} password`);
      });
    });
  }

  /**
   * Initializes all strength meters, match indicators, and toggles on the page.
   */
  function initPasswordStrength() {
    // 1. Scaffold and wire up strength meters
    document.querySelectorAll('.password-strength-meter[data-for]').forEach(meter => {
      if (!meter.querySelector('.strength-track')) {
        meter.innerHTML = METER_TEMPLATE;
      }

      const inputId = meter.dataset.for;
      const input = document.getElementById(inputId);
      if (!input || input._strengthBound) return;

      input._strengthBound = true;
      const handler = () => {
        const evalRes = evaluatePassword(input.value);
        updateMeter(meter, evalRes);
      };

      input.addEventListener('input', handler);
      input.addEventListener('focus', handler);
      handler();
    });

    // 2. Scaffold and wire up confirmation match indicators
    document.querySelectorAll('.password-match-indicator[data-match-for]').forEach(indicator => {
      if (!indicator.textContent.trim()) {
        indicator.textContent = 'Must match password';
      }

      const confirmId = indicator.dataset.matchFor;
      const passwordId = indicator.dataset.matchWith;
      const confirmInput = document.getElementById(confirmId);
      const passwordInput = document.getElementById(passwordId);

      if (!confirmInput || !passwordInput || confirmInput._matchBound) return;
      confirmInput._matchBound = true;

      const handler = () => {
        updateMatchIndicator(indicator, passwordInput.value, confirmInput.value);
      };

      confirmInput.addEventListener('input', handler);
      passwordInput.addEventListener('input', handler);
      handler();
    });

    // 3. Attach universal password toggles
    attachPasswordToggles();
  }

  // Export to window
  window.evaluatePassword = evaluatePassword;
  window.passwordError = passwordError;
  window.initPasswordStrength = initPasswordStrength;
  window.attachPasswordToggles = attachPasswordToggles;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPasswordStrength);
  } else {
    initPasswordStrength();
  }
})();
