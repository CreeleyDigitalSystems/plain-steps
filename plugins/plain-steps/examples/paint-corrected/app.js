(function () {
  'use strict';

  const STORAGE_KEY = 'paint-plan.room.v1';
  const DEFAULTS = Object.freeze({ area: '24', coats: '2', coverage: '10', tin: '2' });
  const FIELDS = Object.keys(DEFAULTS);

  function validate(values) {
    const errors = {};
    const numbers = {};
    const messages = {
      area: 'Enter a wall area greater than zero.',
      coats: 'Enter a whole number of coats, at least 1.',
      coverage: 'Enter coverage greater than zero.',
      tin: 'Enter a tin size greater than zero.'
    };

    FIELDS.forEach(function (field) {
      const value = values[field];
      const number = typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
      numbers[field] = number;
      if (!Number.isFinite(number) || number <= 0 ||
          (field === 'coats' && !Number.isSafeInteger(number))) {
        errors[field] = messages[field];
      }
    });
    return { numbers: numbers, errors: errors };
  }

  // Use the entered decimal values as fractions so an exact tin boundary
  // cannot accidentally round up to one extra tin in floating-point arithmetic.
  function decimalFraction(value) {
    const parts = String(value).trim().toLowerCase().split('e');
    const exponent = parts.length === 2 ? Number(parts[1]) : 0;
    const coefficient = parts[0].replace(/^\+/, '');
    const decimalPlaces = (coefficient.split('.')[1] || '').length;
    const digits = BigInt(coefficient.replace('.', ''));
    const power = exponent - decimalPlaces;
    return power >= 0
      ? { n: digits * (10n ** BigInt(power)), d: 1n }
      : { n: digits, d: 10n ** BigInt(-power) };
  }

  function calculate(values) {
    const checked = validate(values);
    if (Object.keys(checked.errors).length) return { errors: checked.errors };
    const v = checked.numbers;
    const litres = v.area / v.coverage * v.coats;
    if (!Number.isFinite(litres) || litres <= 0) {
      return { errors: {}, error: 'These numbers are outside the calculator’s range. Use smaller values or a larger coverage.' };
    }

    try {
      const a = decimalFraction(values.area);
      const c = decimalFraction(values.coats);
      const r = decimalFraction(values.coverage);
      const t = decimalFraction(values.tin);
      const numerator = a.n * c.n * r.d * t.d;
      const denominator = a.d * c.d * r.n * t.n;
      const tinsExact = (numerator + denominator - 1n) / denominator;
      if (tinsExact > BigInt(Number.MAX_SAFE_INTEGER)) throw new RangeError('Too many tins');
      const tins = Number(tinsExact);
      const total = tins * v.tin;
      if (!Number.isFinite(total)) throw new RangeError('Total too large');
      return { litres: litres, tins: tins, total: total, numbers: v, errors: {} };
    } catch (_) {
      return { errors: {}, error: 'These numbers are outside the calculator’s range. Try smaller values.' };
    }
  }

  function loadPlan(storage) {
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (raw === null) return { values: { ...DEFAULTS }, state: 'new' };
      const saved = JSON.parse(raw);
      if (!saved || saved.version !== 1 || !saved.values ||
          !FIELDS.every(field => typeof saved.values[field] === 'string')) {
        throw new Error('Unrecognised saved plan');
      }
      return { values: Object.fromEntries(FIELDS.map(field => [field, saved.values[field]])), state: 'loaded' };
    } catch (_) {
      return { values: { ...DEFAULTS }, state: 'unavailable' };
    }
  }

  function savePlan(storage, values) {
    try {
      const record = JSON.stringify({ version: 1, values: Object.fromEntries(FIELDS.map(field => [field, values[field]])) });
      storage.setItem(STORAGE_KEY, record);
      return storage.getItem(STORAGE_KEY) === record;
    } catch (_) {
      return false;
    }
  }

  function formatNumber(value) {
    if (value !== 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 1e9)) {
      return value.toExponential(5).replace(/\.?0+e/, 'e');
    }
    return new Intl.NumberFormat('en-AU', { maximumFractionDigits: 6 }).format(value);
  }

  function initialise() {
    const get = id => document.getElementById(id);
    const inputs = Object.fromEntries(FIELDS.map(field => [field, get(field)]));
    let storage;
    try { storage = window.localStorage; } catch (_) { storage = null; }
    const loaded = loadPlan(storage);
    FIELDS.forEach(field => { inputs[field].value = loaded.values[field]; });

    function showSaveState(saved, draft) {
      get('save-note').dataset.state = saved ? 'saved' : 'error';
      get('save-message').textContent = saved
        ? (draft ? 'Draft saved on this device. Check the fields above.' : 'Saved on this device automatically')
        : 'Couldn’t save in this browser. Your changes may be lost when you close it.';
    }

    function update(shouldSave) {
      const values = Object.fromEntries(FIELDS.map(field => [field, inputs[field].value]));
      const result = calculate(values);
      const valid = Object.keys(result.errors).length === 0 && !result.error;
      FIELDS.forEach(function (field) {
        const error = result.errors[field];
        inputs[field].setAttribute('aria-invalid', error ? 'true' : 'false');
        get(field + '-error').textContent = error || '';
        get(field + '-error').hidden = !error;
      });

      get('litres').textContent = valid ? formatNumber(result.litres) : '—';
      get('tins').textContent = valid ? formatNumber(result.tins) : '—';
      get('tin-label').textContent = valid && result.tins === 1 ? 'tin' : 'tins';
      get('tin-detail').textContent = valid
        ? formatNumber(result.tins) + ' × ' + formatNumber(result.numbers.tin) + ' L = ' + formatNumber(result.total) + ' L to take home'
        : 'A plan will appear when the numbers are valid.';
      get('formula').textContent = valid
        ? formatNumber(result.numbers.area) + ' m² × ' + formatNumber(result.numbers.coats) +
          (result.numbers.coats === 1 ? ' coat ÷ ' : ' coats ÷ ') + formatNumber(result.numbers.coverage) + ' m²/L = ' + formatNumber(result.litres) + ' L'
        : 'Wall area × coats ÷ coverage = litres needed';
      get('result-message').textContent = result.error || 'Check the highlighted fields to calculate your plan.';
      get('result-message').hidden = valid;
      if (shouldSave) showSaveState(savePlan(storage, values), !valid);
    }

    get('paint-form').addEventListener('input', () => update(true));
    get('paint-form').addEventListener('submit', event => { event.preventDefault(); update(true); });
    // Do not replace an unreadable saved record merely by opening the app.
    update(loaded.state !== 'unavailable');
    if (loaded.state === 'unavailable') {
      showSaveState(false, false);
      get('save-message').textContent = 'Couldn’t restore a saved plan. Starting values are shown; editing will try saving again.';
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DEFAULTS, STORAGE_KEY, validate, calculate, loadPlan, savePlan, formatNumber };
  }
  if (typeof document !== 'undefined') initialise();
}());
