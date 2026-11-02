'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  DEFAULT_PLAN,
  STORAGE_KEY,
  calculate,
  formatLitres,
  readPlan,
  savePlan,
} = require('../app.js');

const makePlan = (changes = {}) => ({ ...DEFAULT_PLAN, ...changes });

function memoryStorage(initialValue = null) {
  let value = initialValue;
  const writes = [];
  return {
    writes,
    getItem(key) {
      assert.equal(key, STORAGE_KEY);
      return value;
    },
    setItem(key, nextValue) {
      assert.equal(key, STORAGE_KEY);
      assert.equal(typeof nextValue, 'string');
      writes.push(nextValue);
      value = nextValue;
    },
    value() {
      return value;
    },
  };
}

function expectInvalid(field, value, messagePattern) {
  const result = calculate(makePlan({ [field]: value }));
  assert.equal(result.valid, false, `${field}=${JSON.stringify(value)} must fail`);
  assert.equal(typeof result.errors, 'object');
  assert.equal(typeof result.errors[field], 'string');
  assert.ok(result.errors[field].trim(), `${field} needs a useful error`);
  if (messagePattern) assert.match(result.errors[field], messagePattern);
}

test('the default plan gives four litres and two whole tins', () => {
  assert.deepEqual(DEFAULT_PLAN, {
    area: '24', coats: '2', coverage: '12', tinSize: '2.5',
  });
  assert.equal(typeof STORAGE_KEY, 'string');
  assert.ok(STORAGE_KEY);
  const result = calculate(DEFAULT_PLAN);
  assert.equal(result.valid, true);
  assert.equal(result.litres, 4);
  assert.equal(result.tins, 2);
  assert.equal(formatLitres(result), '4');
});

test('the formula uses area times coats divided by coverage', () => {
  const result = calculate(makePlan({ area: '10', coats: '3', coverage: '7', tinSize: '2' }));
  assert.equal(result.valid, true);
  assert.ok(Math.abs(result.litres - 30 / 7) < 1e-12);
  assert.equal(result.tins, 3);
});

test('zero area is a valid empty job and needs no paint or tins', () => {
  const result = calculate(makePlan({ area: '0' }));
  assert.equal(result.valid, true);
  assert.equal(result.litres, 0);
  assert.equal(result.tins, 0);
  assert.equal(formatLitres(result), '0');
});

test('whole-tin rounding uses exact decimal arithmetic at boundaries', () => {
  const cases = [
    [{ area: '0.1', coats: '3', coverage: '0.3', tinSize: '1' }, 1],
    [{ area: '0.07', coats: '3', coverage: '0.21', tinSize: '1' }, 1],
    [{ area: '0.3', coats: '1', coverage: '1', tinSize: '0.1' }, 3],
    [{ area: '0.300000001', coats: '1', coverage: '1', tinSize: '0.1' }, 4],
    [{ area: '0.000000001', coats: '1', coverage: '1', tinSize: '1' }, 1],
  ];
  for (const [plan, expectedTins] of cases) {
    const result = calculate(plan);
    assert.equal(result.valid, true, JSON.stringify(plan));
    assert.equal(result.tins, expectedTins, JSON.stringify(plan));
  }
});

test('litre display rounds upwards to three decimal places and removes trailing zeros', () => {
  const cases = [
    ['1', '3', '0.334'],
    ['1.2', '1', '1.2'],
    ['1.234', '1', '1.234'],
    ['1.234000001', '1', '1.235'],
    ['0.001', '1', '0.001'],
  ];
  for (const [area, coverage, expected] of cases) {
    const result = calculate(makePlan({ area, coats: '1', coverage }));
    assert.equal(result.valid, true);
    assert.equal(formatLitres(result), expected);
  }
});

test('a tiny positive quantity never displays as zero', () => {
  const result = calculate(makePlan({ area: '0.000000001', coats: '1', coverage: '1000000000' }));
  assert.equal(result.valid, true);
  assert.ok(result.litres > 0);
  assert.ok(['0.001', '< 0.001'].includes(formatLitres(result)));
  assert.equal(result.tins, 1);
});

test('all fields reject blank, negative, and nonfinite input', () => {
  for (const field of ['area', 'coats', 'coverage', 'tinSize']) {
    for (const value of ['', '   ', '-1', 'NaN', 'Infinity', '-Infinity', '1e309']) {
      expectInvalid(field, value);
    }
  }
});

