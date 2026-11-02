"use strict";
(() => {
  const kit = window.PlainSteps;
  const contract = window.PlainStepsContract;
  const $ = (id) => document.getElementById(id);
  if (!kit || kit.validateContract(contract).length) {
    $("fatal-error").hidden = false;
    $("fatal-error").textContent = "This app's calculation definition is incomplete. No saved data has been changed.";
    $("home-view").hidden = true;
    $("save-status").textContent = "Saving has not started.";
    return;
  }
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const fields = contract.fields;
  const fieldIds = fields.map((field) => field.id);
  const defaults = Object.fromEntries(fields.map((field) => [field.id, field.default === undefined ? "" : String(field.default)]));
  const validValues = (values) => !!values && typeof values === "object" && !Array.isArray(values) && Object.keys(values).sort().join(",") === [...fieldIds].sort().join(",") && fieldIds.every((id) => typeof values[id] === "string" && values[id].length <= 100);
  const validResult = (result) => result === null || (!!result && Object.keys(result).sort().join(",") === "inputs,value" && validValues(result.inputs) && Number.isFinite(result.value) && (() => { const checked = kit.calculate(contract, result.inputs); return checked.ok && checked.value === result.value; })());
  const initial = { app: contract.id, started: false, draft: defaults, completed: null, undo: { available: false, previous: null, draft: defaults }, preferences: { density: contract.density || "comfortable", detail: "essential" } };
  function validState(value) {
    return !!value && Object.keys(value).sort().join(",") === "app,completed,draft,preferences,started,undo" && value.app === contract.id && typeof value.started === "boolean" && validValues(value.draft) && validResult(value.completed) && !!value.undo && Object.keys(value.undo).sort().join(",") === "available,draft,previous" && typeof value.undo.available === "boolean" && validResult(value.undo.previous) && validValues(value.undo.draft) && !!value.preferences && Object.keys(value.preferences).sort().join(",") === "density,detail" && ["comfortable", "compact"].includes(value.preferences.density) && ["essential", "expanded"].includes(value.preferences.detail);
  }
  const store = kit.createStore({ key: `plain-steps.flow.${contract.id}.v1`, initial, validate: validState, storage: () => window.localStorage });
  let state = store.read();
  const views = Object.fromEntries(["home", "edit", "result", "settings"].map((name) => [name, $(`${name}-view`)]));
  const inputs = {}, errorNodes = {};
  document.title = contract.title;
  $("app-title").textContent = contract.title;
  $("start").textContent = contract.startLabel;
  $("resume").textContent = contract.resumeLabel;
  $("calculate").textContent = contract.calculateLabel;
  $("result-heading").textContent = contract.resultLabel;
  $("explanation").textContent = contract.explanation || "This result uses the values shown above and the app's fixed calculation definition. Check that those values and units match your task.";
  for (const field of fields) {
    const group = document.createElement("div"); group.className = "field";
    const label = document.createElement("label"); label.htmlFor = `value-${field.id}`; label.textContent = field.label;
    const hint = document.createElement("p"); hint.className = "hint"; hint.id = `hint-${field.id}`;
    const limits = [];
    if (field.integer) limits.push("Whole numbers only.");
    if (field.min !== undefined) limits.push(`Minimum ${field.min}.`);
    if (field.max !== undefined) limits.push(`Maximum ${field.max}.`);
    hint.textContent = [field.help || "", ...limits].filter(Boolean).join(" ") || "Enter a number.";
    const input = document.createElement("input"); input.id = label.htmlFor; input.type = "text"; input.inputMode = field.integer ? "numeric" : "decimal"; input.autocomplete = "off"; input.value = state.draft[field.id]; input.maxLength = 100;
    const error = document.createElement("p"); error.id = `error-${field.id}`; error.className = "error"; error.hidden = true;
    input.setAttribute("aria-describedby", `${hint.id} ${error.id}`);
    input.addEventListener("input", () => { state.draft[field.id] = input.value; state.started = true; kit.fieldError(input, error, ""); $("form-error").hidden = true; save(); });
    group.append(label, hint, input, error); $("fields").append(group); inputs[field.id] = input; errorNodes[field.id] = error;
  }
  function showStorage() {
    const status = store.status();
    kit.updateStatus($("save-status"), status.message);
    const problem = String(!["fresh", "saved"].includes(status.mode));
    if ($("save-status").dataset.problem !== problem) $("save-status").dataset.problem = problem;
    $("retry").hidden = !status.retryable;
  }
  function summary() {
    $("resume").disabled = !state.started;
    $("resume-state").textContent = state.started ? (state.completed ? "An earlier result and your draft are available to continue." : "Your draft is available to continue.") : "Start a calculation. There is no earlier work to continue yet.";
    $("undo").disabled = !state.undo.available;
  }
  function preferences() {
    document.body.dataset.density = state.preferences.density;
    $("explanation-panel").open = state.preferences.detail === "expanded";
    for (const name of ["density", "detail"]) document.querySelector(`input[name="${name}"][value="${state.preferences[name]}"]`).checked = true;
  }
  function save() { store.write(state); showStorage(); summary(); }
  function syncInputs() { fields.forEach((field) => { inputs[field.id].value = state.draft[field.id]; kit.fieldError(inputs[field.id], errorNodes[field.id], ""); }); $("form-error").hidden = true; }
  function renderResult() {
    if (!state.completed) return;
    const checked = kit.calculate(contract, state.completed.inputs);
    $("result").textContent = `${checked.formatted}${contract.unit ? ` ${contract.unit}` : ""}`;
    $("used-values").replaceChildren();
    for (const field of fields) {
      const row = document.createElement("div"); row.className = "summary-row";
      const label = document.createElement("dt"); label.textContent = field.label;
      const value = document.createElement("dd"); value.textContent = state.completed.inputs[field.id];
      row.append(label, value); $("used-values").append(row);
    }
  }
  function route(name) {
    if (name === "result" && !state.completed) name = "edit";
    summary();
    if (name === "result") renderResult();
    const target = name === "edit" ? inputs[fields[0].id] : $(name === "home" ? "app-title" : `${name}-heading`);
    kit.showView(views, name, target);
  }
  $("start").addEventListener("click", () => { state.started = true; save(); route("edit"); });
  $("resume").addEventListener("click", () => {
    const same = state.completed && fieldIds.every((id) => state.draft[id] === state.completed.inputs[id]);
    route(same ? "result" : "edit");
  });
  $("settings").addEventListener("click", () => route("settings"));
  document.querySelectorAll("[data-home]").forEach((button) => button.addEventListener("click", () => route("home")));
  $("edit").addEventListener("click", () => route("edit"));
  $("task-form").addEventListener("submit", (event) => {
    event.preventDefault();
    fields.forEach((field) => { state.draft[field.id] = inputs[field.id].value; kit.fieldError(inputs[field.id], errorNodes[field.id], ""); });
    const calculated = kit.calculate(contract, state.draft);
    if (!calculated.ok) {
      for (const [id, message] of Object.entries(calculated.errors)) kit.fieldError(inputs[id], errorNodes[id], message);
      $("form-error").textContent = calculated.message; $("form-error").hidden = false;
      save();
      const first = fields.find((field) => calculated.errors[field.id]);
      (first ? inputs[first.id] : $("form-error")).focus();
      return;
    }
    state.undo = { available: true, previous: clone(state.completed), draft: clone(state.draft) };
    state.completed = { inputs: clone(state.draft), value: calculated.value };
    state.started = true; save(); route("result");
    kit.announce($("action-status"), `${contract.resultLabel}: ${calculated.formatted}${contract.unit ? ` ${contract.unit}` : ""}.`);
  });
  $("undo").addEventListener("click", () => {
    if (!state.undo.available) return;
    state.completed = clone(state.undo.previous);
    state.draft = clone(state.completed ? state.completed.inputs : state.undo.draft);
    state.undo = { available: false, previous: null, draft: clone(state.draft) };
    syncInputs(); save(); route(state.completed ? "result" : "edit");
    kit.announce($("action-status"), state.completed ? "Undid the last calculation. The preceding result and its values are restored." : "Undid the calculation. Your entered values are still available to edit.");
  });
  for (const name of ["density", "detail"]) document.querySelectorAll(`input[name="${name}"]`).forEach((input) => input.addEventListener("change", () => {
    state.preferences[name] = input.value; preferences(); save(); kit.announce($("action-status"), "Display preference changed.");
  }));
  $("retry").addEventListener("click", () => { store.retry(); showStorage(); $("save-status").focus(); });
  window.addEventListener("storage", (event) => { store.externalChange(event); showStorage(); });
  preferences(); showStorage(); summary();
})();
