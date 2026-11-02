# Build method: use the person's task as the screen structure

Read only the section needed for the current flow. These are engineering remedies informed by the package research, not a universal neurodivergent profile.

## Choose the shape by useful work

| Job | Small first surface | Keep visible | Avoid |
|---|---|---|---|
| Enter values and calculate | Direct labelled form or Start/Continue when resumption has real value | Units, required inputs, calculation assumptions, result | A separate dashboard before a four-field calculation |
| Capture and review records | Add/review actions with a findable overview | Save state, current selection, correction and undo | Renaming the packing example without checking domain requirements |
| Complete a multi-step task | Named current step, progress and predictable Back | Values already entered and what finishes the task | Auto-advance or losing a draft on Back |
| Monitor real work | Actual status, next necessary action and details on demand | What ran, result, failure remedy and freshness | Animated or simulated activity presented as execution |
| Repair an existing interface | Preserve the useful existing path and remove the observed barrier | Existing data, functions, user corrections | Replacing the whole product because one view is dense |

A two-action home has a navigation cost. Add it when separating two real jobs or resuming work makes the task clearer; choose a direct form/list when that reduces unnecessary movement. A list with many records may need density, search or filtering. Do not add those features until the task needs them.

## Task contract and state coverage

Privately retain one concise contract in the existing project record, not a new product screen:

- **Result:** person, starting state, useful operation and observable completed state/destination.
- **Meaning:** input values/units, accepted corrections, exclusions, optional/hypothetical features and privacy/budget boundaries.
- **States:** empty, draft, validation failure, in-progress operation where real, successful result, save failure, resumed progress and safe recovery.
- **Proof:** exact example with independently known output, keyboard sequence, failure/retry and final-state readback.

Trace a correction all the way. If “20 hours, actually 12” changes a calculator, update the actual data/formula, visible summary, example output, validation and documentation. A corrected heading with an old calculation is a failed correction.

## Presentation without information loss

Plain labels name the action and outcome. “Calculate paint needed” predicts behaviour; “Process” does not. Retain domain terms when precision matters and give an example rather than replacing them with vague language. Keep sign, decimal, date and currency conventions explicit when they affect meaning. Do not infer locale from a person's diagnosis or a folder name.

Critical help remains visible: units, constraints, consequences, save failures and recovery. Longer rationale, implementation detail and optional examples can use a named details disclosure. A user-selected “more detail” mode may open/expand these, but must not reveal a previously hidden essential operation. A dense preference changes spacing, not target reachability or data.

Show one next step when that helps. Keep a visible overview for people who choose it. Avoid congratulatory infantilising copy, unsolicited reassurance or countdowns. Errors describe the input and correction, not the person's ability.

## Native access and recovery

Use links for navigation and buttons for operations; labels connect to inputs. A heading is not a button. Group related radios with a fieldset/legend. Use actual disabled states only when an operation is unavailable and explain a non-obvious prerequisite. Provide textual success/selection/state information alongside visual cues.

Keyboard focus must follow the task: initial/main heading or first input, first invalid field after submit, new view heading after navigation, affected control after undo. Preserve focus during incremental list updates when possible. Provide a skip link for repeated navigation. Use one polite status region for meaningful changes and a specific error summary/inline error path; do not announce every keystroke. Avoid rewriting an unchanged save-status message; the kit's `updateStatus` helper does this. A repeated explicit action announcement may need a renewed DOM update through `announce`. Actual screen-reader behaviour requires separate validation.

Back keeps draft data. A result view must show the inputs/assumptions needed to trust the result and offer a clear edit route. Undo reverses a named action with enough retained state; it must not silently change unrelated display preferences. A resumed result must still correspond to its stored inputs. Save success requires actual successful storage/readback, not merely a write attempt.

## Local resources and their limits

`assets/flow-kit.js` is a small dependency-free utility usable in an existing app. It exposes pure numeric contract validation/calculation and a guarded local-store adapter, plus DOM helpers for views, status and field errors. It does not interpret natural language, make external operations safe or provide cross-device persistence.

`assets/calculation-flow/` and `scripts/scaffold.cjs` generate a working local calculation app for tasks fitting its explicit numeric contract. The generator refuses an existing destination and rejects executable formula strings. It offers a two-action start, actual calculation, error preservation, edit/back, named undo, resumption and presentation choices. These are authored implementation resources; inspect/adapt them to the requested domain rather than treating the default example as proof of general app generation.

## Acceptance and honest reporting

Source/unit tests can prove arithmetic and state invariants. Browser tests are needed for actual focus, keyboard, layout and storage behaviour; screen-reader/participant sessions are separate. If a surface is refused by policy, keep the refusal and report the unfinished check rather than using another protocol to reach the same blocked content.

For a fresh build, retain the ordinary request, package revision, observed skill selection, generated artifact, independently expected result and actual task result. Fictional evaluation requests may be saved as fixtures; do not archive people's raw conversations. Report clarification and repair counts along with completion, not just formatting or control count.