test('coats must be a positive integer, while coverage and tin size must be positive', () => {
  for (const value of ['0', '0.5', '2.5']) expectInvalid('coats', value);
  expectInvalid('coverage', '0');
  expectInvalid('tinSize', '0');
});

test('supported decimal precision and maximum value have explicit boundaries', () => {
  const boundary = calculate(makePlan({ area: '1000000000', coverage: '0.000000001', tinSize: '1000000000' }));
  assert.equal(boundary.valid, true);
  assert.equal(boundary.tins, 2000000000);
  for (const field of ['area', 'coats', 'coverage', 'tinSize']) {
    expectInvalid(field, '1000000001');
    expectInvalid(field, '1000000000.000000001');
    expectInvalid(field, '1.0000000001', /precision|decimal|9/i);
  }
});

test('validation returns errors for every invalid field without altering the draft', () => {
  const plan = { area: '', coats: '2.5', coverage: '0', tinSize: '-1' };
  const before = { ...plan };
  const result = calculate(plan);
  assert.equal(result.valid, false);
  assert.deepEqual(Object.keys(result.errors).sort(), Object.keys(plan).sort());
  assert.deepEqual(plan, before);
});

test('missing saved data returns a fresh independent default plan', () => {
  const storage = memoryStorage();
  const result = readPlan(storage);
  assert.equal(result.state, 'new');
  assert.deepEqual(result.plan, DEFAULT_PLAN);
  assert.notEqual(result.plan, DEFAULT_PLAN);
  result.plan.area = '999';
  assert.equal(DEFAULT_PLAN.area, '24');
  assert.equal(storage.writes.length, 0);
});

test('saving and restoring uses a version 1 envelope and retains decimal draft text', () => {
  const storage = memoryStorage();
  const plan = makePlan({ area: '01.200', coats: '3', coverage: '10.50' });
  assert.equal(savePlan(storage, plan), true);
  const saved = JSON.parse(storage.value());
  assert.equal(saved.version, 1);
  assert.deepEqual(saved.plan, plan);
  const restored = readPlan(storage);
  assert.equal(restored.state, 'restored');
  assert.deepEqual(restored.plan, plan);
  assert.equal(storage.writes.length, 1);
});

test('an invalid draft survives save and reload so the user can correct it', () => {
  const storage = memoryStorage();
  const plan = { area: '', coats: '2.5', coverage: 'not a number', tinSize: '-1' };
  assert.equal(savePlan(storage, plan), true);
  assert.equal(calculate(plan).valid, false);
  const restored = readPlan(storage);
  assert.equal(restored.state, 'restored');
  assert.deepEqual(restored.plan, plan);
  assert.equal(calculate(restored.plan).valid, false);
});

test('invalid or unsupported stored envelopes are preserved without writes', () => {
  const values = [
    '{not JSON',
    'null',
    JSON.stringify({ version: 2, plan: DEFAULT_PLAN }),
    JSON.stringify({ version: 1, plan: { area: '24' } }),
    JSON.stringify({ version: 1, plan: { ...DEFAULT_PLAN, coverage: 12 } }),
  ];
  for (const value of values) {
    const storage = memoryStorage(value);
    const result = readPlan(storage);
    assert.equal(result.state, 'invalid', value);
    assert.deepEqual(result.plan, DEFAULT_PLAN);
    assert.equal(storage.value(), value);
    assert.equal(storage.writes.length, 0);
  }
});

test('blocked or missing storage fails safely without losing the in-memory plan', () => {
  const plan = makePlan({ area: '31' });
  const brokenRead = {
    getItem() { throw new Error('Storage is blocked'); },
    setItem() { throw new Error('Storage is blocked'); },
  };
  const brokenWrite = {
    getItem() { return null; },
    setItem() { throw new Error('Quota exceeded'); },
  };
  for (const storage of [undefined, null, brokenRead]) {
    const result = readPlan(storage);
    assert.equal(result.state, 'unavailable');
    assert.deepEqual(result.plan, DEFAULT_PLAN);
    assert.equal(savePlan(storage, plan), false);
  }
  assert.equal(savePlan(brokenWrite, plan), false);
  assert.equal(plan.area, '31');
});
