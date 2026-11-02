"use strict";
(() => {
  const KEY = "plain-steps.packing.v1";
  const $ = (id) => document.getElementById(id);
  const views = ["home", "add", "packing", "settings"];
  let state = { version: 1, nights: 3, items: [], density: "roomy", undo: null };
  let draft = "";
  let lastStored = null;
  let saveMode = "ready";
  let nextId = 1;

  function valid(data) {
    if (!data || data.version !== 1 || data.nights !== 3 || !Array.isArray(data.items) || !["roomy", "compact"].includes(data.density)) return false;
    const ids = new Set();
    for (const item of data.items) {
      if (!item || !/^item-[1-9]\d*$/.test(item.id) || ids.has(item.id) || typeof item.name !== "string" || item.name.trim().length === 0 || item.name.length > 100 || typeof item.packed !== "boolean") return false;
      ids.add(item.id);
    }
    return data.undo === null || !!(data.undo && ids.has(data.undo.id) && typeof data.undo.packed === "boolean");
  }

  function showSaveStatus() {
    const messages = {
      ready: "Saved on this device in this browser.",
      write: "Not saved on this device. Your changes are kept only while this page stays open. Try saving again.",
      unreadable: "Saved items could not be read. The saved copy has not been changed. New changes stay only while this page is open.",
      unavailable: "Saving is unavailable in this browser. Changes stay only while this page is open.",
      conflict: "The saved list changed in another page. This page has not overwritten it. Keep this page open to retain these changes; reopen the file to read the saved list."
    };
    $("save-status").textContent = messages[saveMode];
    $("save-status").dataset.problem = String(saveMode !== "ready");
    $("retry-save").hidden = saveMode !== "write";
  }

  function persist() {
    if (["unreadable", "unavailable", "conflict"].includes(saveMode)) { showSaveStatus(); return; }
    try {
      if (localStorage.getItem(KEY) !== lastStored) {
        saveMode = "conflict";
        showSaveStatus();
        return;
      }
      const serialized = JSON.stringify(state);
      localStorage.setItem(KEY, serialized);
      if (localStorage.getItem(KEY) !== serialized) {
        saveMode = "conflict";
      } else {
        lastStored = serialized;
        saveMode = "ready";
      }
    } catch (_) {
      saveMode = "write";
    }
    showSaveStatus();
  }

  function load() {
    try {
      lastStored = localStorage.getItem(KEY);
    } catch (_) {
      saveMode = "unavailable";
      showSaveStatus();
      return;
    }
    if (lastStored !== null) {
      try {
        const parsed = JSON.parse(lastStored);
        if (!valid(parsed)) throw new Error("Invalid saved list");
        // Copy only this version's supported fields; stored text is never HTML.
        state = { version: 1, nights: 3, density: parsed.density, items: parsed.items.map(({id, name, packed}) => ({id, name, packed})), undo: parsed.undo === null ? null : {id: parsed.undo.id, packed: parsed.undo.packed} };
        nextId = Math.max(0, ...state.items.map((item) => Number(item.id.slice(5)))) + 1;
        if (!Number.isSafeInteger(nextId)) throw new Error("Invalid item identity");
      } catch (_) {
        state = { version: 1, nights: 3, items: [], density: "roomy", undo: null };
        nextId = 1;
        saveMode = "unreadable";
        showSaveStatus();
        return;
      }
    }
    if (lastStored === null) persist();
    else showSaveStatus();
  }

  function counts() {
    const packed = state.items.filter((item) => item.packed).length;
    const text = `${packed} of ${state.items.length} items packed`;
    $("home-count").textContent = text;
    $("packing-count").textContent = state.items.length && packed === state.items.length ? `${text}. Everything on your list is packed.` : text;
    $("undo").disabled = state.undo === null;
    $("empty-list").hidden = state.items.length !== 0;
  }

  function announce(message) { $("action-status").textContent = message; }

  function renderList() {
    $("packing-list").replaceChildren();
    for (const item of state.items) {
      const li = document.createElement("li");
      li.className = "item";
      const label = document.createElement("label");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = item.id;
      checkbox.checked = item.packed;
      const name = document.createElement("span");
      name.className = "item-text";
      name.textContent = item.name;
      const packingState = document.createElement("span");
      packingState.className = "item-state";
      packingState.setAttribute("aria-hidden", "true");
      packingState.textContent = item.packed ? "Packed" : "Not packed";
      checkbox.addEventListener("change", () => {
        state.undo = {id: item.id, packed: item.packed};
        item.packed = checkbox.checked;
        packingState.textContent = item.packed ? "Packed" : "Not packed";
        persist();
        counts();
      });
      label.append(checkbox, name, packingState);
      li.append(label);
      $("packing-list").append(li);
    }
    counts();
  }

  function route(view) {
    if (!views.includes(view)) return;
    draft = $("item-name").value;
    for (const name of views) $(`${name}-view`).hidden = name !== view;
    counts();
    if (view === "packing") renderList();
    if (view === "add") {
      $("item-name").value = draft;
      $("item-name").focus();
    } else {
      $(`${view === "home" ? "home" : view}-heading`).focus();
    }
  }

  $("home-add").addEventListener("click", () => route("add"));
  $("list-add").addEventListener("click", () => route("add"));
  $("home-continue").addEventListener("click", () => route("packing"));
  $("home-settings").addEventListener("click", () => route("settings"));
  document.querySelectorAll("[data-home]").forEach((button) => button.addEventListener("click", () => route("home")));
  $("add-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = $("item-name");
    draft = input.value;
    const name = draft.trim();
    const error = name.length === 0 ? "Enter an item, such as a toothbrush." : draft.length > 100 ? "Use 100 characters or fewer. Your text is still here." : "";
    $("item-error").hidden = !error;
    $("item-error").textContent = error;
    input.setAttribute("aria-invalid", String(!!error));
    if (error) { input.focus(); return; }
    state.items.push({id: `item-${nextId++}`, name, packed: false});
    input.value = "";
    draft = "";
    persist();
    route("packing");
    announce(`Added ${name}.`);
  });
  $("item-name").addEventListener("input", () => {
    draft = $("item-name").value;
    if (!$("item-error").hidden) {
      $("item-error").hidden = true;
      $("item-name").removeAttribute("aria-invalid");
    }
  });
  $("undo").addEventListener("click", () => {
    if (!state.undo) return;
    const item = state.items.find((candidate) => candidate.id === state.undo.id);
    item.packed = state.undo.packed;
    state.undo = null;
    persist();
    renderList();
    document.getElementById(item.id).focus();
    announce(`Undid the last toggle for ${item.name}.`);
  });
  document.querySelectorAll('input[name="density"]').forEach((input) => input.addEventListener("change", () => {
    state.density = input.value;
    document.body.dataset.density = state.density;
    persist();
    announce(`${input.value === "compact" ? "Compact" : "Roomy"} list selected.`);
  }));
  $("retry-save").addEventListener("click", () => { persist(); $("save-status").focus(); });
  window.addEventListener("storage", (event) => {
    if (event.key === KEY && event.newValue !== lastStored) { saveMode = "conflict"; showSaveStatus(); }
  });
  load();
  document.body.dataset.density = state.density;
  document.querySelector(`input[name="density"][value="${state.density}"]`).checked = true;
  counts();
})();
