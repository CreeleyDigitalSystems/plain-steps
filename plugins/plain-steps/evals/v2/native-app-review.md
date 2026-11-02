# Independent review of native-generated fictional apps

Reviewed 3 November 2026. **No blocking defects found within source and pure Node checks.** Both apps are written and locally tested at the logic/simulated-event level. Actual browser interaction and participant benefit remain unverified.

The review used the two request/acceptance records, actual app source, author test source, and narrowly filtered completed-command evidence. Raw private trace context is excluded. No browser automation, server, protocol or alternate-browser route was used. The author suites were read rather than rerun: the recorded paint check completed 24 checks; the loan core completed 15 tests with zero failures.

## Required operations

- **Paint:** the independently calculated example is (24 × 2 ÷ 12 = 4) L, and (ceil(4 ÷ 2.5) = 2) tins: 5 L purchased. The source preserves 24 rather than the corrected-away 18. All four numbers are editable; exact decimal fraction arithmetic handles the tin ceiling.
- **Loans:** the empty-book → Soldering iron / Morgan → return → retained Returned history → undo → saved-state readback journey passed using the actual core and app event handlers in a pure Node element/storage stand-in. A fresh context recovered the entry as still out. That is simulated wiring evidence, not an actual browser journey.

Seven independent probes passed. Additional cases targeted meaningful gaps: uncertain-save UI recovery, whitespace validation retaining the draft and focusing the missing borrower, and special-character text rendering. The uncertain-save case blocked further mutation, kept the form, focused **Reopen saved book**, then read back the saved entry without an automatic duplicate.

## Source findings

Both entrypoints use existing relative assets and classic deferred scripts. No modules, fetches, external resources or runtime dependencies were found. No source-level module/CORS dependency was identified. Actual file-origin/CSP behavior and localStorage availability in the intended browser remain unexercised.

Paint has native labelled number fields, associated errors, output/save live regions, visible focus and responsive CSS. Invalid drafts are saved as drafts, results clear when invalid, and a save is reported only after readback. Opening an unreadable record preserves it; the warning explains that editing retries saving. Its save failure does not prevent calculation.

Loans has labelled native fields/buttons, active and Returned views, local search, text-safe rendering and persistent one-step undo. Validation keeps the form and focuses the missing field. Storage failures preserve the snapshot/draft, block mutation and expose recovery. Returning removes the old button and explicitly focuses undo; undo focuses the restored return button. Read-before-write rejects observed stale storage, and readback precedes success. Cross-window writes are not atomic; this limitation is documented.

Neither app implements accounts, network transfer, prices, messages, reminders or sharing. Paint has no waste allowance. Loans has no due dates or seeded entries. localStorage is device/browser local, unencrypted, clearable and not a backup. The source contains focus and reflow rules; rendered contrast, reflow, zoom, keyboard and assistive behavior have not been validated.

## Attribution and acceptance limits

The ordinary requests name neither a skill nor accessibility. The paint trace does **not** show a Plain Steps read, so its quality cannot be attributed to the plugin. The loans trace does show a completed read of the installed 0.2.0 build skill, followed by an implemented loan workflow beyond the bundled examples. This is one observed native use, not a causal comparison or proof of broad benefit.

**Exact next acceptance:** the intended user manually opens each app in the intended browser. For paint, change area to 60, confirm 10 L and 4 tins, close/reopen and confirm persistence. For loans, record Soldering iron / Morgan, mark returned, find it in Returned, undo, close/reopen and confirm it remains still out. Observe keyboard focus, error recovery, narrow/zoomed layout and assistive announcements during those journeys.

The companion JSON records the seven probe results and reviewed-source SHA-256 values. No app source was changed.

