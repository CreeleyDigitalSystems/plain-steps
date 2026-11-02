/* No dependencies or network calls. Works as a classic script from index.html. */
(function () {
  "use strict";

  const DEFAULT_PLAN = Object.freeze({ area: "24", coats: "2", coverage: "12", tinSize: "2.5" });
  const STORAGE_KEY = "room-for-colour.paint-plan.v1";
  const FIELDS = Object.keys(DEFAULT_PLAN);
  const LABELS = { area: "wall area", coats: "number of coats", coverage: "paint coverage", tinSize: "tin size" };

  function parseDecimal(value) {
    const text = String(value ?? "").trim();
    if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(text) || text.length > 32) return null;
    const [whole = "0", fraction = ""] = text.split(".");
    if (fraction.length > 9) return null;
    const integer = BigInt((whole || "0") + fraction);
    const scale = 10n ** BigInt(fraction.length);
    if (integer > 1000000000n * scale) return null;
    return { integer, scale };
  }

  function calculate(plan) {
    const errors = {};
    const values = {};
    for (const field of FIELDS) {
      const raw = String(plan?.[field] ?? "").trim();
      const decimal = parseDecimal(raw);
      if (!raw) {
        errors[field] = `Enter the ${LABELS[field]}.`;
      } else if (!decimal) {
        errors[field] = "Use a number from 0 to 1,000,000,000 with up to 9 decimal places.";
      } else if (field !== "area" && decimal.integer === 0n) {
        errors[field] = field === "coats" ? "Enter at least 1 coat." : "Enter a number greater than 0.";
      } else if (field === "coats" && decimal.integer % decimal.scale !== 0n) {
        errors[field] = "Enter a whole number of coats, at least 1.";
      } else {
        values[field] = decimal;
      }
    }
    if (Object.keys(errors).length) return { valid: false, errors };

    const { area, coats, coverage, tinSize } = values;
    // Exact decimal fractions protect whole-tin boundaries from floating-point error.
    const numerator = area.integer * coats.integer * coverage.scale;
    const denominator = area.scale * coats.scale * coverage.integer;
    const tinNumerator = numerator * tinSize.scale;
    const tinDenominator = denominator * tinSize.integer;
    const exactTins = (tinNumerator + tinDenominator - 1n) / tinDenominator;
    if (exactTins > BigInt(Number.MAX_SAFE_INTEGER)) {
      return { valid: false, errors: { calculation: "This result is too large to show safely. Check your numbers." } };
    }
    return { valid: true, litres: Number(numerator) / Number(denominator), tins: Number(exactTins), numerator, denominator };
  }

  function formatLitres(calculation) {
    if (!calculation.valid) return "—";
    const { numerator, denominator } = calculation;
    const thousandths = (numerator * 1000n + denominator - 1n) / denominator;
    if (numerator > 0n && numerator * 1000n < denominator) return "< 0.001";
    const whole = thousandths / 1000n;
    const fraction = String(thousandths % 1000n).padStart(3, "0").replace(/0+$/, "");
    return fraction ? `${whole}.${fraction}` : String(whole);
  }

  function isPlan(value) {
    return value && typeof value === "object" && FIELDS.every(field => typeof value[field] === "string" && value[field].length <= 80);
  }

  function copyPlan(plan) {
    return Object.fromEntries(FIELDS.map(field => [field, plan[field]]));
  }

  function readPlan(storage) {
    try {
      const saved = storage.getItem(STORAGE_KEY);
      if (saved === null) return { plan: copyPlan(DEFAULT_PLAN), state: "new" };
      let envelope;
      try { envelope = JSON.parse(saved); } catch { return { plan: copyPlan(DEFAULT_PLAN), state: "invalid" }; }
      if (envelope?.version !== 1 || !isPlan(envelope.plan)) return { plan: copyPlan(DEFAULT_PLAN), state: "invalid" };
      return { plan: copyPlan(envelope.plan), state: "restored" };
    } catch {
      return { plan: copyPlan(DEFAULT_PLAN), state: "unavailable" };
    }
  }

  function savePlan(storage, plan) {
    if (!isPlan(plan)) return false;
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, plan: copyPlan(plan) }));
      return true;
    } catch {
      return false;
    }
  }

  function initialise() {
    const form = document.getElementById("paint-form");
    if (!form) return;
    let storage;
    try { storage = window.localStorage; } catch { storage = null; }
    const saved = readPlan(storage);
    const inputs = Object.fromEntries(FIELDS.map(field => [field, document.getElementById(field)]));
    for (const field of FIELDS) inputs[field].value = saved.plan[field];

    const status = document.getElementById("save-status");
    const litresOutput = document.getElementById("litres-result");
    const tinsOutput = document.getElementById("tins-result");
    const coatsDetail = document.getElementById("coats-detail");
    const tinDetail = document.getElementById("tin-detail");
    const calculationError = document.getElementById("calculation-error");
    const roundingNote = document.getElementById("rounding-note");
    const results = document.getElementById("results");

    function showSaveStatus(message, warning) {
      status.textContent = message;
      status.parentElement.dataset.state = warning ? "warning" : "saved";
    }

    function currentPlan() {
      return Object.fromEntries(FIELDS.map(field => [field, inputs[field].value]));
    }

    function render() {
      const plan = currentPlan();
      const calculation = calculate(plan);
      results.setAttribute("aria-busy", "true");
      for (const field of FIELDS) {
        const error = calculation.errors?.[field];
        inputs[field].setAttribute("aria-invalid", error ? "true" : "false");
        const message = document.getElementById(`${field}-error`);
        message.textContent = error || "";
        message.hidden = !error;
      }
      litresOutput.textContent = formatLitres(calculation);
      tinsOutput.textContent = calculation.valid ? String(calculation.tins) : "—";
      coatsDetail.textContent = calculation.valid ? `For your ${Number(plan.coats)} ${Number(plan.coats) === 1 ? "coat" : "coats"}` : "Waiting for valid numbers";
      tinDetail.textContent = calculation.valid ? `At ${Number(plan.tinSize)} L each` : "Check the highlighted fields";
      calculationError.hidden = calculation.valid;
      calculationError.textContent = calculation.valid ? "" : (calculation.errors.calculation || "Check the numbers marked above to see your result.");
      const rounded = calculation.valid && calculation.numerator * 1000n % calculation.denominator !== 0n;
      roundingNote.hidden = !rounded;
      const tiny = calculation.valid && calculation.numerator > 0n && calculation.numerator * 1000n < calculation.denominator;
      roundingNote.textContent = tiny ? "Less than 0.001 L is needed. Whole tins use the full calculation." : (rounded ? "Litres are rounded up for display to 0.001 L. Whole tins use the full calculation." : "");
      results.setAttribute("aria-busy", "false");
    }

    function persist(restored) {
      if (saved.state === "invalid") {
        showSaveStatus("The saved plan couldn’t be read. Changes can’t be saved; the original saved copy is untouched.", true);
      } else if (saved.state === "unavailable") {
        showSaveStatus("This browser couldn’t access saved plans. Keep this window open to keep your numbers.", true);
      } else if (restored) {
        showSaveStatus("Plan restored · saved on this device", false);
      } else if (savePlan(storage, currentPlan())) {
        showSaveStatus("Saved on this device", false);
      } else {
        showSaveStatus("This browser couldn’t save your plan. Keep this window open to keep your numbers.", true);
      }
    }

    form.addEventListener("submit", event => event.preventDefault());
    form.addEventListener("input", () => { render(); persist(false); });
    form.addEventListener("change", () => { render(); persist(false); });
    render();
    persist(saved.state === "restored");
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { DEFAULT_PLAN, STORAGE_KEY, calculate, formatLitres, readPlan, savePlan };
  }
  if (typeof document !== "undefined") initialise();
})();
