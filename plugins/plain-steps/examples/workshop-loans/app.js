(function () {
  'use strict';
  const byId = (id) => document.getElementById(id);
  const ui = Object.fromEntries([
    'loan-form', 'item', 'borrower', 'record-loan', 'storage-problem',
    'storage-error', 'retry-storage', 'save-state', 'book-total', 'show-out',
    'show-returned', 'out-count', 'returned-count', 'undo-panel',
    'undo-description', 'undo-return', 'search', 'list-heading',
    'result-count', 'loan-list', 'empty-state', 'empty-title', 'empty-copy', 'status'
  ].map((id) => [id, byId(id)]));
  let book = null;
  let blocked = true;
  let view = 'out';

  function announce(message) {
    const text = document.createElement('span');
    text.textContent = message;
    ui.status.replaceChildren(text);
  }

  function saveLabel(text, problem) {
    ui['save-state'].textContent = text;
    ui['save-state'].dataset.problem = String(Boolean(problem));
  }

  function showProblem(error) {
    const active = document.activeElement;
    blocked = true;
    ui.status.replaceChildren();
    ui['storage-problem'].hidden = false;
    ui['storage-error'].textContent = error.message || 'The book could not be saved. Reopen it before trying again.';
    saveLabel('Book needs attention', true);
    render();
    if (active && (!active.isConnected || active.disabled)) ui['retry-storage'].focus();
  }

  function fieldError(id, message) {
    const input = ui[id];
    const error = byId(id + '-error');
    error.textContent = message;
    error.hidden = !message;
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }

  function makeRow(loan) {
    const row = document.createElement('li');
    row.className = 'loan-row';
    const details = document.createElement('div');
    details.className = 'loan-details';
    const name = document.createElement('p');
    name.className = 'loan-name';
    name.textContent = loan.item;
    const borrower = document.createElement('p');
    borrower.className = 'loan-borrower';
    borrower.textContent = (loan.returned ? 'Borrowed by ' : 'With ') + loan.borrower;
    details.append(name, borrower);
    row.append(details);
    if (loan.returned) {
      const label = document.createElement('span');
      label.className = 'returned-label';
      label.textContent = 'Returned';
      row.append(label);
    } else {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'return-button';
      button.dataset.loanId = loan.id;
      button.textContent = 'Mark returned';
      button.setAttribute('aria-label', 'Mark ' + loan.item + ' from ' + loan.borrower + ' returned');
      button.disabled = blocked;
      button.addEventListener('click', () => returnLoan(loan));
      row.append(button);
    }
    return row;
  }

  function render() {
    ui['record-loan'].disabled = blocked;
    ui['undo-return'].disabled = blocked;
    ui['show-out'].setAttribute('aria-pressed', String(view === 'out'));
    ui['show-returned'].setAttribute('aria-pressed', String(view === 'returned'));
    ui['list-heading'].textContent = view === 'out' ? 'Still out' : 'Returned';
    ui['loan-list'].replaceChildren();
    if (!book) {
      ui['book-total'].textContent = 'Book unavailable';
      ui['empty-state'].hidden = false;
      ui['empty-title'].textContent = 'Your saved book can’t be shown';
      ui['empty-copy'].textContent = 'Use “Reopen saved book” above to try again. Existing saved data has not been replaced.';
      return;
    }
    const state = book.snapshot();
    const out = state.loans.filter((loan) => !loan.returned).length;
    ui['out-count'].textContent = String(out);
    ui['returned-count'].textContent = String(state.loans.length - out);
    ui['book-total'].textContent = state.loans.length + (state.loans.length === 1 ? ' entry' : ' entries');
    const lastReturn = state.loans.find((loan) => loan.id === state.lastReturnId);
    ui['undo-panel'].hidden = !lastReturn;
    if (lastReturn) {
      ui['undo-description'].textContent = 'Last return: ' + lastReturn.item + ' from ' + lastReturn.borrower + '.';
    }
    const query = ui.search.value.trim().toLocaleLowerCase();
    const inView = state.loans.filter((loan) => loan.returned === (view === 'returned'));
    const visible = inView.filter((loan) => (loan.item + ' ' + loan.borrower).toLocaleLowerCase().includes(query)).reverse();
    visible.forEach((loan) => ui['loan-list'].append(makeRow(loan)));
    ui['result-count'].textContent = query ? visible.length + ' of ' + inView.length : '';
    ui['empty-state'].hidden = visible.length > 0;
    if (query && visible.length === 0) {
      ui['empty-title'].textContent = 'No matching loans';
      ui['empty-copy'].textContent = 'Try another item or name, clear the search, or check the other view.';
    } else if (view === 'returned') {
      ui['empty-title'].textContent = 'No returns recorded yet';
      ui['empty-copy'].textContent = 'Returned loans stay here so you can find them later.';
    } else if (state.loans.length === 0) {
      ui['empty-title'].textContent = 'A clean page';
      ui['empty-copy'].textContent = 'No loans recorded yet. Add an item and borrower to start your book.';
    } else {
      ui['empty-title'].textContent = 'Nothing still out';
      ui['empty-copy'].textContent = 'Your recorded loans are all returned. You can find them in Returned.';
    }
  }

  function saved(message) {
    render();
    saveLabel('Saved on this device', false);
    announce(message + ' Saved on this device.');
  }

  function returnLoan(loan) {
    if (blocked) return;
    try {
      book.markReturned(loan.id);
      saved(loan.item + ' from ' + loan.borrower + ' marked returned. Undo is available.');
      ui['undo-return'].focus();
    } catch (error) {
      showProblem(error);
      ui['retry-storage'].focus();
    }
  }

  function openBook(retry) {
    try {
      if (book) book.reload();
      else book = LoanBook.createBook({
        getItem: (key) => window.localStorage.getItem(key),
        setItem: (key, value) => window.localStorage.setItem(key, value)
      });
      blocked = false;
      ui['storage-problem'].hidden = true;
      ui['storage-error'].textContent = '';
      render();
      saveLabel(book.snapshot().loans.length ? 'Saved book opened' : 'Ready to save on this device', false);
      if (retry) {
        announce('Saved book reopened. Your form entries are still here.');
        ui.item.focus();
      }
    } catch (error) {
      showProblem(error);
    }
  }

  ui['loan-form'].addEventListener('submit', (event) => {
    event.preventDefault();
    if (blocked) return;
    const item = ui.item.value.trim();
    const borrower = ui.borrower.value.trim();
    const itemProblem = !item ? 'Enter the item being borrowed.' : item.length > 160 ? 'Use 160 characters or fewer for the item.' : '';
    const borrowerProblem = !borrower ? 'Enter who borrowed it.' : borrower.length > 100 ? 'Use 100 characters or fewer for the name.' : '';
    fieldError('item', itemProblem);
    fieldError('borrower', borrowerProblem);
    if (itemProblem || borrowerProblem) {
      announce('Loan not recorded. Check the highlighted fields.');
      (itemProblem ? ui.item : ui.borrower).focus();
      return;
    }
    try {
      book.add(item, borrower);
      ui['loan-form'].reset();
      view = 'out';
      ui.search.value = '';
      saved(item + ' recorded with ' + borrower + '.');
      ui.item.focus();
    } catch (error) {
      showProblem(error);
      ui['retry-storage'].focus();
    }
  });

  ['item', 'borrower'].forEach((id) => {
    ui[id].addEventListener('input', () => fieldError(id, ''));
  });
  [['show-out', 'out'], ['show-returned', 'returned']].forEach(([id, target]) => {
    ui[id].addEventListener('click', () => {
      view = target;
      ui.search.value = '';
      render();
      ui['list-heading'].focus();
      announce(view === 'out' ? 'Showing loans still out.' : 'Showing returned loans.');
    });
  });
  ui.search.addEventListener('input', render);
  ui.search.addEventListener('search', render);
  ui['undo-return'].addEventListener('click', () => {
    if (blocked || !book) return;
    const lastReturn = book.snapshot().loans.find((loan) => loan.id === book.snapshot().lastReturnId);
    if (!lastReturn) return;
    try {
      book.undoReturn();
      view = 'out';
      ui.search.value = '';
      saved('Return undone. ' + lastReturn.item + ' is still out with ' + lastReturn.borrower + '.');
      const target = Array.from(ui['loan-list'].querySelectorAll('button')).find((button) => button.dataset.loanId === lastReturn.id);
      (target || ui['list-heading']).focus();
    } catch (error) {
      showProblem(error);
      ui['retry-storage'].focus();
    }
  });
  ui['retry-storage'].addEventListener('click', () => openBook(true));
  window.addEventListener('storage', (event) => {
    if (event.key === LoanBook.STORAGE_KEY || event.key === null) {
      showProblem(new Error('This book changed in another window. Reopen the saved book before making changes. Your form entries stay here.'));
    }
  });
  openBook(false);
}());
