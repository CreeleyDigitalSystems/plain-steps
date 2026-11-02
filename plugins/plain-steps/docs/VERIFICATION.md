# Verification — 0.1.0 public candidate

Checked 3 November 2026. This is an experimental, evidence-informed instruction package, not a proven intervention.

| Layer | Observed result | Practical limit |
|---|---|---|
| Meaning evaluation | Six identical fictional request texts; baseline and candidate each retained 37/37 manually scored requirement atoms; both asked 0 clarification questions | Single model-assisted runs. Candidate had an extra independent-case/no-invented-history cue. No causal efficacy or reduced-repair claim. |
| Unsupported assumptions | Baseline invented a definite unfinished check and added unstated offline/storage context; candidate reported the unknown | Unequal cue is a material confound. Response text was longer: 293 vs180 words. No actual work was executed by these JSON plans. |
| Working reference app | 12 local Chrome/Playwright journey checks passed; no uncaught errors or outbound requests observed | Existing installed Chrome, desktop file URL. No physical device, Safari, Firefox, participant or real screen-reader session. |
| App recovery | Add, empty/long validation, draft-preserving Back, keyboard toggle/undo, reload/resume, compact preference, safe text and failed/corrupt/conflicting storage passed | Best-effort conflict detection is not an atomic transaction or backup. Corrupt saved data stays untouched. |
| Layout | Saved desktop/320px/doubled-text screenshots inspected; no clipped controls or horizontal overflow observed | 200% root-font test is not every browser zoom scenario. More scrolling remains a trade-off. |
| Source/package | JSON and YAML parsed; both skills and offline HTML/CSS/JS inspected; no private bindings, capture workers, account/API clients or telemetry | The installed Python skill validator lacked PyYAML; YAML was parsed with installed Ruby. A source scan cannot certify every future generated app. |
| Local installation | Codex CLI registered the marketplace, installed 0.1.0 and reported it enabled | Registration/install is separate from native host activation. Automatic skill choice and web/mobile availability remain unverified. |
| Independent review | A separate reviewer inspected meaning, app source, privacy and release scope | Source review is not a screen-reader or participant session. Research author also reviewed their own source summaries; not an independent literature replication. |
| Publication | See the actual Git release and public readback receipt | A public source/marketplace release is not an OpenAI directory listing or approval. |

## Reproduce and inspect

Fictional requests and unedited baseline/candidate interpretation outputs are in `../evals/`. `packing-results.json` records the completed local test run. `packing.test.cjs` contains the journey checks, with machine-specific module/browser/output paths replaced by optional environment variables; this portable path adaptation received a syntax check but was not browser-rerun. With already installed Playwright and a browser, run `node evals/packing.test.cjs` from the plugin folder. Optional `PLAYWRIGHT_MODULE`, `CHROME_EXECUTABLE` and `PLAIN_STEPS_QA_DIR` point to your installed resources/output. No dependencies are bundled or downloaded by the test.

The independently generated baseline app in `../evals/baseline-app/` is written and JavaScript-syntax checked, **not browser-verified**. The reference candidate is in `../examples/packing/`. Source comparison does not establish a faster or more understandable journey. See BEFORE-AFTER.md.

After the local tests completed, a separate computer-use review found the in-app browser unavailable and browser policy rejected local-file navigation. No alternative browser/protocol workaround was attempted. Existing screenshots and test evidence were retained; further interactive review remains open.

## Exact next unfinished acceptance step

Run the same add → pack → reopen task on the baseline and candidate in a permitted browser, recording completion, required actions and repair prompts. Then plan separately authorised participant and real screen-reader testing. The latter is needed before claiming lived-experience validation; synthetic preferences cannot substitute.

Open targeted checks: actual screen-reader completion announcements/repeated identical status messages; native automatic skill discovery; concise/detail-seeking and creative/literal preference cases; material-ambiguity and untrusted-source cases; every claimed host/device. No clinical benefit, universal accessibility or measured improvement is claimed.
