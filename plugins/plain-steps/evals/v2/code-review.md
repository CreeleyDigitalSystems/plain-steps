# Independent implementation review — Plain Steps 0.2.0

Scope: read-only review of the actual two skills and linked workflows, numeric-flow utility, generated-app assets, scaffolder and existing 14-check receipt; semantic grading was inspected without rerunning it. No browser, account, installation, publication, private history or source mutation was performed. Targeted pure-Node probes were used only for a newly identified recovery case.

## Findings and verified resolution

1. **P2 — repeated save live-region mutations while typing.** The generated calculation app saves drafts on each input event. Its original `showStorage()` unconditionally replaced the text of the polite live save-status region even when the message was unchanged. This creates unnecessary live-region mutations on each keystroke, contrary to the package's interaction guidance. Actual assistive-technology announcement behaviour was not tested. Fix by updating the DOM only when the status text changes. Resolved: `updateStatus` changes text only when it differs, and the app uses that helper plus a conditional problem-state attribute update. Independent fake-region checks observed two mutations for Saved/Saved/Failed, not three. Actual assistive-technology behaviour remains untested.

2. **P2 — ambiguous successful write becomes a false external conflict on Retry.** A pure-Node reproduction made `setItem` succeed and the immediate readback throw once. The first result was appropriately unverified/failed, but Retry compared the actual just-written bytes with the old `lastRaw`, declared an external conflict and disabled retry despite the exact requested data already being saved. Preserve and reconcile the last ambiguous serialized attempt by actual readback; genuinely different external data must still stop writes. Original reproduction is retained in `code-review-probes.json`. Resolved: `attemptedRaw` tracks the ambiguous serialized attempt; an exact actual readback is reconciled without another write, while a different stored value still causes conflict. Independent probes confirmed both cases.

3. **P2 — external deletion/clear events could leave a false save or recreate removed work.** Focused review of the first recovery fix found that a removal event after an ambiguous write could match the older null baseline and be missed; Retry then recreated the removed data. A `key:null` storage-clear event was also ignored, leaving `saved:true` after data disappeared. Resolved: matching external events while an attempt is ambiguous, and clear events affecting this storage, mark conflict; provided foreign storage areas are ignored. Independent probes confirmed no recreation, an invalidated save status after clear and no false conflict from another storage area.

All identified concrete findings are resolved in the reviewed source. The author ran19 current code checks after these changes (the original14 and intermediate17 receipts remain preserved). This reviewer independently ran only six focused changed-boundary probes, not the entire author suite. Evidence: `code-review-final-check.json`; earlier failing probes remain available.

## Sound inspected boundaries

- Numeric formulas use bounded explicit expression trees; no code strings, evaluation, network calls or imported operations. Unknown fields/operators, unsafe field identities, invalid values, zero divisors and non-finite results are rejected through recoverable paths.
- Loaded state is validated against a versioned envelope and application validator. Corrupt/future/unknown data is preserved. Reads and returned state are copied. Session changes remain available when storage is unavailable or conflicting; the adapter does not pretend these are saved.
- Generation refuses an existing destination and creates only a new directory. Labels remain data in an escaped local script, then are rendered with text assignment. No personal paths, private source identity, secret/binding or network client was found in the reviewed skill/resources.
- The generated app has labelled native numeric-entry controls, explicit error text, retained draft, distinct completed-result inputs, named calculation undo, Back/Continue, density/detail preferences and local-storage limits. These are source observations, not executed browser or participant evidence.
- The build description now front-loads ordinary user-facing app creation/repair. It explicitly separates installation from invocation and avoids promising all-host coverage. The conversation workflows preserve corrections/dependencies, commitments, style, unknown intent and action boundaries without adding the older private state service.
- The numeric resource's documented scope is suitably limited: one result and supported arithmetic; date, condition, external-operation and other domains require a suitable real implementation. The paint example cannot establish unfamiliar-domain generalisation.
- Both blinded semantic versions passed the supplied 12 cases/151 applicable invariants; this supplies no observed superiority and no causal efficacy or participant claim.

## Open acceptance outside this code review

Root owns actual native installed invocation, generated-app completion, final package identity/privacy review and public readback. Browser keyboard/focus/layout/storage, actual screen-reader behaviour and participant usefulness remain separate. No fixed control count or source test certifies comprehension. The prior browser policy denial remains binding.

## Reviewed source identity

| File | SHA-256 |
|---|---|
| `skills/build-clear-apps/assets/flow-kit.js` | `a3f20d8d0b1dd6458f3726524f45c6af445b8ade5b7508cc27b4b4de0e344213` |
| `skills/build-clear-apps/assets/calculation-flow/app.js` | `bc0d729ff084f1ad85f34416392b31054768f656a4ae6f113108b2f4ef68c425` |
| `skills/build-clear-apps/scripts/scaffold.cjs` | `0c81e4fc71aa8bf51110f78b237d4443c458999674758af95fd7f1239751a51e` |
| `skills/build-clear-apps/SKILL.md` | `352a8c1bb0a7492a0275dae8fde7d7b0dd1e0459476f6882842d694e6b454bb7` |
| `skills/keep-the-meaning/SKILL.md` | `9686177082a3a94cf17211ee65b9845d8a3713b2916f11f2f7e6f95a8807ce69` |

## Added source-inspection helper

The newly present `scripts/audit_ui.py` was inspected read-only. It bounds input to one explicit regular UTF-8 HTML file (2 MiB, element/depth limits), rejects entry/path symlinks within scope and resolved traversal, and reads no linked assets. It parses source without running scripts or making requests. Initial hidden sections/closed disclosures, native naming evidence, reference concerns and counts are separately described from computed browser semantics. Its output explicitly leaves CSS/dynamic DOM, keyboard/focus, layout, storage and task completion unverified and applies no universal control-count threshold. No material privacy or correctness blocker was found in this bounded source review. Helper tests were not rerun by this reviewer.

Helper SHA-256: `60f38b5a591600c945d2377bf0876d7f11cb3b680bfeb3e4f17f1cfee1c75a76`.
