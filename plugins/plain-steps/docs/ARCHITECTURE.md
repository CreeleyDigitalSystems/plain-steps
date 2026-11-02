# How Plain Steps works

The person describes a goal normally. The host model selects relevant guidance, preserves the active meaning, implements the real task and checks the result. Conversation fidelity and understandable working software are equal jobs.

## Two workflows

`keep-the-meaning` handles rough or branching requests, corrections, drafts, rewrites and incoming messages. Optional references provide a meaning inventory, correction dependency checks, a one-material-question decision and a faithful rewrite comparison. Interpretation remains a host-model task; this is not a deterministic language parser.

`build-clear-apps` handles ordinary user-facing app creation and repair. It asks the agent to inspect existing work, carry constraints into a quiet task contract, implement the requested operation and include recovery in the first usable flow. The user does not complete another brief or activate an accessibility mode before each build.

The host controls discovery and selection. A visible catalogue entry, an observed skill read, written app files and useful task completion are different observations. No always-on or every-host guarantee follows from installation.

## Optional project defaults

`setup-plain-steps` applies only to requested setup in a chosen project. Its standard-library helper previews a generic block, checks known override precedence and can exclusively create a new standard instruction file only with a host-confirmed active source. Existing instructions need a preserving host edit; ambiguity, unsafe paths and changed files fail closed. It changes no global rules, hooks, accounts or credentials. An ordinary configured correction read both core skills in the native test; this is one observed run, not guaranteed selection.

## Reusable local implementation

| Resource | Useful capability | Boundary |
|---|---|---|
| [Native flow kit](../skills/build-clear-apps/assets/flow-kit.js) | Explicit numeric validation/calculation, guarded local state, focus/status/error helpers | No natural-language understanding, remote service or permission firewall |
| [Flow styles](../skills/build-clear-apps/assets/flow.css) | Native controls, visible focus, density and reflow primitives | CSS source is not proof of rendered access or comprehension |
| [Calculation scaffolder](../skills/build-clear-apps/scripts/scaffold.cjs) | New local app files from an agent-authored, validated numeric contract | Single result and bounded arithmetic; no executable formulas, multiple outputs, whole-unit rounding or non-calculation workflow |
| [Source inspector](../scripts/audit_ui.py) | One regular HTML file's source-visible surface, labels and references | Follows no assets and runs no code; dynamic DOM, visual layout and real interaction remain unknown |

The calculation flow keeps drafts through Back and validation failure, retains result-input context, supports named calculation undo and local resumption, and offers useful density/detail choices. The agent authors its [contract](../skills/build-clear-apps/references/calculation-contract.md); the user is not sent to a configuration form. Other jobs use suitable code and real integrations rather than being forced into this template.

Two large start actions are an adaptable pattern. A direct form or dense list may remove unnecessary navigation. Essential controls, conditions, units, errors and save state must remain findable.

## Data flow

```text
User request and corrections
        |
Host model + relevant skill
        |
Active task constraints
        |
Authorised implementation / local resources
        |
Real operation and resulting state
        |
Task checks with exact remaining limits
```

The package supplies no MCP server, account, model API client, hook, scheduler, telemetry, chat archive or publisher endpoint. The host supplies the model and authorised tools under its own cost/privacy rules. Tools and generated apps have their own actual data paths; guidance is not enforcement.

The optional scaffolder reads an explicit local JSON file and writes a new directory. The source inspector reads only one selected regular HTML file and no assets. Generated example state uses unencrypted browser storage on the device/origin, with guarded readback and explicit failure states. It is not a backup or cross-device service.

## Proof of useful work

[Verification](VERIFICATION.md) and the [source-to-test matrix](source-to-test.csv) distinguish source, unit/state checks, model response cases, native host selection, browser journeys, distribution identity and participant feedback. No one layer substitutes for the rest. The recorded native code results cover named tasks; browser completion and participant benefit remain open.
