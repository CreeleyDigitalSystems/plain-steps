# Plain Steps architecture

## The result

The user describes a goal naturally. The assistant preserves its meaning, then helps produce an app whose actions the user can understand and complete. Conversation fidelity and the resulting interface are equal parts of the product.

Version 0.1.0 uses portable skills and supporting source rather than a backend. There is no bundled MCP server, app binding, model API client, hook, scheduler or publisher storage. The AI host supplies the model and any authorised development tools. Model access and its costs are separate from the package.

## Two focused workflows

`skills/keep-the-meaning/SKILL.md` handles rough language: retain material constraints and uncertainty, apply later corrections, separate hypothetical ideas from instructions, respect stops, and ask only when missing meaning changes the next action. It should produce useful work, not require the user to approve a rewritten prompt.

`skills/build-clear-apps/SKILL.md` handles the app journey: start from the goal, reuse an existing working implementation where appropriate, choose a small surface suited to the task, and test completion. This includes concrete labels, optional detail, accessible interaction, honest saving and recoverable errors. The user can request a denser overview or another interaction pattern.

They may be used together or separately. The host controls discovery and activation. A skill is reusable instruction, not a deterministic parser or a permission-enforcement layer.

## Data and authority

```text
User request + current corrections
                  |
                  v
        Host model + selected skills
                  |
       interpreted task and constraints
                  |
                  v
   Authorised tools / app source / task checks
                  |
                  v
   Working result + precise verification limits
```

Messages stay subject to the host's data practices. There is no new publisher endpoint. Tool use follows the user's actual task and host permissions. An idea does not create authority for a build or external action. No cross-host memory or background capture is introduced.

## Representative example

The fictional packing app represents a three-night trip. Its everyday actions are **Add an item** and **Continue packing**. Detail and display density are optional. Undo supports recovery; visible status explains storage. It uses local browser storage for resumption when available. It has no account, cloud sync, reminder service, deletion flow, export or network dependency.

The example is a reusable interaction pattern, not the plugin's AI engine. It demonstrates how reducing visible controls can coexist with useful recovery and optional detail. It must be tested with actual controls and storage behaviour before claiming it works.

## Acceptance evidence

Meaning tests compare baseline and candidate on the same fictional requests: number retention, exclusions, late corrections, parked hypotheticals, stop/local-only boundaries and negative cases. Evaluate retained requirements, clarification/correction counts and unsupported assumptions rather than tone alone.

App checks exercise a complete task: add a valid item, recover from invalid input, mark it packed, undo, return and resume. Check keyboard order, visible focus, labels, status/error announcement, back navigation, zoom/reflow, reduced motion and alternative density/detail preferences. Record visible choices and completed work separately from source inspection.

Archive validation checks the final package's manifests, YAML, contained paths, licence, references, icons and private-data absence. Host installation must then establish discovery, activation and a useful workflow. Public distribution needs independent unauthenticated readback of the actual release. Participant usability is a separate unresolved check; synthetic fixtures do not substitute for it.

The research file and source-to-test matrix explain rule provenance and strength. A local pass supports only its named behaviour in the tested environment.
