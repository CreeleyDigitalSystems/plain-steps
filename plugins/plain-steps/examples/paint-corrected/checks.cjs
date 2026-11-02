'use strict';

// Run with: node checks.cjs. No browser, packages, server or network needed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { DEFAULTS, STORAGE_KEY, calculate, loadPlan, savePlan } = require('./app.js');

let passed = 0;
function check(name, run) {
  run();
  passed++;
  console.log('PASS ' + name);
}
function plan(changes) { return { ...DEFAULTS, ...changes }; }
function memoryStorage(initial) {
  const values = new Map(Object.entries(initial || {}));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, value); }
  };
}

check('corrected 24 m² starting plan needs 4.8 L and 3 two-litre tins', () => {
  const result = calculate(DEFAULTS);
  assert.equal(result.litres, 4.8);
  assert.equal(result.tins, 3);
  assert.equal(result.total, 6);
});
check('all four edited values affect the result', () => {
  const result = calculate({ area: '36', coats: '3', coverage: '9', tin: '4' });
  assert.equal(result.litres, 12);
  assert.equal(result.tins, 3);
});
check('an exact full tin needs no extra tin', () => {
  assert.equal(calculate(plan({ area: '20' })).tins, 2);
});
check('even a small amount above a full tin needs the next tin', () => {
  assert.equal(calculate(plan({ area: '20.000000001' })).tins, 3);
});
check('decimal exact boundaries do not add an accidental tin', () => {
  assert.equal(calculate({ area: '0.14', coats: '1', coverage: '1', tin: '0.01' }).tins, 14);
  assert.equal(calculate({ area: '0.07', coats: '3', coverage: '0.3', tin: '0.1' }).tins, 7);
});
check('decimal values just above a boundary round up', () => {
  assert.equal(calculate({ area: '0.140000000001', coats: '1', coverage: '1', tin: '0.01' }).tins, 15);
});
check('scientific notation can be calculated', () => {
  const result = calculate({ area: '2.4e1', coats: '2', coverage: '1e1', tin: '2e0' });
  assert.equal(result.litres, 4.8);
  assert.equal(result.tins, 3);
});
check('empty, zero, negative and non-numeric fields have useful errors', () => {
  for (const field of Object.keys(DEFAULTS)) {
    for (const value of ['', ' ', '0', '-1', 'nope', 'Infinity', '1e999']) {
      const result = calculate(plan({ [field]: value }));
      assert.ok(result.errors[field], field + '=' + value);
      assert.equal(result.litres, undefined);
    }
  }
});
check('fractional and unsafe coat counts are rejected', () => {
  assert.ok(calculate(plan({ coats: '1.5' })).errors.coats);
  assert.ok(calculate(plan({ coats: '9007199254740992' })).errors.coats);
});
check('out-of-range results produce an error instead of Infinity or zero', () => {
  assert.ok(calculate(plan({ area: '1e308', coverage: '1e-308' })).error);
  assert.ok(calculate(plan({ area: '1e-308', coverage: '1e308' })).error);
  assert.ok(calculate(plan({ tin: '1e-30' })).error);
});
check('fresh storage loads the corrected defaults', () => {
  const loaded = loadPlan(memoryStorage());
  assert.equal(loaded.state, 'new');
  assert.deepEqual(loaded.values, DEFAULTS);
});
check('edited plan survives save and reload', () => {
  const storage = memoryStorage();
  const edited = { area: '32.5', coats: '3', coverage: '11', tin: '5' };
  assert.equal(savePlan(storage, edited), true);
  assert.deepEqual(loadPlan(storage).values, edited);
});
check('an unfinished draft survives save and reload', () => {
  const storage = memoryStorage();
  const draft = plan({ area: '' });
  assert.equal(savePlan(storage, draft), true);
  assert.deepEqual(loadPlan(storage).values, draft);
});
check('denied storage is reported rather than claimed saved', () => {
  const storage = { getItem() { throw new Error('Denied'); }, setItem() { throw new Error('Denied'); } };
  assert.equal(loadPlan(storage).state, 'unavailable');
  assert.equal(savePlan(storage, DEFAULTS), false);
  assert.equal(savePlan(null, DEFAULTS), false);
});
check('a storage write that does not stick is reported', () => {
  assert.equal(savePlan({ setItem() {}, getItem() { return null; } }, DEFAULTS), false);
});
check('corrupt and incompatible saved plans are handled', () => {
  for (const raw of ['bad JSON', 'null', '{"version":2}', '{"version":1,"values":{}}']) {
    assert.equal(loadPlan(memoryStorage({ [STORAGE_KEY]: raw })).state, 'unavailable');
  }
});

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');

