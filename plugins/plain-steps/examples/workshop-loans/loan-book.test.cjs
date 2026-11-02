"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const LoanBook = require("./loan-book.js");

function memoryStorage(initial = null) {
  let raw = initial;
  return {
    reads: 0,
    writes: 0,
    readError: false,
    writeError: false,
    afterWrite: null,
    getItem(key) {
      assert.equal(key, LoanBook.STORAGE_KEY);
      this.reads += 1;
      if (this.readError) throw new Error("storage blocked");
      return raw;
    },
    setItem(key, value) {
      assert.equal(key, LoanBook.STORAGE_KEY);
      this.writes += 1;
      if (this.writeError) throw new Error("storage full");
      raw = value;
      if (this.afterWrite) this.afterWrite();
    },
    raw() { return raw; },
    replace(value) { raw = value; }
  };
}

function hasCode(code) {
  return (error) => error instanceof Error && error.code === code && error.message.length > 0;
}

function storedBook(loans = [], lastReturnId = null) {
  return JSON.stringify({ version: 1, loans, lastReturnId });
}

test("a new book is truly empty and does not write sample data or an empty record", () => {
  const storage = memoryStorage();
  const book = LoanBook.createBook(storage);
  assert.deepEqual(book.snapshot(), { version: 1, loans: [], lastReturnId: null });
  assert.equal(storage.raw(), null);
  assert.equal(storage.writes, 0);
});

test("adding trims the required values and survives a fresh book instance", () => {
  const storage = memoryStorage();
  const book = LoanBook.createBook(storage);
  const saved = book.add("  Cordless drill  ", "  Sam  ");
  assert.equal(saved.loans.length, 1);
  assert.equal(saved.loans[0].item, "Cordless drill");
  assert.equal(saved.loans[0].borrower, "Sam");
  assert.equal(saved.loans[0].returned, false);
  assert.equal(typeof saved.loans[0].id, "string");
  assert.ok(saved.loans[0].id.length > 0);
  assert.deepEqual(LoanBook.createBook(storage).snapshot(), saved);
});

test("returned items remain in history, and only the latest return can be undone once", () => {
  const storage = memoryStorage();
  const book = LoanBook.createBook(storage);
  const first = book.add("Drill", "Sam").loans[0].id;
  const second = book.add("Ladder", "Jo").loans[1].id;
  book.markReturned(first);
  const returned = book.markReturned(second);
  assert.equal(returned.loans.length, 2);
  assert.deepEqual(returned.loans.map((loan) => loan.returned), [true, true]);
  assert.equal(returned.lastReturnId, second);

  const reopened = LoanBook.createBook(storage);
  const undone = reopened.undoReturn();
  assert.deepEqual(undone.loans.map((loan) => loan.returned), [true, false]);
  assert.equal(undone.lastReturnId, null);
  assert.deepEqual(LoanBook.createBook(storage).snapshot(), undone);
  assert.throws(() => reopened.undoReturn(), hasCode("NOTHING_TO_UNDO"));
  assert.equal(LoanBook.createBook(storage).snapshot().loans[0].returned, true);
});

test("adding a later loan preserves the undo option for the latest return", () => {
  const storage = memoryStorage();
  const book = LoanBook.createBook(storage);
  const first = book.add("Drill", "Sam").loans[0].id;
  book.markReturned(first);
  const added = book.add("Ladder", "Jo");
  assert.equal(added.lastReturnId, first);
  const undone = LoanBook.createBook(storage).undoReturn();
  assert.deepEqual(undone.loans.map((loan) => loan.returned), [false, false]);
});

test("a return cannot be repeated, but a new return after undo can be undone", () => {
  const storage = memoryStorage();
  const book = LoanBook.createBook(storage);
  const id = book.add("Drill", "Sam").loans[0].id;
  const returned = book.markReturned(id);
  const raw = storage.raw();
  assert.throws(() => book.markReturned(id), hasCode("ALREADY_RETURNED"));
  assert.equal(storage.raw(), raw);
  assert.deepEqual(book.snapshot(), returned);
  book.undoReturn();
  assert.equal(book.markReturned(id).lastReturnId, id);
  assert.equal(book.undoReturn().loans[0].returned, false);
});

