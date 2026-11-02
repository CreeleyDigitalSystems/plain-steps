# Optional project setup — final narrow independent review

Frozen helper SHA-256: `2ae28063809463016685fe3ec1edd329e2c453a6639f01d3293802ac07440597`.

## Verdict

No unresolved material defect found within the bounded review. The two review findings are closed.

The stale named-project result was resolved by shared named-project and named-file guards. The original targeted replacement probe independently returned `project_changed`; it did not report configuration for the replacement directory, and the original instructions stayed intact. The post-write guard and regression were also inspected.

Empty or whitespace-only instruction candidates now return `ambiguous_source`, `target=null`, `changed=false`, `would_create=false`. The setup skill requires inspection of the active instruction chain before editing, without assuming empty-source host semantics. This closes the prior empty-override concern by refusing an assumed merge target. CLI apply exits 3 for this state.

## Evidence

Author suite: **26/26 passed**, reported by the parent author; the independent reviewer did not rerun the full suite.

Independent checks on this frozen helper: **20/20 passed** — 18 empty/whitespace candidate and mode combinations (standard, override and explicit custom candidate, each in preview/check/apply), one normal nonempty idempotence check, and one CLI ambiguous-apply exit check. The checks confirmed unchanged bytes, file identities and modification times for the six candidate fixtures; no normal file appeared beside an ambiguous override/custom source.

Earlier independent probes also confirmed ordinary nonempty override precedence without changing either source. The final delta was limited to the shared empty-candidate guard, CLI exit handling and the corresponding skill paragraph; the original replacement probe was not repeated after that unrelated delta.

## Limits

Only the authorised helper, setup skill and synthetic test/results files were reviewed. All additional probes used bounded temporary synthetic fixtures removed normally. No actual private project, global configuration, credential, network, browser, model invocation, installation or publication was involved. No source edits were made.

This review covers bounded local configuration behavior. It does not prove host activation, native skill selection or useful task completion; those remain separate acceptance checks.
