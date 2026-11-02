'use strict';

const storageKey = 'three-night-packing-list-v1';
const form = document.querySelector('#add-form');
const itemInput = document.querySelector('#item-name');
const list = document.querySelector('#packing-list');
const progress = document.querySelector('#progress');
const emptyState = document.querySelector('#empty-state');
const announcement = document.querySelector('#announcement');
const storageWarning = document.querySelector('#storage-warning');
let items = [];

function showStorageWarning(message) {
  storageWarning.textContent = message;
  storageWarning.hidden = false;
}

try {
  const saved = localStorage.getItem(storageKey);
  if (saved !== null) {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed) || !parsed.every(item =>
      item && typeof item.id === 'string' &&
      typeof item.name === 'string' && item.name.trim().length > 0 &&
      typeof item.packed === 'boolean'
    )) {
      throw new Error('Invalid saved list');
    }
    items = parsed;
  }
} catch (error) {
  showStorageWarning('Your saved list could not be loaded. New changes may not survive closing this page.');
}

function save() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(items));
    storageWarning.hidden = true;
    return true;
  } catch (error) {
    showStorageWarning('This browser could not save your list. Keep this page open to keep your changes.');
    return false;
  }
}

function updateProgress() {
  const packedCount = items.filter(item => item.packed).length;
  progress.textContent = `${packedCount} of ${items.length} packed`;
  emptyState.hidden = items.length > 0;
}

function createItemRow(item) {
  const row = document.createElement('li');
  row.className = 'packing-item';
  const label = document.createElement('label');
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = item.packed;
  const text = document.createElement('span');
  text.textContent = item.name;
  checkbox.addEventListener('change', () => {
    item.packed = checkbox.checked;
    save();
    updateProgress();
    announcement.textContent = `${item.name} marked ${item.packed ? 'packed' : 'not packed'}.`;
  });
  label.append(checkbox, text);
  row.append(label);
  return row;
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const name = itemInput.value.trim();
  if (!name) {
    itemInput.setCustomValidity('Enter an item to add.');
    itemInput.reportValidity();
    return;
  }
  const item = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name,
    packed: false
  };
  items.push(item);
  list.append(createItemRow(item));
  save();
  updateProgress();
  itemInput.value = '';
  itemInput.focus();
  announcement.textContent = `${name} added to your packing list.`;
});

itemInput.addEventListener('input', () => itemInput.setCustomValidity(''));
items.forEach(item => list.append(createItemRow(item)));
updateProgress();
