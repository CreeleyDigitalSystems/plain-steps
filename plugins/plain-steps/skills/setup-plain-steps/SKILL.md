---
name: setup-plain-steps
description: Set up Plain Steps defaults for one chosen coding project when the user asks to enable its app-building or communication guidance there. This is optional project setup, not a trigger for unrelated tasks.
---
# Set up Plain Steps for a project

Use this only when the person requests project setup, for example “Use Plain Steps in this project.” One-time project instructions can reduce the need to name a skill on each request. They do not guarantee model selection, replace host permissions or create cross-project memory.

## Confirm the actual scope

Use the explicitly chosen existing project. “This project” can identify the current host project when unambiguous; ask one question only if the destination is missing or ambiguous. Do not choose a home directory, system/app settings, another project or a global instruction file. Do not create a profile, copy chats, inspect credentials, change hooks or contact a service.

Check that the relevant Plain Steps skills are actually available in this host. The project block refers to `build-clear-apps` and `keep-the-meaning`; a file referring to unavailable skills does not establish useful setup.

## Identify the active instruction source

Inspect the host's actual project-instruction source before editing. Within a directory, `AGENTS.override.md` takes precedence over `AGENTS.md`; a configured custom fallback may apply when neither is present. Use available host source metadata, not a guess or a global configuration/credential read. If the active source is unknown, preview only and resolve that one material detail before writing.

The helper detects the two known standard filenames. Supply the actual host-confirmed custom fallback basename with `--active-file` when needed; existing sources remain read-only to the helper. Never create a normal `AGENTS.md` to shadow active override/fallback instructions.

An empty or whitespace-only instruction candidate returns `ambiguous_source`. Inspect the host's active instruction chain before editing; do not assume the host skips it or merge into it in a way that could shadow other rules.

## Prepare, then apply within existing authority

Read the [helper](../../scripts/setup_project.py) before use. Run it with the actual installed helper path and selected project:

```sh
python3 /actual/plugin/scripts/setup_project.py /chosen/project --active-file AGENTS.md
```

Use that new-file command only after the host confirms standard setup with no active custom fallback. Default mode is read-only preview; without a confirmed source, the helper returns `source_unconfirmed` and writes nothing even with `--apply`. `--check` is also read-only. Preview returns only the proposed Plain Steps block and metadata, never the surrounding project instructions. A request to set up the chosen project covers the bounded local preparation and edit; do not add another approval ceremony solely for the next phase. A question about setup alone permits preview, not a write.

For an authorised new project instruction file:

```sh
python3 /actual/plugin/scripts/setup_project.py /chosen/project --active-file AGENTS.md --apply
```

The helper creates only a host-confirmed absent standard `AGENTS.md` when no higher-priority source is present, using exclusive non-following creation and immediate exact readback. It creates no directories. An exact existing managed block is a no-op. Existing, altered, duplicated, oversized or unsafe instructions are never overwritten. A race, partial write or failed readback is reported truthfully; keep any newly created file for inspection rather than deleting uncertain work.

For `merge_required`, inspect the reported active existing instruction file with supported host tools under the user's project-scoped authority. Preserve all existing rules and recoverable content. Use the host editor to add only the proposed managed section when it does not conflict. Do not make the person copy a form or retype their goal. If a material conflict cannot be resolved from current instructions, prepare the exact change and ask one focused question. Verify the final section and unchanged surrounding content; helper `--check` (with the confirmed fallback basename where applicable) can confirm the exact block and known local precedence, not host configuration, rule compatibility or model behaviour.

## Verify usefulness, not just a file

Report project scope and whether setup was created, already present, needs merging or remains unverified. Then use an ordinary request in that project to observe actual skill selection, preserved requirements and the useful result. No browser or permission workaround is implied. A verified instruction file is configuration, not proof of an understandable app or every-prompt coverage.

For a requested rollback, use normal recoverable host editing. Remove only the unchanged managed section, retaining other instructions. Remove an entire newly created file only if its provenance and current exact content establish that it contains solely this setup. Modified or mixed files require inspection; this helper supplies no deletion or global uninstall command.
