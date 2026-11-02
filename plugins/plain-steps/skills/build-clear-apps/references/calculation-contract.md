# Local calculation-flow contract

Use this resource only when the requested job is a numeric calculation with inputs and a result. For a different app, use the build method and native flow utilities within its real architecture. Do not turn booking, messaging or automation into a local calculation form.

The agent authors a short JSON contract from the user's ordinary request, preserving the actual formula, units, corrected values and exclusions. This is build input, not a user intake form. Check an independently known example before generating the app. Do not invent a formula because a UI can render it.

The Node.js scaffolder uses only standard-library modules and the bundled utility. It validates the explicit contract, copies local assets and refuses an existing output directory. It interprets no natural-language request and evaluates no formula code strings. The generated browser app needs no Node.js, server or installation. Local-file browser behaviour still requires a permitted browser test; generation and unit checks do not establish it.

```sh
node scripts/scaffold.cjs assets/calculation-contract.example.json /path/to/a/new-directory
```

Run from this skill directory, or use actual absolute paths. Choose a new destination rather than replacing an existing app. The provided paint contract is a fictional arithmetic example, not product or purchasing advice. Inputs 20m², two coats and 10m²/litre produce 4.0 litres; real coverage assumptions remain the user's responsibility.

## Fields

| Property | Accepted value / purpose |
|---|---|
| `id` | Stable lowercase slug, up to60 characters. Isolates the app's browser storage. Use a new ID for an incompatible app/data contract. |
| `title` | Actual task name, not “Dashboard”. |
| `startLabel`, `resumeLabel`, `calculateLabel`, `resultLabel` | Concrete nonempty labels, each up to180 characters. Do not claim an external action that this local calculator does not perform. |
| `unit` | Optional result unit, up to40 characters. Put input units in each input label. |
| `precision` | Required integer0–6: displayed decimal places, not a guarantee of real-world measurement accuracy. |
| `fields` | One to12 numeric fields. More complicated tasks need a suitable different flow. |
| `formula` | Bounded expression tree using numbers, `{"field":"name"}` and the operation objects below. Strings of executable code are rejected. |
| `explanation` | Optional precise explanation up to1200 characters. Critical assumptions also belong in visible labels/help, not only this disclosure. |
| `density` | Optional `comfortable` or `compact` default; users can change it. |
| `locale` | Optional supported language tag for output formatting; default is `en`. Locale must come from task context, not diagnosis. |

Each numeric field has a unique safe `id` and a `label`. Optional `help` is visible beside the input. Optional finite `min`/`max` and boolean `integer` constrain entered values; an optional numeric `default` must satisfy those constraints. Do not put a silent default into a field whose value needs the user's decision. User text is retained as a draft, then parsed and checked on calculation. Empty/invalid/overflow/divide-by-zero errors do not erase entries or replace a previous result.

The provided parser accepts decimal-point numbers and optional exponent notation; it does not parse grouping separators, comma decimals or non-Latin digits. `locale` changes output formatting only. Explain or adapt the input convention when the intended users need a different one; do not claim general localisation from that option.

## Expression tree

A node is a finite number, `{"field":"known-id"}`, or `{"op":"operation","args":[...]}`. Supported operations:

- `add`, `multiply`, `min`, `max`: two to12 arguments.
- `subtract`, `divide`: exactly two arguments, ordered left then right.
- `negate`: one argument.

Depth is limited to12 and total nodes to128. No network calls, imports, arbitrary identifiers or executable expressions are accepted. Division by zero and non-finite arithmetic produce a recoverable error. A domain needing dates, conditional business rules, remote data or other operations should use an explicit suitable implementation, not an invented extension to this contract.

## App state and recovery

The generated app keeps a draft, a completed result with its own inputs, one named calculation undo and display preferences. Editing keeps the old result tied to its original inputs; recalculation produces a new result. Undo restores the preceding result/inputs while retaining display preferences. Back preserves the current draft. Continue resumes a current result when inputs still match, otherwise the draft.

It saves local state only through a guarded adapter with readback. Unknown/corrupt saved data and detected external changes are preserved, not silently reset. On denied reads the app stays session-only; write failures offer safe retry. If a write completes but its readback fails, retry first reconciles the exact attempted value with actual storage; it does not repeat an already-confirmed identical write or overwrite different competing data. An explicit matching external event during that uncertainty, or a clear event from the same storage area, invalidates the saved claim and blocks retry from recreating removed work. Conflict detection is best effort, not an atomic multi-tab transaction. Browser storage is unencrypted, can be cleared/evicted, and is no backup or cross-device service. The app makes no network requests; this does not change the browser's own data practices.

## Checks

`node scripts/self-test.cjs` checks the pure formula/contract/store and generation boundaries without a browser or external dependencies. It does not test actual DOM focus, keyboard, screen-reader announcements, layout, native file storage or participant comprehension. Check those separately in a permitted environment. Keep that evidence distinct from a successful generated folder.
