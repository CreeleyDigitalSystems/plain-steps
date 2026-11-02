# Plain Steps

AI skills and local build resources for two connected jobs: preserve what a person means, then produce software they can understand and use. A short chat reply alone does not make the resulting app understandable.

**Experimental 0.2.1.** Conversation workflows, reusable build code, an HTML source inspector and optional project setup. Ordinary native app and correction runs have been inspected; browser and participant checks remain open. The [0.1.0 release](https://github.com/CreeleyDigitalSystems/plain-steps/releases/tag/v0.1.0) is preserved. See [Verification](plugins/plain-steps/docs/VERIFICATION.md) for the evidence and limits.

## Use your own words

Install once in a supported host, leave the plugin enabled, and describe the work normally. No diagnosis, profile quiz, rewritten prompt or repeated accessibility instruction is required by the package.

> “Make a local loan book for workshop equipment. Record the item and borrower, mark returns, keep the history and let me undo a mistaken return. No account or cloud.”

The host decides which installed skill to select. The build skill now describes ordinary user-facing app creation and repair, rather than waiting for an accessibility request. Observed selection was mixed. For repeated work in one project, say “Use Plain Steps in this project.” The optional setup skill preserves existing project instructions and adds a small, scoped default after checking the active instruction source. It changes no global settings and captures no chats. Explicitly naming `$keep-the-meaning` or `$build-clear-apps` remains a troubleshooting step.

## Install

Use the tagged public source:

```sh
codex plugin marketplace add https://github.com/CreeleyDigitalSystems/plain-steps --ref v0.2.1
codex plugin add plain-steps@plain-steps-public
```

If you previously pinned this marketplace to an earlier tag, remove only its Plain Steps registration with `codex plugin marketplace remove plain-steps-public`, then run the two commands above to register and install 0.2.1. Preserve other marketplaces and any project files.

Follow the host's actual trust or permission prompts. For a reviewed local checkout, `codex plugin marketplace add .` from its repository root registers that source before `plugin add`. A marketplace name already registered to a different source must be reconciled through the host controls; do not assume the command replaces it. A local install is not proof of public release or successful activation. This source marketplace is separate from an OpenAI directory listing. Web, mobile and other hosts need their own availability checks.

Version 0.2.1 repairs a task-continuation failure: ordinary work should verify the requested artifact, while package-maintainer experiments stay separate. Relevance questions steer unfinished work back into action; explicit pauses still stop it.

## What the package does

- [Keep the meaning](plugins/plain-steps/skills/keep-the-meaning/SKILL.md): rough requests, corrections, faithful rewrites and incoming messages, with the person's chosen voice and detail.
- [Build clear apps](plugins/plain-steps/skills/build-clear-apps/SKILL.md): implement the real task with concrete actions, findable detail, keyboard/native controls and recovery in the first flow.
- [Optional project setup](plugins/plain-steps/skills/setup-plain-steps/SKILL.md): enable relevant guidance once for a chosen project, preserving existing instructions.
- [Local build resources](plugins/plain-steps/docs/ARCHITECTURE.md): original utilities, styles, a bounded calculation scaffolder and a read-only HTML source inspector. These support the agent; they are not an extra user intake form or a backend.
- [Research](plugins/plain-steps/docs/RESEARCH.md) and [source-to-test matrix](plugins/plain-steps/docs/source-to-test.csv): problems, remedies, evidence strength and unfinished checks.

The [packing reference](plugins/plain-steps/examples/packing/index.html) demonstrates a small offline flow. It is one example, not the plugin interface or proof that every generated app works. Two large start actions are an option; a direct form or dense overview may suit another task better.

## Cost, data and limits

The package is free under the [MIT licence](LICENSE). It supplies no model, subscription, API credits or hosting allowance. Host/model charges, limits and privacy settings remain separate. The package requires no new account or key and adds no server, telemetry, chat capture or persistent profile.

Read the [plugin guide](plugins/plain-steps/README.md), [Privacy](plugins/plain-steps/PRIVACY.md), [Limits](plugins/plain-steps/LIMITATIONS.md) and [Changes](plugins/plain-steps/CHANGELOG.md). Plain Steps is independently published by Creeley Digital Systems; no platform endorsement, clinical benefit, universal accessibility or automatic conformance is claimed.
