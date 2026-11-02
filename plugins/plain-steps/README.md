# Plain Steps

Describe your goal in your own words. Plain Steps helps an AI preserve what you meant and build an app with understandable actions.

Version 0.1.0 is a release candidate. Check the release's verification evidence for what has actually passed. Written instructions, local example tests, host installation, public availability and participant usability are different states.

## Use it

Select Plain Steps in a host that supports plugin skills, then make your normal request. You can ask for either job:

- **Keep the meaning:** organise a rough request without losing numbers, exclusions, uncertainty, humour or corrections.
- **Build a clear app:** turn the goal into a usable flow with concrete labels, an obvious next step and optional detail.

For example:

> “I need a packing app for three nights. Just add an item and mark it packed. No account, no cloud. It would be cool to add reminders later, but don't build that now.”

The intended interpretation keeps three nights, both actions and the local-only boundary. Reminders remain an idea. A later correction wins. If a missing detail changes the action, the assistant asks one focused question. Otherwise it continues with a reasonable, visible assumption.

If the meaning is already clear, the skill should get on with the work. It should not turn every request into an interview, repeat a rewritten brief, or ask you to approve routine reversible steps.

## Adjust the experience when useful

Say “shorter”, “more detail”, “use literal labels”, “show more on one screen”, “one step at a time”, or “reduce motion”. These are preferences, not diagnoses. You do not need to disclose personal information to use them. Preferences apply in the active conversation; the package does not create persistent memory.

A start screen with two large concrete actions is an adaptable starting pattern. Some tasks need a denser overview or a different number of actions. The purpose is successful work with fewer avoidable decisions, not a fixed visual rule.

## What you should see in a build

The assistant should use existing working features where appropriate, preserve requested constraints, and test the actual task. Generated interfaces should offer keyboard access, meaningful labels, visible focus, readable status, recoverable errors and predictable back/undo/resume where the task needs them. Saving should be described honestly, including failures.

The bundled fictional example is a three-night packing flow with local browser storage. It is an example pattern, not an AI service and not proof that a newly generated app works. Source, behaviour tests and manual accessibility review still matter.

## Boundaries

These are model instructions, not an automatic enforcement system. They cannot rewrite the host UI, capture every prompt, run background workers or guarantee a model's interpretation. They do not grant permission for publishing, uploads, spending, credential changes or destructive work. The host's permissions and the user's current instructions control.

The source package has no model API client, backend, telemetry or account requirement. Host/model use may cost money or be limited. Read [Privacy](PRIVACY.md) and [Limitations](LIMITATIONS.md) before relying on it with sensitive work.

See [Architecture](docs/ARCHITECTURE.md), [Research](docs/RESEARCH.md), [source-to-test matrix](docs/source-to-test.csv), [Changes](CHANGELOG.md) and [MIT licence](LICENSE). Installation instructions are in the repository's root README.

## Install or invoke

The source repository supplies the marketplace. From a repository checkout run `codex plugin marketplace add .`, then `codex plugin add plain-steps@plain-steps-public`. For a published tag use `codex plugin marketplace add CreeleyDigitalSystems/plain-steps --ref v0.1.0` first. Check the actual release exists before using the remote command.

In a host that exposes installed skills, explicitly use `$keep-the-meaning` or `$build-clear-apps`. Automatic selection is host-controlled and remains unverified. This ZIP alone is not a marketplace catalogue; the public repository contains that catalogue.

Read [Verification](docs/VERIFICATION.md) and [Before/after](docs/BEFORE-AFTER.md) for the current evidence and unfinished checks.
