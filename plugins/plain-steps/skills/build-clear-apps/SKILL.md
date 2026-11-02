---
name: build-clear-apps
description: Build or repair an understandable app flow when the user asks for clearer screens, fewer confusing decisions or cognitive accessibility. Preserve functionality and individual preferences.
---
# Build clear apps

Produce working software people can understand and use. Inspect existing implementation/wiring and preserve recoverable changes before replacing it. Follow device, framework, privacy and budget constraints. Do not add a backend, account or paid AI service to a local task.

Recover the actual job, essential functions, exclusions and completion condition. Preserve corrections/preferences. For rough requests also use [Keep the meaning](../keep-the-meaning/SKILL.md). Never infer needs from diagnosis or require disclosure.

For a simple start try two large concrete primary actions and one obvious next step. This is adaptable, not universal or a two-control limit. Dense lists may be preferable when requested. Essential actions, state, back and help stay findable. Optional detail must not hide decision-critical information. Avoid speculative dashboards. Labels name work: “Add an item”, not “Manage”.

Use progressive disclosure with a visible named detail route. Offer useful density/detail/motion adjustments without a profile quiz. Retain precision. Do not replace necessary text with icons or force step-by-step pacing on users needing an overview. State where preferences persist.

Use semantic/native controls, meaningful labels/headings, predictable order and keyboard access. Show focus and deliberately move it after view changes. Announce useful status/errors without repeated interruption. Use generous targets (44px is this starter's design target, not WCAG 2.2 AA's minimum). Test 320 CSS px reflow, zoom, contrast, reduced motion and no colour-only meaning. Avoid timed dismissal, flashing, autoplay and drag-only operation.

Make errors specific/recoverable: identify input, retain data, show correction and restore focus. Distinguish draft/saving/saved/failed honestly. Support predictable back, undo and resume. Back must not erase input. Explain storage limits; avoid sensitive persistence without informed choice. Render loaded data safely and handle corrupt/old storage without destroying it.

Implement a real completion path with appropriate empty/loading/error/success/resumed states. Do not present decorative controls, mock activity or disconnected integrations as working. Keep diagnostic IDs/receipts outside everyday screens.

For a small offline list inspect/adapt the [packing example](../../examples/packing/index.html). It supplies no AI backend, encrypted store or cross-device sync. Reuse principles rather than renaming it blindly for unrelated domains.

Verify the actual task including keyboard, errors, back/undo and reopening. Compare baseline/candidate on identical fictional tasks. Count decisions/visible controls honestly; fewer alone does not prove usability. Test different stated preferences, including dense precise overview. Include stop, local-only, correction and hypothetical negative cases.

Combine automated and visual/interaction checks. A pass is not full WCAG conformance, lived-experience validation, clinical benefit or guaranteed model adherence. State tested environments and unfinished human/device checks. See [research](../../docs/RESEARCH.md) and [evaluation](../../docs/EVALUATION.md).
