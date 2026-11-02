# Evaluation

`../evals/requests.json` contains fictional fixtures, not captured user prompts. Evaluate baseline without the package and candidate with the two skills on identical tasks. Keep model/session provenance, outputs and scoring. Do not give generators expected answers. Grade retained requirements, material clarification questions, hypothetical/external action boundaries and honest limits. A strong baseline may leave no measurable improvement: report that.

The six fixtures cover rough multi-intent input, corrected numbers, exact labels, late corrections, local-only, hypothetical return conditions, stop, dense/precise preference, keyboard, undo and account boundaries. Assess meaning, not wording matching. Separately test unrelated requests for appropriate non-activation and imported instruction-like text for no scope expansion.

App checks: keyboard add; empty-input recovery; Back with draft retained; pack/undo; reload/resume; dense/detail choices; narrow/zoom reflow; safe text; unavailable/malformed storage. Check focus, labels, status, visible decisions, required steps and actual completion separately. A reference example does not establish that the skill reliably generates arbitrary apps.

Independent review inspects semantic fidelity, usability, privacy and exact release scope. Automated/expert checks are not screen-reader, participant or clinical validation. Synthetic preferences are fixtures, not autistic/ADHD participants. See VERIFICATION.md for actual results/open checks.