// A deliberately small DOM stand-in checks event wiring and UI states only.
// This does not establish browser rendering, native number input or real storage.
function mount(storage) {
  const elements = {};
  for (const match of html.matchAll(/\bid="([^"]+)"/g)) {
    elements[match[1]] = {
      value: '', textContent: '', hidden: false, dataset: {}, attributes: {}, listeners: {},
      setAttribute(name, value) { this.attributes[name] = value; },
      addEventListener(name, run) { this.listeners[name] = run; }
    };
  }
  vm.runInNewContext(script, {
    document: { getElementById(id) { assert.ok(elements[id], 'Missing element ' + id); return elements[id]; } },
    window: { localStorage: storage }
  });
  return elements;
}

check('authored starting fields and results match the corrected plan', () => {
  const starting = { area: '24', coats: '2', coverage: '10', tin: '2' };
  for (const [field, value] of Object.entries(starting)) {
    assert.match(html, new RegExp('<input\\b[^>]*\\bid="' + field + '"[^>]*\\bvalue="' + value + '"'));
  }
  assert.match(html, /<output id="litres"[^>]*>4\.8<\/output>/);
  assert.match(html, /<output id="tins"[^>]*>3<\/output>/);
  assert.match(html, /id="tin-detail">3 × 2 L = 6 L to take home</);
  assert.match(html, /id="formula">24 m² × 2 coats ÷ 10 m²\/L = 4\.8 L</);
});
check('existing user plans keep their values, including the previous starting values', () => {
  for (const values of [
    { area: '24', coats: '2', coverage: '12', tin: '2.5' },
    { area: '32.5', coats: '3', coverage: '11', tin: '5' }
  ]) {
    const raw = JSON.stringify({ version: 1, values });
    const storage = memoryStorage({ 'paint-plan.room.v1': raw });
    assert.equal(loadPlan(storage).state, 'loaded');
    const elements = mount(storage);
    for (const [field, value] of Object.entries(values)) assert.equal(elements[field].value, value);
    const result = calculate(values);
    assert.equal(elements.litres.textContent, new Intl.NumberFormat('en-AU', { maximumFractionDigits: 6 }).format(result.litres));
    assert.equal(elements.tins.textContent, String(result.tins));
    assert.equal(storage.getItem('paint-plan.room.v1'), raw);
  }
});
check('existing drafts retain blank fields and previous values, and remain editable', () => {
  const previous = { area: '24', coats: '2', coverage: '12', tin: '2.5' };
  for (const blankField of Object.keys(previous)) {
    const values = { ...previous, [blankField]: '' };
    const raw = JSON.stringify({ version: 1, values });
    const storage = memoryStorage({ 'paint-plan.room.v1': raw });
    const elements = mount(storage);
    for (const [field, value] of Object.entries(values)) assert.equal(elements[field].value, value);
    assert.equal(elements.litres.textContent, '—');
    assert.equal(elements[blankField + '-error'].hidden, false);
    assert.match(elements['save-message'].textContent, /Draft saved/);
    assert.equal(storage.getItem('paint-plan.room.v1'), raw);
    elements[blankField].value = previous[blankField];
    elements['paint-form'].listeners.input();
    const reopened = mount(storage);
    assert.equal(reopened[blankField].value, previous[blankField]);
    assert.equal(reopened.litres.textContent, '4');
    assert.equal(reopened.tins.textContent, '2');
  }
});
check('interface starts with 4.8 litres and 3 tins, then reacts to edits', () => {
  const elements = mount(memoryStorage());
  for (const [field, value] of Object.entries({ area: '24', coats: '2', coverage: '10', tin: '2' })) {
    assert.equal(elements[field].value, value);
  }
  assert.equal(elements.litres.textContent, '4.8');
  assert.equal(elements.tins.textContent, '3');
  assert.equal(elements['tin-detail'].textContent, '3 × 2 L = 6 L to take home');
  assert.equal(elements.formula.textContent, '24 m² × 2 coats ÷ 10 m²/L = 4.8 L');
  elements.area.value = '60';
  elements['paint-form'].listeners.input();
  assert.equal(elements.litres.textContent, '12');
  assert.equal(elements.tins.textContent, '6');
});
check('new interface instance restores the edited plan', () => {
  const storage = memoryStorage();
  const first = mount(storage);
  first.area.value = '60';
  first['paint-form'].listeners.input();
  const reopened = mount(storage);
  assert.equal(reopened.area.value, '60');
  assert.equal(reopened.litres.textContent, '12');
  assert.equal(reopened.tins.textContent, '6');
});
check('invalid input clears stale results, shows errors and restores draft', () => {
  const storage = memoryStorage();
  const elements = mount(storage);
  elements.coverage.value = '';
  elements['paint-form'].listeners.input();
  assert.equal(elements.litres.textContent, '—');
  assert.equal(elements['coverage-error'].hidden, false);
  assert.equal(elements.coverage.attributes['aria-invalid'], 'true');
  assert.match(elements['save-message'].textContent, /Draft saved/);
  assert.equal(mount(storage).coverage.value, '');
  elements.coverage.value = '10';
  elements['paint-form'].listeners.input();
  assert.equal(elements['coverage-error'].hidden, true);
  assert.equal(elements.litres.textContent, '4.8');
});
check('save failures are visible and calculation still works', () => {
  const elements = mount(null);
  elements.area.value = '60';
  elements['paint-form'].listeners.input();
  assert.equal(elements.litres.textContent, '12');
  assert.equal(elements['save-note'].dataset.state, 'error');
  assert.match(elements['save-message'].textContent, /Couldn’t save/);
});
check('opening a corrupt record does not overwrite it', () => {
  const storage = memoryStorage({ [STORAGE_KEY]: 'corrupt record' });
  const elements = mount(storage);
  assert.equal(storage.getItem(STORAGE_KEY), 'corrupt record');
  assert.match(elements['save-message'].textContent, /Couldn’t restore/);
});
check('pressing Enter is handled without navigating away', () => {
  const elements = mount(memoryStorage());
  let prevented = false;
  elements['paint-form'].listeners.submit({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
});
check('single-tin result uses singular copy', () => {
  const elements = mount(memoryStorage());
  elements.tin.value = '5';
  elements['paint-form'].listeners.input();
  assert.equal(elements.tins.textContent, '1');
  assert.equal(elements['tin-label'].textContent, 'tin');
});
check('all linked resources are local and present', () => {
  const resources = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(match => match[1]);
  assert.ok(resources.length > 0);
  for (const resource of resources) {
    assert.ok(!/^(?:https?:|\/\/|data:)/i.test(resource), resource);
    assert.ok(fs.existsSync(path.join(__dirname, resource)), resource);
  }
  assert.ok(!/@import|url\(/i.test(css));
  assert.ok(!/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\b|https?:\/\//.test(script));
  assert.match(html, /connect-src 'none'/);
});

console.log('\n' + passed + ' checks passed. Browser interactions and real browser persistence remain unverified.');
