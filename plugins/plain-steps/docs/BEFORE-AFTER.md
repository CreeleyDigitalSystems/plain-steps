# Historical 0.1 example: a representative app before and after

This preserves the original 0.1 packing comparison and unmatched browser evidence. See [current verification and native acceptance](VERIFICATION.md) for later implementation, mixed skill selection and the configured correction.

This compares an independently generated [baseline packing app](../evals/baseline-app/index.html), produced without the Plain Steps skills, with the [Plain Steps packing example](../examples/packing/index.html). Both address a fictional three-night packing task: add items, mark them packed and keep the list in the browser without an account or cloud service.

The comparison is based on actual HTML, JavaScript and CSS, plus the candidate's recorded local checks. It is not a controlled effectiveness study. The examples were not generated under identical instruction conditions, and the baseline has not received the matched browser checks. Neither has participant usability validation. A clearer structure in source does not establish better understanding or lower effort for a person.

## What changes in the journey

The baseline puts the add field and list together on one page. The candidate begins with **Add an item** and **Continue packing**, then shows the chosen task. **Display settings** is a visible secondary action. This concentrates the start screen on two tasks, while adding navigation that some people may prefer to avoid.

| Aspect | Baseline source | Candidate source | Practical implication / limit |
|---|---|---|---|
| Starting surface | Add field, Add item button, list and progress on one page. Each saved item adds a visible checkbox. | Two primary actions, secondary display settings, count and save status. List appears after Continue packing. | Candidate keeps the starting control count stable as the list grows. Baseline is already compact when empty and provides an immediate overview. Fewer visible items is not inherently more usable. |
| Add first item | Type in the visible field, then submit. | Activate Add an item, type, then submit; arrival at the list is automatic after a valid add. | Candidate requires one extra action before typing. Baseline may be faster for adding many items. |
| Add another item | Field remains available beside the list. | Activate Add an item from the list, then submit. | Candidate separates entering from checking. That separation costs another view transition for each new item. |
| Resume packing | Saved rows render on the initial page. | Saved count is visible initially; activate Continue packing to reach rows. | Candidate adds one navigation action before toggling a saved item. This needs testing with people who prefer a dense overview. |
| Return from unfinished entry | Single page needs no back action. | Back to start retains the draft in the open page; returning to entry restores it. | Candidate prevents back-navigation loss, but returning to the list via start requires navigation. An unsubmitted draft is not promised to survive reload. |
| Mark/recover packed state | Native checkbox can be toggled again to reverse a change. | Native checkbox plus a separate Undo last toggle action; last-toggle undo state is saved. | Both have a reversible packed state. Candidate makes one-step recovery explicit; it does not supply general history, undo-add or arbitrary data recovery. |
| Progress and labels | Three-night heading, instructions, count and native labelled checkboxes. Packed rows use checked state and struck-through text. | Literal task heading, count, checked state and visible Packed/Not packed text. | Both communicate progress in source. Candidate adds explicit visible state text. Actual screen-reader comprehension is unverified. |
| Empty/invalid input | Required field and browser validation; whitespace-only input receives custom validity text. | Inline specific error, invalid state and input focus; empty/overlong text is retained. | Native validation can be useful; candidate offers more explicit error presentation. Baseline browser behaviour remains untested. Their text limits differ: 160 versus 100 characters. |
| Ordinary local save | Writes list to browser storage; failure warning exists. A static footer always describes browser saving. | Reads back its saved state and shows dynamic success, failure, unavailable or conflict status; write retry is available. | Candidate's saving claim changes with the actual result. Baseline's permanent saving footer can conflict with its failure alert. |
| Malformed stored data | Reports load failure, starts with an empty in-memory list and permits the next save to replace the unreadable value. | Preserves the unreadable saved value and keeps new changes session-only. | Candidate avoids silently replacing a potentially recoverable original. It intentionally does not add a repair/reset/export control; manual recovery remains outside this example. |
| Another page changes storage | Writes its current list without comparing the prior stored value. | Detects a changed stored value and avoids knowingly overwriting it. | Candidate adds best-effort conflict protection, not an atomic multi-tab transaction or merge feature. |
| Presentation choice | One layout. | Optional roomy/compact spacing, saved in the same browser. | Candidate supports one concrete preference without diagnosis disclosure. It does not supply every possible theme, typography or pacing control. |
| Keyboard and focus | Native form/checkboxes, focus styling, input refocus after adding and live messages for add/toggle. | Native controls, focus styling, explicit routing/undo focus, inline error state and live action/save messages. | Both contain useful access features. Candidate has recorded keyboard/DOM checks; baseline does not yet have comparable execution evidence. Neither has an actual screen-reader session. |
| Motion/network | No animation, external resources, account or network call is present in inspected source. | The same bounded source observation. | This is shared behaviour, not a candidate improvement. Browser and AI-host practices are separate. |

Control count illustrates the trade-off without predicting cognition: with `n` saved items, the baseline normally exposes `n` checkboxes plus the input and submit button. Candidate start exposes three buttons and no item rows. Its list then exposes `n` checkboxes, Add an item, Undo last toggle and Back to start. Counting controls does not measure understanding, decisions or task completion.

## What is actually verified

| Evidence | Baseline | Candidate |
|---|---|---|
| Generated source | Present; independently generated without these skills. | Present; deliberately implements the package's reference pattern. |
| JavaScript syntax | Checked. | Included in the existing local verification work. |
| Browser interaction | **Not tested.** Do not infer a pass from source or syntax. | Recorded 12 passing checks in installed Google Chrome 156.0.8078.79 using local file URLs, with no uncaught errors or outbound requests in that run. |
| Recorded candidate checks | No matched results. | Keyboard entry; empty/long-input recovery; retained back draft; toggle/count/undo; safe text; reload and saved undo; persisted compact preference; 320px/enlarged-text reflow; malformed/invalid saved-data preservation; save-failure retry; storage-read denial; detected concurrent change. |
| Visual review | Not performed. | Recorded screenshots reviewed at desktop, 320px and 320px with enlarged text. |
| Actual screen reader, physical mobile, Safari/Firefox | Unverified. | Unverified. DOM inspection and viewport emulation do not substitute for these. |
| Participant comprehension or preference | Unverified. | Unverified. Synthetic profiles are not participants. |

The candidate's recorded checks demonstrate named behaviours in one environment. They do not establish that the skills caused better code, that every model will follow them, that people complete the task faster, or that the extra navigation is worthwhile. The separate six-request semantic evaluation concerns interpretation plans, not successful app generation.

An assistive-technology edge remains open: the candidate's completion count is not itself a live region, and adding the same item name twice can produce the same live-message text. Source review alone does not establish the real announcement behaviour or user impact. No untested fix has been applied to manufacture a pass.

## Exact unfinished comparison

Run the baseline through the **same existing browser task sequence and environment** as the candidate, record actual pass/failure results and compare the full add → pack → reverse → reload journey. Include navigation/activation counts and distinguish shared successes from candidate-specific changes. Keep the baseline original intact. This matched run was not completed because the requested further browser automation was not permitted in this session; no alternate automation route was used.

Only after that matched technical comparison should a claim about participant benefit be considered, using consenting people with varied preferences. A public beta can transparently expose these limits; publication itself is not validation.