test("snapshots and mutation results cannot change the saved or active book", () => {
  const storage = memoryStorage();
  const book = LoanBook.createBook(storage);
  const saved = book.add("Drill", "Sam");
  saved.loans[0].item = "Changed";
  saved.loans.push({ id: "made-up", item: "x", borrower: "x", returned: false });
  const snapshot = book.snapshot();
  snapshot.loans[0].returned = true;
  snapshot.lastReturnId = snapshot.loans[0].id;
  assert.deepEqual(book.snapshot(), LoanBook.createBook(storage).snapshot());
  assert.equal(book.snapshot().loans.length, 1);
  assert.equal(book.snapshot().loans[0].item, "Drill");
  assert.equal(book.snapshot().loans[0].returned, false);
});

test("input validation rejects missing, non-text and oversized fields without writing", () => {
  const storage = memoryStorage();
  const book = LoanBook.createBook(storage);
  for (const [item, borrower] of [
    ["", "Sam"], ["  ", "Sam"], ["Drill", ""], ["Drill", "\n\t"],
    [null, "Sam"], ["Drill", 12], ["a".repeat(161), "Sam"], ["Drill", "b".repeat(101)]
  ]) {
    assert.throws(() => book.add(item, borrower), hasCode("VALIDATION"));
  }
  assert.equal(storage.writes, 0);
  assert.deepEqual(book.snapshot().loans, []);
  const boundary = book.add("a".repeat(160), "b".repeat(100));
  assert.equal(boundary.loans[0].item.length, 160);
  assert.equal(boundary.loans[0].borrower.length, 100);
});

test("invalid and unknown return identifiers cannot change the book", () => {
  const storage = memoryStorage();
  const book = LoanBook.createBook(storage);
  book.add("Drill", "Sam");
  const before = book.snapshot();
  const raw = storage.raw();
  for (const id of [undefined, null, 3, "", " "]) {
    assert.throws(() => book.markReturned(id), hasCode("INVALID_ID"));
  }
  assert.throws(() => book.markReturned("unknown"), hasCode("NOT_FOUND"));
  assert.deepEqual(book.snapshot(), before);
  assert.equal(storage.raw(), raw);
});

test("read and write failures preserve the in-memory book and existing saved data", () => {
  const storage = memoryStorage();
  storage.readError = true;
  assert.throws(() => LoanBook.createBook(storage), hasCode("STORAGE_READ"));
  assert.equal(storage.writes, 0);
  storage.readError = false;
  const book = LoanBook.createBook(storage);
  book.add("Drill", "Sam");
  const before = book.snapshot();
  const raw = storage.raw();
  storage.readError = true;
  assert.throws(() => book.add("Ladder", "Jo"), hasCode("STORAGE_READ"));
  assert.throws(() => book.reload(), hasCode("STORAGE_READ"));
  assert.deepEqual(book.snapshot(), before);
  storage.readError = false;
  storage.writeError = true;
  assert.throws(() => book.markReturned(before.loans[0].id), hasCode("STORAGE_WRITE"));
  assert.deepEqual(book.snapshot(), before);
  assert.equal(storage.raw(), raw);
  storage.writeError = false;
  assert.equal(book.markReturned(before.loans[0].id).loans[0].returned, true);
});

test("an unconfirmed save is not reported as success and requires a reload to reconcile", () => {
  const storage = memoryStorage();
  const book = LoanBook.createBook(storage);
  storage.afterWrite = () => storage.replace(storedBook());
  assert.throws(() => book.add("Drill", "Sam"), hasCode("STORAGE_VERIFY"));
  assert.deepEqual(book.snapshot().loans, []);
  assert.throws(() => book.add("Ladder", "Jo"), hasCode("CONFLICT"));
  storage.afterWrite = null;
  assert.deepEqual(book.reload().loans, []);
  assert.equal(book.add("Ladder", "Jo").loans.length, 1);
});

