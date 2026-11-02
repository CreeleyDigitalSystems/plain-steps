(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.LoanBook = api;
  }
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var STORAGE_KEY = "equipment-loan-book.v1";
  var sequence = 0;

  function problem(code, message) {
    var error = new Error(message);
    error.code = code;
    return error;
  }

  function emptyBook() {
    return { version: 1, loans: [], lastReturnId: null };
  }

  function copyBook(state) {
    return {
      version: 1,
      loans: state.loans.map(function (loan) {
        return {
          id: loan.id,
          item: loan.item,
          borrower: loan.borrower,
          returned: loan.returned
        };
      }),
      lastReturnId: state.lastReturnId
    };
  }

  function isRecord(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function hasExactKeys(value, keys) {
    var actual = Object.keys(value);
    return actual.length === keys.length && keys.every(function (key) {
      return Object.prototype.hasOwnProperty.call(value, key);
    });
  }

  function validText(value, limit) {
    return typeof value === "string" && value.length > 0 &&
      value.length <= limit && value.trim() === value;
  }

  function validId(value) {
    return validText(value, 200);
  }

  function invalidData() {
    return problem("INVALID_DATA", "The saved loan book could not be read safely. It has not been replaced.");
  }

  function parseBook(raw) {
    if (raw === null) return emptyBook();
    var parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw invalidData();
    }

    if (!isRecord(parsed)) throw invalidData();
    if (Object.prototype.hasOwnProperty.call(parsed, "version") && parsed.version !== 1) {
      throw problem("UNSUPPORTED_VERSION", "This saved loan book uses a different version. It has not been replaced.");
    }
    if (!hasExactKeys(parsed, ["version", "loans", "lastReturnId"]) ||
      parsed.version !== 1 || !Array.isArray(parsed.loans) ||
      (parsed.lastReturnId !== null && !validId(parsed.lastReturnId))) {
      throw invalidData();
    }

    var ids = new Set();
    var undoTarget = null;
    parsed.loans.forEach(function (loan) {
      if (!isRecord(loan) || !hasExactKeys(loan, ["id", "item", "borrower", "returned"]) ||
        !validId(loan.id) || !validText(loan.item, 160) || !validText(loan.borrower, 100) ||
        typeof loan.returned !== "boolean" || ids.has(loan.id)) {
        throw invalidData();
      }
      ids.add(loan.id);
      if (loan.id === parsed.lastReturnId) undoTarget = loan;
    });
    if (parsed.lastReturnId !== null && (!undoTarget || !undoTarget.returned)) {
      throw invalidData();
    }
    return copyBook(parsed);
  }

  function createBook(storage) {
    try {
      if (!storage || typeof storage.getItem !== "function" || typeof storage.setItem !== "function") {
        throw new Error("Storage unavailable");
      }
    } catch (error) {
      throw problem("STORAGE_READ", "This browser cannot open local storage. The loan book has not been changed.");
    }

    function readRaw() {
      var raw;
      try {
        raw = storage.getItem(STORAGE_KEY);
      } catch (error) {
        throw problem("STORAGE_READ", "The saved loan book could not be opened. Your displayed book has not changed.");
      }
      if (raw !== null && typeof raw !== "string") {
        throw problem("STORAGE_READ", "Local storage returned an unreadable loan book. Your displayed book has not changed.");
      }
      return raw;
    }

    var loadedRaw = readRaw();
    var state = parseBook(loadedRaw);

    function snapshot() {
      return copyBook(state);
    }

    function reload() {
      var freshRaw = readRaw();
      var freshState = parseBook(freshRaw);
      loadedRaw = freshRaw;
      state = freshState;
      return snapshot();
    }

    function save(nextState) {
      if (readRaw() !== loadedRaw) {
        throw problem("CONFLICT", "The saved loan book changed elsewhere. Reload it before making this change.");
      }
      var nextRaw = JSON.stringify(nextState);
      try {
        storage.setItem(STORAGE_KEY, nextRaw);
      } catch (error) {
        throw problem("STORAGE_WRITE", "The loan book could not be saved on this device. Your displayed book has not changed.");
      }

      var confirmedRaw;
      try {
        confirmedRaw = readRaw();
      } catch (error) {
        throw problem("STORAGE_VERIFY", "The save could not be confirmed. Reload the loan book to check what was saved.");
      }
      if (confirmedRaw !== nextRaw) {
        throw problem("STORAGE_VERIFY", "The save could not be confirmed. Reload the loan book to check what was saved.");
      }
      loadedRaw = nextRaw;
      state = nextState;
      return snapshot();
    }

    function requiredText(value, label, limit) {
      if (typeof value !== "string" || !value.trim()) {
        throw problem("VALIDATION", "Enter " + label + ".");
      }
      var trimmed = value.trim();
      if (trimmed.length > limit) {
        throw problem("VALIDATION", "Keep " + label + " to " + limit + " characters or fewer.");
      }
      return trimmed;
    }

    function newId() {
      var id;
      do {
        sequence += 1;
        id = "loan-" + Date.now().toString(36) + "-" + sequence.toString(36) +
          "-" + Math.random().toString(36).slice(2, 10);
      } while (state.loans.some(function (loan) { return loan.id === id; }));
      return id;
    }

    function add(item, borrower) {
      var cleanItem = requiredText(item, "an item", 160);
      var cleanBorrower = requiredText(borrower, "the borrower's name", 100);
      var nextState = copyBook(state);
      nextState.loans.push({
        id: newId(),
        item: cleanItem,
        borrower: cleanBorrower,
        returned: false
      });
      return save(nextState);
    }

    function markReturned(id) {
      if (!validId(id)) {
        throw problem("INVALID_ID", "Choose a loan from the outstanding list.");
      }
      var nextState = copyBook(state);
      var loan = nextState.loans.find(function (entry) { return entry.id === id; });
      if (!loan) throw problem("NOT_FOUND", "That loan is no longer in this loan book. Reload the book to check it.");
      if (loan.returned) throw problem("ALREADY_RETURNED", "That item has already been marked returned.");
      loan.returned = true;
      nextState.lastReturnId = id;
      return save(nextState);
    }

    function undoReturn() {
      if (state.lastReturnId === null) {
        throw problem("NOTHING_TO_UNDO", "There is no recent return to undo.");
      }
      var nextState = copyBook(state);
      var loan = nextState.loans.find(function (entry) { return entry.id === nextState.lastReturnId; });
      loan.returned = false;
      nextState.lastReturnId = null;
      return save(nextState);
    }

    return { snapshot: snapshot, reload: reload, add: add, markReturned: markReturned, undoReturn: undoReturn };
  }

  return Object.freeze({ STORAGE_KEY: STORAGE_KEY, createBook: createBook });
}));
