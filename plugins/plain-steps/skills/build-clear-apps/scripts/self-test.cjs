#!/usr/bin/env node
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const vm = require("node:vm");
const { spawnSync } = require("node:child_process");
const { validateContract, calculate, createStore, updateStatus } = require("../assets/flow-kit.js");
const { scaffold } = require("./scaffold.cjs");
const paint = JSON.parse(fs.readFileSync(path.join(__dirname, "../assets/calculation-contract.example.json"), "utf8"));
const copy = (value) => JSON.parse(JSON.stringify(value));
const results = [];
function check(name, body) { body(); results.push({ name, passed: true }); }
function memory(initial = null) {
  let value = initial;
  const storage = { getItem: () => value, setItem: (_, next) => { value = next; } };
  return { storage, value: () => value, external: (next) => { value = next; } };
}
const validData = (data) => !!data && Object.keys(data).join(",") === "amount" && Number.isFinite(data.amount);
const storeWith = (mem) => createStore({ key: "fictional-local-state", initial: { amount: 0 }, validate: validData, storage: mem.storage });
const base = process.env.PLAIN_STEPS_TEST_DIR ? path.resolve(process.env.PLAIN_STEPS_TEST_DIR) : os.tmpdir();
fs.mkdirSync(base, { recursive: true });
const temporary = fs.mkdtempSync(path.join(base, "plain-steps-self-test-"));
try {
  check("independently known paint arithmetic and exact displayed precision", () => {
    assert.deepEqual(validateContract(paint), []);
    const answer = calculate(paint, { area: "20", coats: "2", coverage: "10" });
    assert.equal(answer.ok, true); assert.equal(answer.value, 4); assert.equal(answer.formatted, "4.0");
  });
  check("different-domain recipe scaling uses the same explicit engine", () => {
    const recipe = { id: "recipe-example", title: "Scale a recipe", startLabel: "Scale ingredients", resumeLabel: "Continue recipe", calculateLabel: "Calculate flour", resultLabel: "Flour needed", unit: "grams", precision: 0, fields: [{ id: "flour", label: "Original flour (grams)", min: 0 }, { id: "original", label: "Original servings", min: 1 }, { id: "wanted", label: "Servings wanted", min: 1 }], formula: { op: "multiply", args: [{ field: "flour" }, { op: "divide", args: [{ field: "wanted" }, { field: "original" }] }] } };
    assert.equal(calculate(recipe, { flour: "250", original: "4", wanted: "6" }).value, 375);
    assert.equal(calculate(recipe, { flour: "250", original: "4", wanted: "2" }).value, 125);
  });
  check("invalid/blank/whole-number/range inputs report their field without mutation", () => {
    const raw = { area: "", coats: "1.5", coverage: "0" }, before = copy(raw);
    const answer = calculate(paint, raw);
    assert.equal(answer.ok, false); assert.deepEqual(Object.keys(answer.errors).sort(), ["area", "coats", "coverage"]); assert.deepEqual(raw, before);
    assert.equal(calculate(paint, { area: "<script>", coats: "2", coverage: "10" }).ok, false);
  });
  check("divide-by-zero and overflow are recoverable calculation errors", () => {
    const contract = copy(paint); delete contract.fields[2].min;
    assert.match(calculate(contract, { area: "20", coats: "2", coverage: "0" }).message, /zero/);
    const overflow = { ...copy(paint), fields: [{ id: "x", label: "Value" }], formula: { op: "multiply", args: [{ field: "x" }, { field: "x" }] } };
    assert.equal(calculate(overflow, { x: "1e308" }).ok, false);
  });
  check("code strings, prototype names, unknown variables and oversized trees are refused", () => {
    for (const formula of ["process.exit()", { op: "constructor", args: [1, 2] }, { field: "unknown" }]) assert.ok(validateContract({ ...copy(paint), formula }).length);
    const bad = copy(paint); bad.fields[0].id = "__proto__"; assert.ok(validateContract(bad).length);
    let formula = 1; for (let i = 0; i < 20; i++) formula = { op: "negate", args: [formula] };
    assert.ok(validateContract({ ...copy(paint), formula }).length);
  });
  check("a fresh store makes no false save claim; write/readback and reload succeed", () => {
    const mem = memory(), store = storeWith(mem);
    assert.equal(store.status().saved, false); assert.equal(mem.value(), null);
    assert.equal(store.write({ amount: 12 }).saved, true);
    assert.equal(storeWith(mem).read().amount, 12); assert.equal(storeWith(mem).status().saved, true);
    const external = store.read(); external.amount = 88; assert.equal(store.read().amount, 12);
  });
  check("corrupt and future-version storage stays untouched while session work continues", () => {
    for (const raw of ["{bad json", JSON.stringify({ version: 2, data: { amount: 7 } }), JSON.stringify({ version: 1, data: { amount: "wrong" } })]) {
      const mem = memory(raw), store = storeWith(mem);
      assert.equal(store.status().mode, "unreadable"); store.write({ amount: 9 });
      assert.equal(store.read().amount, 9); assert.equal(mem.value(), raw); assert.equal(store.status().saved, false);
    }
  });
  check("read denial never leads to an overwrite attempt", () => {
    let writes = 0;
    const store = createStore({ key: "read-denied", initial: { amount: 0 }, validate: validData, storage: { getItem() { throw new Error("denied"); }, setItem() { writes++; } } });
    assert.equal(store.status().mode, "unavailable"); store.write({ amount: 1 }); assert.equal(writes, 0);
  });
  check("write failure retains session state and a retry succeeds when safe", () => {
    const mem = memory(); let fail = true;
    const storage = { getItem: mem.storage.getItem, setItem(key, value) { if (fail) throw new Error("full"); mem.storage.setItem(key, value); } };
    const store = createStore({ key: "write-retry", initial: { amount: 0 }, validate: validData, storage });
    assert.equal(store.write({ amount: 5 }).mode, "failed"); assert.equal(store.read().amount, 5);
    fail = false; assert.equal(store.retry().saved, true); assert.ok(mem.value().includes('"amount":5'));
  });
  check("a completed write with failed readback reconciles without a duplicate write", () => {
    const mem = memory(); let writes = 0, failReadback = false;
    const storage = {
      getItem(key) { if (failReadback) { failReadback = false; throw new Error("readback unavailable"); } return mem.storage.getItem(key); },
      setItem(key, value) { writes++; mem.storage.setItem(key, value); if (writes === 1) failReadback = true; }
    };
    const store = createStore({ key: "uncertain-readback", initial: { amount: 0 }, validate: validData, storage });
    assert.equal(store.write({ amount: 5 }).mode, "failed");
    assert.equal(store.status().saved, false);
    assert.equal(store.retry().saved, true);
    assert.equal(writes, 1);
    assert.equal(storeWith(mem).read().amount, 5);
  });
  check("an ambiguous write never overwrites different competing data on retry", () => {
    const mem = memory(); let writes = 0, failReadback = false;
    const storage = {
      getItem(key) { if (failReadback) { failReadback = false; throw new Error("readback unavailable"); } return mem.storage.getItem(key); },
      setItem(key, value) { writes++; mem.storage.setItem(key, value); failReadback = true; }
    };
    const store = createStore({ key: "uncertain-conflict", initial: { amount: 0 }, validate: validData, storage });
    assert.equal(store.write({ amount: 5 }).mode, "failed");
    const competing = JSON.stringify({ version: 1, data: { amount: 99 } }); mem.external(competing);
    assert.equal(store.retry().mode, "conflict");
    assert.equal(writes, 1); assert.equal(mem.value(), competing);
  });
  check("an external deletion after an ambiguous write is never recreated by retry", () => {
    const mem = memory(); let writes = 0, failReadback = false;
    const storage = {
      getItem(key) { if (failReadback) { failReadback = false; throw new Error("readback unavailable"); } return mem.storage.getItem(key); },
      setItem(key, value) { writes++; mem.storage.setItem(key, value); failReadback = true; }
    };
    const store = createStore({ key: "uncertain-deletion", initial: { amount: 0 }, validate: validData, storage });
    assert.equal(store.write({ amount: 5 }).mode, "failed");
    const removed = mem.value(); mem.external(null);
    assert.equal(store.externalChange({ key: "uncertain-deletion", oldValue: removed, newValue: null, storageArea: storage }).mode, "conflict");
    assert.equal(store.retry().mode, "conflict");
    assert.equal(writes, 1); assert.equal(mem.value(), null);
  });
  check("a clear event invalidates saved status without reacting to another storage area", () => {
    const mem = memory(), store = storeWith(mem); store.write({ amount: 3 });
    assert.equal(store.externalChange({ key: null, oldValue: null, newValue: null, storageArea: {} }).saved, true);
    mem.external(null);
    assert.equal(store.externalChange({ key: null, oldValue: null, newValue: null, storageArea: mem.storage }).mode, "conflict");
    assert.equal(store.status().saved, false); assert.equal(store.retry().mode, "conflict"); assert.equal(mem.value(), null);
  });
  check("detected competing save is preserved rather than overwritten", () => {
    const mem = memory(), store = storeWith(mem); store.write({ amount: 4 });
    const other = JSON.stringify({ version: 1, data: { amount: 99 } }); mem.external(other);
    assert.equal(store.write({ amount: 8 }).mode, "conflict"); assert.equal(mem.value(), other); assert.equal(store.read().amount, 8);
  });
  check("invalid app data is refused without changing the prior data or save", () => {
    const mem = memory(), store = storeWith(mem); store.write({ amount: 3 }); const raw = mem.value();
    assert.throws(() => store.write({ amount: "broken" })); assert.equal(store.read().amount, 3); assert.equal(mem.value(), raw);
  });
  check("unchanged save status does not repeatedly mutate a live region", () => {
    let text = "", changes = 0;
    const region = { get textContent() { return text; }, set textContent(value) { text = value; changes++; } };
    assert.equal(updateStatus(region, "Saved on this device."), true);
    assert.equal(updateStatus(region, "Saved on this device."), false);
    assert.equal(updateStatus(region, "Not saved. Try again."), true);
    assert.equal(updateStatus(region, "Saved on this device."), true);
    assert.equal(changes, 3);
    assert.equal(updateStatus(null, "Saved on this device."), false);
  });
  check("scaffolder generates local linked files and a valid arithmetic contract", () => {
    const target = scaffold(paint, path.join(temporary, "paint"));
    const expected = ["README.md", "app.js", "calculation-contract.json", "contract.js", "flow-kit.js", "flow.css", "index.html"];
    assert.deepEqual(fs.readdirSync(target).sort(), expected);
    const html = fs.readFileSync(path.join(target, "index.html"), "utf8");
    for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) if (!match[1].startsWith("#")) assert.ok(fs.existsSync(path.join(target, match[1])));
    const sandbox = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(target, "contract.js"), "utf8"), sandbox);
    assert.equal(calculate(sandbox.window.PlainStepsContract, { area: "20", coats: "2", coverage: "10" }).value, 4);
    for (const file of ["app.js", "contract.js", "flow-kit.js"]) assert.equal(spawnSync(process.execPath, ["--check", path.join(target, file)]).status, 0);
  });
  check("existing destinations and executable formula strings cannot replace files", () => {
    const target = path.join(temporary, "existing"); fs.mkdirSync(target); fs.writeFileSync(path.join(target, "original.txt"), "preserve me");
    assert.throws(() => scaffold(paint, target), /already exists/); assert.equal(fs.readFileSync(path.join(target, "original.txt"), "utf8"), "preserve me");
    const next = path.join(temporary, "not-created"); assert.throws(() => scaffold({ ...copy(paint), formula: "eval('x')" }, next)); assert.equal(fs.existsSync(next), false);
  });
  check("untrusted label text remains data in generated JavaScript", () => {
    const altered = copy(paint); altered.title = "</script><img src=x onerror=alert(1)>";
    const target = scaffold(altered, path.join(temporary, "data-label"));
    const script = fs.readFileSync(path.join(target, "contract.js"), "utf8"); assert.equal(script.includes("</script>"), false);
    const sandbox = { window: {} }; vm.runInNewContext(script, sandbox); assert.equal(sandbox.window.PlainStepsContract.title, altered.title);
    assert.equal(fs.readFileSync(path.join(target, "index.html"), "utf8").includes(altered.title), false);
  });
  process.stdout.write(JSON.stringify({ passed: results.length, results, limits: ["Pure arithmetic/state/generation checks only; no browser was opened.", "Keyboard, focus, layout, screen-reader and participant behaviour remain unverified."] }, null, 2) + "\n");
} finally { fs.rmSync(temporary, { recursive: true, force: true }); }
