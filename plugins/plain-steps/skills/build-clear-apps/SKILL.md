---
name: build-clear-apps
description: Create or repair user-facing app screens and workflows from an ordinary app request, including forms, calculators, lists and multi-step tasks. Build understandable interactions and recovery into the first implementation; the user need not ask separately for accessibility.
---
# Build clear apps

Deliver an understandable working app from the person's actual request. This applies while creating or changing a user-facing flow, not to unrelated code-only work or simple factual answers. Do not wait for “make it accessible” or a diagnosis disclosure. Skill selection is host-controlled; installation alone does not guarantee invocation.

## Carry meaning into the implementation

Inspect the existing source, wiring and working journey before replacing it. Preserve recoverable changes. Recover the intended job, data/units, exclusions, corrected values, privacy/cost constraints and actual completion condition. For rough or conflicting language use [Keep the meaning](../keep-the-meaning/SKILL.md). Ask one material question only if a missing answer changes the action; continue independent authorised work.

For substantial builds quietly keep a **task contract** in the existing project record: what the person can do, input → real operation → resulting state/destination, constraints that must survive, and the check that proves completion. Trace corrections through labels, calculations, persistence, documentation and tests. Do not require the person to fill a new brief or expose this contract on the everyday screen.

Choose the actual operation before the screen. A local calculator needs real calculations; a booking needs a real booking destination. Do not call a saved draft “booked”, mock dispatch “running”, or a manual form the requested automation. Use an existing supported tool/backend when necessary and authorised; a polished panel cannot replace that dependency.

## Make the first usable flow small

Start from the user's main task rather than a dashboard of possible features. For a simple start, consider two large actions labelled with the actual work and one clear next step. Two is a starting pattern, not a requirement to add a home screen or hide useful controls. If a direct form/list is clearer or the user wants a dense overview, use it. Essential action, cost, save state, errors, back and help remain findable.

Use concrete labels with precise conditions/units. Keep optional explanations behind a visible named disclosure; never hide information needed to decide. Provide density/detail/pacing controls only where useful, without a diagnostic profile or long intake. Honour the user's requested overview, precision, language, motion and pace. Change presentation without changing functionality or meaning.

Read [the build method](references/build-method.md) for screen/state selection and remedies. For dependency-free web apps, inspect the [native flow kit](assets/flow-kit.js) and [styles](assets/flow.css). They provide safe local state, focus/status/error helpers and reflow primitives; they are not a backend or a UI rewrite for the host. When a single-result numeric task fits a start/continue flow, [the deterministic scaffolder](scripts/scaffold.cjs) generates a real local app from an explicit contract; read [its contract](references/calculation-contract.md). The agent authors that contract from the request—do not send the user to a configuration form. Do not omit required outputs or rules to fit the template. For multiple results, whole-unit allocation, dates or other unsupported operations, implement the actual operation explicitly and reuse only compatible parts. Do not force a non-calculation app into this pattern.

## Implement recovery as part of the job

Use semantic/native controls, meaningful accessible names/headings, visible keyboard focus and predictable traversal. Move focus deliberately after view changes, validation and undo. Announce meaningful completion/save/error changes without interrupting every keystroke. Keep textual states, not colour-only meaning. Support generous targets, 320 CSS px reflow/zoom and reduced motion. Avoid flashing, autoplay, drag-only actions, timed dismissal and surprise navigation.

Keep drafts on Back and validation failure. Show truthful draft/saving/saved/failed state and an actionable retry when safe. Undo must identify the operation it reverses; resumption must restore the correct values/state. Render user data as text. Do not overwrite corrupt, unknown-version or externally changed storage to manufacture a successful save. Local browser storage is unencrypted, origin/device-bound, may fail/be cleared and is not a backup; explain its actual boundary.

## Prove the ordinary task

Run an ordinary fictional request in the intended installed host without naming this skill or adding an accessibility repair prompt, on a domain different from bundled examples. Record actual discovery/invocation separately from output quality. Verify the real operation and final result, not a screenshot or self-report.

Test keyboard completion; accessible labels/focus/status; invalid input with recovery; Back, Undo and reopening; stated compact and detail-seeking preferences; narrow/zoom layout; storage/provider failure; correction and excluded-feature cases. Compare baseline/candidate under the same task, tools and context. Count required actions, clarification/repair prompts and completed work; fewer controls alone does not establish comprehension.

When Python is available, the optional [source inspector](../../scripts/audit_ui.py) can report static labels, references and the authored initial surface without executing a page. It is an agent inspection aid, not an app-runtime dependency, rendered-DOM test or usability/conformance verdict.

Use permitted test surfaces. A browser policy refusal is not permission for a server/protocol/automation workaround. Preserve completed evidence and continue independent source/unit checks. Report exactly which behaviour is unverified. Automated checks, synthetic preferences and one working example are not WCAG certification, participant validation or guaranteed effectiveness. See [research](../../docs/RESEARCH.md) and [evaluation](../../docs/EVALUATION.md).