test("a read error after a save leaves memory unchanged even when storage may have saved", () => {
  const storage = memoryStorage();
  const book = LoanBook.createBook(storage);
  storage.afterWrite = () => { storage.readError = true; };
  assert.throws(() => book.add("Drill", "Sam"), hasCode("STORAGE_VERIFY"));
  assert.deepEqual(book.snapshot().loans, []);
  storage.afterWrite = null;
  storage.readError = false;
  assert.equal(book.reload().loans[0].item, "Drill");
});

test("corrupt, partial, inconsistent and unknown-version saved books are never overwritten", () => {
  const goodLoan = { id: "one", item: "Drill", borrower: "Sam", returned: false };
  const invalid = [
    "", "{", "null", "[]", "{}",
    JSON.stringify({ version: 1, loans: [], lastReturnId: null, extra: true }),
    JSON.stringify({ version: 1, loans: [], lastReturnId: "missing" }),
    storedBook([{ ...goodLoan, returned: "false" }]),
    storedBook([{ ...goodLoan, item: " " }]),
    storedBook([{ ...goodLoan, item: "a".repeat(161) }]),
    storedBook([{ ...goodLoan, borrower: "b".repeat(101) }]),
    storedBook([{ ...goodLoan, item: " Drill" }]),
    storedBook([{ ...goodLoan, id: "" }]),
    storedBook([{ ...goodLoan, extra: true }]),
    storedBook([goodLoan, { ...goodLoan }]),
    storedBook([goodLoan], "one")
  ];
  for (const raw of invalid) {
    const storage = memoryStorage(raw);
    assert.throws(() => LoanBook.createBook(storage), hasCode("INVALID_DATA"), raw);
    assert.equal(storage.raw(), raw);
    assert.equal(storage.writes, 0);
  }
  const future = JSON.stringify({ version: 2, loans: [], lastReturnId: null });
  const storage = memoryStorage(future);
  assert.throws(() => LoanBook.createBook(storage), hasCode("UNSUPPORTED_VERSION"));
  assert.equal(storage.raw(), future);
  assert.equal(storage.writes, 0);
});

test("a stale instance rejects external additions, returns and deletion without overwriting", () => {
  const storage = memoryStorage();
  const first = LoanBook.createBook(storage);
  const stale = LoanBook.createBook(storage);
  first.add("Drill", "Sam");
  const raw = storage.raw();
  assert.throws(() => stale.add("Ladder", "Jo"), hasCode("CONFLICT"));
  assert.equal(storage.raw(), raw);
  assert.deepEqual(stale.snapshot().loans, []);
  stale.reload();
  const id = stale.snapshot().loans[0].id;
  first.markReturned(id);
  assert.throws(() => stale.markReturned(id), hasCode("CONFLICT"));
  assert.equal(LoanBook.createBook(storage).snapshot().loans[0].returned, true);
  stale.reload();
  storage.replace(null);
  assert.throws(() => stale.undoReturn(), hasCode("CONFLICT"));
  assert.equal(storage.raw(), null);
  assert.equal(stale.snapshot().loans[0].returned, true);
});

test("a failed reload of externally corrupted data keeps the previous snapshot", () => {
  const storage = memoryStorage();
  const book = LoanBook.createBook(storage);
  const before = book.add("Drill", "Sam");
  storage.replace("broken");
  assert.throws(() => book.reload(), hasCode("INVALID_DATA"));
  assert.deepEqual(book.snapshot(), before);
  assert.throws(() => book.add("Ladder", "Jo"), hasCode("CONFLICT"));
  assert.equal(storage.raw(), "broken");
});

test("the same dependency-free file exposes a classic browser global", () => {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(require.resolve("./loan-book.js"), "utf8"), context);
  assert.equal(typeof context.LoanBook.createBook, "function");
  assert.equal(context.LoanBook.STORAGE_KEY, LoanBook.STORAGE_KEY);
  const book = context.LoanBook.createBook(memoryStorage());
  assert.equal(book.snapshot().loans.length, 0);
});
