# Plain Steps

Describe the work in your own words. Plain Steps helps the host AI keep your meaning and build an app with understandable actions and recovery.

This is **experimental 0.2.0**. Version 0.1.0 remains preserved. Read [Verification](docs/VERIFICATION.md) for what is written, installed, executed, tested and still unfinished.

## Everyday use

Install once in a supported host and leave the plugin enabled. Make your normal request; you do not need a diagnosis, profile, polished prompt or separate accessibility instruction. The host controls skill selection, so the package cannot guarantee that it will run on every message. Explicitly naming `$keep-the-meaning` or `$build-clear-apps` is a fallback when the host misses the relevant workflow.

For repeated work in one coding project, say “Use Plain Steps in this project.” The [optional setup skill](skills/setup-plain-steps/SKILL.md) checks the active instruction source and adds a small project default while preserving existing instructions. It changes no global rules, captures no chats and creates no background worker. Installation alone showed mixed skill selection; a configured ordinary correction loaded both skills in the recorded run. Neither result guarantees every future selection.

The two jobs can work together or separately:

- **Keep the meaning:** preserve quantities, exclusions, uncertainty, humour and corrections; draft or rewrite faithfully; explain incoming messages without inventing the sender's intent.
- **Build clear apps:** carry the request into real working software, with concrete labels, an obvious next action, optional detail, accessible interaction and recoverable errors.

For example:

> “Build a local loan book. Record the item and borrower, show what is still out, and let me undo a return. No accounts or messages. Reminders might be useful later, but don't build them now.”

The intended result is the loan workflow. The reminder stays an idea. A later correction changes dependent code, calculations and checks, rather than receiving only an acknowledgement. A material missing fact gets one focused question; a reversible presentation detail can use a reasonable default.

## Choose detail without an intake form

Say “just the draft”, “keep the joke”, “use precise terms”, “show a dense overview”, “one step at a time” or “reduce motion”. Preferences can change. The package does not infer a diagnosis or save a profile from these requests.

A simple start can use two large concrete actions, but it should not add a home screen merely to reach that number. Essential information, errors, save state, Back and help must stay findable. More detail or a direct list can be the clearer choice.

## What is implemented

The conversation skill includes specific workflows for branching requests, correction propagation, material ambiguity, stops, faithful rewrites and uncertain incoming tone. The build skill applies to ordinary app requests and includes original native-control styles, guarded local state and focus/status/error utilities.

For a suitable **single-result numeric task**, the agent can author an explicit data contract and generate a local calculation flow. The scaffolder does not understand natural language, evaluate executable formula strings or provide a backend. Multiple outputs, whole-unit rounding, dates and non-calculation jobs need their actual implementation; requirements must not be dropped to fit the template.

An optional Python source inspector reads one chosen HTML file without following assets or running it. It reports source-visible controls, text and naming/reference concerns. It cannot judge rendered layout, keyboard use, screen readers, comprehension or conformance. These tools are for the agent's work, not diagnostic controls placed in the app.

## Evidence and boundaries

Written workflows and passing logic checks do not prove that a person can complete a new app's task. Native selection, actual code operation, browser completion and participant feedback remain separate evidence. The same-cue fictional conversation comparison passed in both conditions and showed no advantage; it does not establish reduced repair burden.

The package has no model API client, backend, telemetry, chat archive or account requirement. It does not rewrite the host UI, capture every prompt, run background workers or guarantee interpretation. The user's current task and the host's permissions still control actions. Host/model use can cost money or be limited.

For released installation use the repository's root guide or these commands:

```sh
codex plugin marketplace add https://github.com/CreeleyDigitalSystems/plain-steps --ref v0.2.0
codex plugin add plain-steps@plain-steps-public
```

An existing source pinned to 0.1.0 stays pinned. Remove only its `plain-steps-public` marketplace registration through the host, then register the tag above and install again. Preserve other marketplaces and generated project files.

A ZIP containing this plugin is separate from the repository's marketplace catalogue. Check the actual release/tag before installing a version.

Further detail: [Architecture](docs/ARCHITECTURE.md), [Research](docs/RESEARCH.md), [source-to-test matrix](docs/source-to-test.csv), [Evaluation](docs/EVALUATION.md), [Privacy](PRIVACY.md), [Limits](LIMITATIONS.md), [Changes](CHANGELOG.md) and [Licence](LICENSE).
