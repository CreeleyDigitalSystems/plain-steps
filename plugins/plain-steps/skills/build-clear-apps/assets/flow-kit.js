/* Plain Steps native flow utilities. No network, evaluation of code or external dependencies. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PlainSteps = api;
})(typeof globalThis === "object" ? globalThis : this, function () {
  "use strict";
  const copy = (value) => JSON.parse(JSON.stringify(value));
  const own = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
  const isObject = (value) => !!value && typeof value === "object" && !Array.isArray(value);
  const operations = { add: [2, 12], subtract: [2, 2], multiply: [2, 12], divide: [2, 2], min: [2, 12], max: [2, 12], negate: [1, 1] };
  const badKeys = new Set(["__proto__", "prototype", "constructor"]);

  function validateContract(contract) {
    const errors = [];
    const text = (v, name, max = 180) => { if (typeof v !== "string" || !v.trim() || v.length > max) errors.push(`${name} must be nonempty text up to ${max} characters.`); };
    if (!isObject(contract)) return ["Contract must be an object."];
    const allowed = new Set(["id", "title", "startLabel", "resumeLabel", "calculateLabel", "resultLabel", "unit", "precision", "fields", "formula", "explanation", "density", "locale"]);
    if (Object.keys(contract).some((key) => !allowed.has(key))) errors.push("Contract has unsupported fields.");
    text(contract.id, "id", 60);
    if (typeof contract.id === "string" && !/^[a-z][a-z0-9-]{0,59}$/.test(contract.id)) errors.push("id must be a lowercase stable slug.");
    ["title", "startLabel", "resumeLabel", "calculateLabel", "resultLabel"].forEach((key) => text(contract[key], key));
    if (contract.unit !== undefined && (typeof contract.unit !== "string" || contract.unit.length > 40)) errors.push("unit must be text up to 40 characters.");
    if (!Number.isInteger(contract.precision) || contract.precision < 0 || contract.precision > 6) errors.push("precision must be an integer from 0 to 6.");
    if (contract.explanation !== undefined && (typeof contract.explanation !== "string" || contract.explanation.length > 1200)) errors.push("explanation is limited to 1200 characters.");
    if (contract.density !== undefined && !["comfortable", "compact"].includes(contract.density)) errors.push("density must be comfortable or compact.");
    if (contract.locale !== undefined) { try { if (typeof contract.locale !== "string") throw new Error(); new Intl.NumberFormat(contract.locale); } catch (_) { errors.push("locale must be a supported language tag."); } }
    const ids = new Set();
    if (!Array.isArray(contract.fields) || contract.fields.length < 1 || contract.fields.length > 12) errors.push("Use 1 to 12 numeric fields; a larger task needs a different flow.");
    else for (const field of contract.fields) {
      if (!isObject(field)) { errors.push("Each field must be an object."); continue; }
      if (Object.keys(field).some((key) => !["id", "label", "help", "min", "max", "integer", "default"].includes(key))) errors.push("A numeric field has unsupported properties.");
      if (typeof field.id !== "string" || !/^[a-z][a-z0-9_-]{0,39}$/.test(field.id) || badKeys.has(field.id) || ids.has(field.id)) errors.push("Numeric field IDs must be unique safe names.");
      else ids.add(field.id);
      text(field.label, "field label");
      if (field.help !== undefined && (typeof field.help !== "string" || field.help.length > 300)) errors.push("Field help is limited to 300 characters.");
      for (const bound of ["min", "max"]) if (field[bound] !== undefined && !Number.isFinite(field[bound])) errors.push(`${bound} must be a finite number.`);
      if (field.min !== undefined && field.max !== undefined && field.min > field.max) errors.push("A field minimum exceeds its maximum.");
      if (field.integer !== undefined && typeof field.integer !== "boolean") errors.push("integer must be boolean.");
      if (field.default !== undefined && (!Number.isFinite(field.default) || (field.min !== undefined && field.default < field.min) || (field.max !== undefined && field.default > field.max) || (field.integer && !Number.isInteger(field.default)))) errors.push("A field default must satisfy its numeric constraints.");
    }
    let nodes = 0;
    function expression(node, depth) {
      nodes++;
      if (nodes > 128 || depth > 12) { errors.push("Formula is too large or deeply nested."); return; }
      if (typeof node === "number") { if (!Number.isFinite(node)) errors.push("Formula constants must be finite."); return; }
      if (!isObject(node)) { errors.push("Formula must use numeric constants, field references or supported operation objects; code strings are not accepted."); return; }
      if (own(node, "field")) {
        if (Object.keys(node).length !== 1 || !ids.has(node.field)) errors.push("Formula refers to an unknown field.");
        return;
      }
      const range = own(operations, node.op) ? operations[node.op] : null;
      if (!range || Object.keys(node).sort().join(",") !== "args,op" || !Array.isArray(node.args) || node.args.length < range[0] || node.args.length > range[1]) { errors.push("Formula has an unsupported operation or argument count."); return; }
      node.args.forEach((arg) => expression(arg, depth + 1));
    }
    expression(contract.formula, 0);
    return [...new Set(errors)];
  }

  function calculate(contract, raw) {
    const contractErrors = validateContract(contract);
    if (contractErrors.length) return { ok: false, errors: {}, message: "The calculation contract needs correction.", contractErrors };
    const values = Object.create(null), errors = {};
    for (const field of contract.fields) {
      const text = raw && own(raw, field.id) ? String(raw[field.id]).trim() : "";
      if (!text) errors[field.id] = `Enter ${field.label.toLowerCase()}.`;
      else if (text.length > 100 || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text) || !Number.isFinite(Number(text))) errors[field.id] = `Enter a finite number for ${field.label.toLowerCase()}.`;
      else {
        const value = Number(text);
        if (field.integer && !Number.isInteger(value)) errors[field.id] = `Use a whole number for ${field.label.toLowerCase()}.`;
        else if (field.min !== undefined && value < field.min) errors[field.id] = `Use ${field.min} or more for ${field.label.toLowerCase()}.`;
        else if (field.max !== undefined && value > field.max) errors[field.id] = `Use ${field.max} or less for ${field.label.toLowerCase()}.`;
        else values[field.id] = value;
      }
    }
    if (Object.keys(errors).length) return { ok: false, errors, message: "Check the marked values. Your entries are still here." };
    function evaluate(node) {
      if (typeof node === "number") return node;
      if (own(node, "field")) return values[node.field];
      const args = node.args.map(evaluate);
      let result;
      switch (node.op) {
        case "add": result = args.reduce((a, b) => a + b, 0); break;
        case "subtract": result = args[0] - args[1]; break;
        case "multiply": result = args.reduce((a, b) => a * b, 1); break;
        case "divide": if (args[1] === 0) throw new Error("Cannot divide by zero. Check the values used as a divisor."); result = args[0] / args[1]; break;
        case "min": result = Math.min(...args); break;
        case "max": result = Math.max(...args); break;
        case "negate": result = -args[0]; break;
        default: throw new Error("Unsupported calculation.");
      }
      if (!Number.isFinite(result)) throw new Error("The result is outside the supported numeric range. Check the entered values.");
      return result;
    }
    try {
      const value = evaluate(contract.formula);
      const formatted = new Intl.NumberFormat(contract.locale || "en", { minimumFractionDigits: contract.precision, maximumFractionDigits: contract.precision }).format(value);
      return { ok: true, value, formatted, errors: {} };
    } catch (error) { return { ok: false, errors: {}, message: error.message }; }
  }

  function createStore(options) {
    if (!options || typeof options.key !== "string" || !options.key.trim() || typeof options.validate !== "function" || !options.validate(options.initial)) throw new Error("A store needs a key, valid initial data and a validator.");
    let data = copy(options.initial), lastRaw = null, attemptedRaw = null, mode = "fresh", storage;
    const messages = {
      fresh: "No saved work yet. Changes will be saved in this browser when available.",
      saved: "Saved on this device in this browser.",
      failed: "We couldn’t confirm the save. Keep this page open to retain these changes, then try saving again.",
      unavailable: "Browser saving is unavailable. Changes stay only while this page is open.",
      unreadable: "Saved work could not be read. The saved copy has not been changed; new changes stay only while this page is open.",
      conflict: "Saved work changed elsewhere. This page has not overwritten it. Keep this page open to retain these changes; reopen to read the saved copy."
    };
    try {
      storage = typeof options.storage === "function" ? options.storage() : options.storage;
      if (!storage || typeof storage.getItem !== "function" || typeof storage.setItem !== "function") throw new Error("Storage unavailable");
      lastRaw = storage.getItem(options.key);
      if (lastRaw !== null) {
        const envelope = JSON.parse(lastRaw);
        if (!isObject(envelope) || Object.keys(envelope).sort().join(",") !== "data,version" || envelope.version !== 1 || !options.validate(envelope.data)) { mode = "unreadable"; }
        else { data = copy(envelope.data); mode = "saved"; }
      }
    } catch (_) { mode = storage && lastRaw !== null ? "unreadable" : "unavailable"; }
    const status = () => ({ mode, message: messages[mode], saved: mode === "saved", retryable: mode === "failed" });
    function persist() {
      if (["unreadable", "unavailable", "conflict"].includes(mode)) return status();
      try {
        const current = storage.getItem(options.key);
        if (attemptedRaw !== null && current === attemptedRaw) {
          // A completed write can be followed by a failed readback. Reconcile
          // that exact attempt before deciding whether a new write is needed.
          lastRaw = current;
          attemptedRaw = null;
        } else if (current !== lastRaw) { mode = "conflict"; return status(); }
        const serialized = JSON.stringify({ version: 1, data });
        if (current === serialized) { lastRaw = current; attemptedRaw = null; mode = "saved"; return status(); }
        attemptedRaw = serialized;
        storage.setItem(options.key, serialized);
        if (storage.getItem(options.key) !== serialized) mode = "conflict";
        else { lastRaw = serialized; attemptedRaw = null; mode = "saved"; }
      } catch (_) { mode = "failed"; }
      return status();
    }
    return {
      read: () => copy(data), status,
      write(next) { if (!options.validate(next)) throw new Error("Invalid app data; saved state unchanged."); data = copy(next); return persist(); },
      retry: persist,
      externalChange(event) {
        if (!event || (event.storageArea && event.storageArea !== storage)) return status();
        const cleared = event.key === null;
        const changed = event.key === options.key && (attemptedRaw !== null || event.newValue !== lastRaw);
        if (cleared || changed) mode = "conflict";
        return status();
      }
    };
  }

  function announce(region, message) {
    if (!region) return;
    const child = region.ownerDocument.createElement("span");
    child.textContent = message;
    region.replaceChildren(child);
  }
  function updateStatus(region, message) {
    if (!region || region.textContent === message) return false;
    region.textContent = message;
    return true;
  }
  function showView(views, name, target) {
    if (!own(views, name)) throw new Error("Unknown view.");
    Object.entries(views).forEach(([id, node]) => { node.hidden = id !== name; });
    if (target) target.focus();
  }
  function fieldError(input, element, message) {
    element.textContent = message || "";
    element.hidden = !message;
    if (message) input.setAttribute("aria-invalid", "true"); else input.removeAttribute("aria-invalid");
  }
  return { validateContract, calculate, createStore, announce, updateStatus, showView, fieldError };
});
