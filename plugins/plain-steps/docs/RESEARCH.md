# Plain Steps: evidence and design decisions

Research checked 3 November 2026. This is a bounded audit of standards, primary research, official product descriptions, public repositories and complaint themes. It is not a systematic review, market census, prevalence estimate or proof that these instructions improve outcomes.

## What the evidence supports

Plain Steps treats preserving meaning and building an understandable app as equal jobs. Its two skills, `keep-the-meaning` and `build-clear-apps`, pair conversation guidance with reusable interface patterns and an offline packing example. There are no hooks, server, prompt capture or background worker in this package.

The evidence supports clear language, predictable navigation, memory support, recoverable errors and individual control over presentation. It also warns that rewriting can suppress a person's voice, and that disability disclosure can trigger stereotypes. Use stated preferences and task needs; do not require diagnosis disclosure. [W3C cognitive accessibility guidance](https://www.w3.org/TR/coga-usable/), [autistic-user AI study](https://arxiv.org/html/2601.17946v2), [disclosure-bias study](https://arxiv.org/html/2601.12690v1).

Two concrete primary actions and one obvious next step are a starting design hypothesis. They are not a rule for all autistic or ADHD people. Less content can aid focus, but hiding an essential action creates a different barrier. Short text must retain precision; larger type can increase scrolling. Offer useful detail without a long intake form. [AASPIRE participatory website study](https://pmc.ncbi.nlm.nih.gov/articles/PMC6485264/).

These are instructions for a host AI and patterns for software it builds. They cannot rewrite the host's interface, guarantee instruction compliance, intercept every message, provide cross-chat memory or establish clinical benefit. WCAG checks and a working example do not prove that every generated app is accessible. [WCAG 2.2](https://www.w3.org/TR/WCAG22/).

## Primary sources and their limits

Labels distinguish authority and method, rather than ranking all evidence on one scale. **Standard** means testable normative requirements; **guidance** means design recommendations; **situated study** means firsthand empirical evidence within its sample; **exploratory** means themes or proposed opportunities; **model audit** means controlled model behaviour within the tested conditions. None evaluates Plain Steps.

| ID | Source | Method and strength | Practical contribution and limit |
|---|---|---|---|
| R1 | [W3C: Making Content Usable for People with Cognitive and Learning Disabilities](https://www.w3.org/TR/coga-usable/), 2021 | Working Group Note; guidance | Clear steps, short critical paths, personalisation and recovery. Supplements WCAG; not a conformance standard or evidence for a fixed button count. |
| R2 | [W3C: WCAG 2.2](https://www.w3.org/TR/WCAG22/), 2024 revision | W3C Recommendation; standard | Keyboard, focus, labels, contrast, reflow, status and error criteria. Does not cover every cognitive need; automated checks alone cannot establish conformance. |
| R3 | [Ma et al.: “I Use ChatGPT to Humanize My Words”](https://arxiv.org/html/2601.17946v2), IH ’26 | Preliminary poster; thematic analysis of 3,984 public posts; exploratory | Scaffolding and communication support coexist with authenticity and agreement risks. Self-identified accounts, LLM-assisted filtering and possible AI-edited posts limit inference; no clinical verification or prevalence. |
| R4 | [Raymaker et al.: AASPIRE Web Accessibility Guidelines](https://pmc.ncbi.nlm.nih.gov/articles/PMC6485264/), 2019 | Community-based website development; 8 task testers, including 3 autistic people; 170 autistic beta evaluators; situated study | Precise labels, simple navigation and configurable presentation. Conflicting font/contrast needs matter. A particular health website's positive evaluation does not isolate each guideline or validate this plugin. |
| R5 | [Pinto et al.: “A little bit of a life raft”](https://research-information.bris.ac.uk/en/publications/a-little-bit-of-a-life-raft-exploring-the-use-and-experiences-of-/), OZCHI ’25 | Seven-day diary and interviews with 13 regular ChatGPT users with ADHD; situated study | Communication and task support are existing user practices. Small regular-user sample; not an intervention trial. Method/abstract verified through the authors' university record; direct publisher fetch was restricted. |
| R6 | [Zhu et al.: Scaffolding Metacognition with GenAI](https://arxiv.org/html/2602.09381v1), CHI ’26 | Co-design with 20 diagnosed university students and interviews with 5 experts; exploratory | Collaborative decomposition, progress and adjustment; cautions about reliance and bias. Mandarin-speaking student sample and design ideas do not establish deployed effectiveness. |
| R7 | [Wohn et al.: Understanding Stereotypes in AI Advice for Autistic Users](https://arxiv.org/html/2601.12690v1), CHI ’26 | 345,000 responses across 6 models, plus 11 autistic interviewees; model audit and situated study | Disclosure shifted advice toward avoidance; reactions differed. Synthetic binary decisions and specific model versions limit real-chat inference; tone observations were less experimentally established. |
| R8 | [Glazko et al.: Neurodivergent GAI “Power Users”](https://pmc.ncbi.nlm.nih.gov/articles/PMC12645485/), CHI ’25 | 8 US-based CS-educated authors; one-month diaries/interviews; autoethnography | Agency, privacy and authenticity can coexist with deliberate adaptation. Narrow successful early-adopter sample; AI cannot resolve systemic access barriers. |
| R9 | [Choi et al.: Unlock Life with a Chat(GPT)](https://dasomchoi.com/papers/ChatGPT.pdf), CHI ’24 | Focus groups and workshops with 14 autistic people; exploratory | Users valued a nonjudgmental resource but raised response-interpretation and disclosure concerns. Short workshops do not establish sustained everyday benefit. |
| R10 | [Çarık et al.: Exploring LLMs Through a Neurodivergent Lens](https://vtechworks.lib.vt.edu/items/1764b082-51b8-4ca2-b98f-ed6385d621a6), 2025; [author preprint](https://arxiv.org/html/2410.06336v1) | Qualitative discussions from 61 Reddit communities; exploratory | Communication, learning and productivity workarounds identify needs and repair burden. Community discourse is not representative, diagnostic verification or a test of remedies. |

## Existing routes and the remaining gap

Capabilities below were checked against official pages or repository descriptions, not through installation or paid trials. Prices and host availability can change. No third-party implementation or source text was copied.

| Route | Verified described capability and cost boundary | Why Plain Steps still has a useful testable job |
|---|---|---|
| [ChatGPT custom instructions](https://help.openai.com/en/articles/8096356-chatgpt-custom-instructions) | Preferences on all plans across web/desktop/mobile; normal host limits apply. UI preferences are separate from API system messages. | A simple alternative for preferences. It does not itself provide generated-app patterns and acceptance tests. |
| [Skills](https://learn.chatgpt.com/docs/build-skills) | Reusable instructions/resources, selectively loaded by supporting hosts. An instruction-only package needs no server; host entitlement and allowance remain separate. | Portable, inspectable v1 route. Selection is not guaranteed every-message interception or permanent memory. |
| [Goblin Tools](https://goblin.tools/About) | Single-purpose decomposition, tone and planning tools. Free web core; paid mobile apps and advanced Pro features. Exact AUD checkout price not established. | Strong existing task-help route. Inspected descriptions do not establish requirement/correction retention or accessible generated-app acceptance. |
| [Tiimo](https://www.tiimoapp.com/faq) | Calendar, to-dos, focus, reminders and AI planning. Selected mobile tools free; web requires trial/subscription; prices vary. | Existing planning product; this package should not duplicate its calendar. Software-brief fidelity is a different job. |
| [Neurolist](https://apps.apple.com/au/app/neurolist-ai-planner-for-adhd/id6468689182) | Task splitting, estimates, one-task view and timers. Free download with in-app purchases; multiple AU offers do not establish a single new-user price. | Useful single-task comparator. One-task display is not universally preferred; generated-app testing was not established. |
| [i-have-neurodivergence](https://github.com/Trickaay/i-have-neurodivergence) | Condition-free support selection and instruction exports; repository displays MIT. Explicitly says prompt-rule effectiveness is unvalidated. | Significant presentation overlap. Plain Steps must demonstrate meaning retention and a usable built flow, not just another profile picker. |
| [Hyperfocus](https://github.com/nextor2k/hyperfocus), [adhd-answers](https://github.com/tropicgirlie/adhd-answers) | Formatting/response guidance; claimed MIT licensing. Hyperfocus persistence uses hooks; a separate adhd-answers licence file was not verified. Neither was run here. | Formatting is useful but does not prove app usability. Fixed closing lines and hooks are unnecessary for this v1. |

No source-reuse licence was established for the proprietary planning products. Listing them is comparison, not permission to reuse them. Repository licence claims should be rechecked before any future code/text reuse.

## Complaint themes and contrary cases

A bounded public anecdote search identified themes of acknowledged-but-unapplied corrections, lost exclusions, excessive optional questions, organisation displacing completion, patronising interpretation, and AI-built interfaces needing accessibility repair. These are discovery leads, not reproduced experiments or prevalence. Individual posts, usernames, quotations, screenshots, raw prompts and personal accounts are intentionally absent from this public report.

Contrary accounts matter: too few questions can cause bad assumptions; repetition or reassurance can be requested support. Plain Steps therefore avoids universal “never ask”, “always simplify” or “never rewrite” rules. Ask when missing meaning materially changes the action; otherwise proceed with recoverable work. Preserve the person's choice of voice and detail.

## Source → problem → remedy → acceptance

The machine-readable [source-to-test matrix](source-to-test.csv) contains 22 proposed checks. Remedies and test designs are engineering inferences from the brief and evidence, not interventions tested by the cited studies. Matrix status describes research/design readiness, not a passing test result. Actual results belong in release evidence.

| Sources | Problem | Plain Steps remedy | Acceptance example |
|---|---|---|---|
| R3, R8, R10 | Rough requests lose meaning | Retain numbers, negation, exclusions, uncertainty and voice | Fictional dictated task retains every requirement without an invented commitment. |
| R6, R8 | A correction or hypothetical is misused | Latest correction governs dependent work; ideas do not trigger action | Late correction updates the result; hypothetical remains inactive; stop ends action. |
| R7, R9 | Personalisation becomes stereotyping | Concrete preferences; no diagnosis requirement | Diagnosis-label variation alone does not change goals, authority or opportunity. |
| R1, R4 | Dense screens obscure useful work | Small primary surface and findable detail | A user completes a packing task, can find optional information and can return. |
| R1, R2 | Errors or back navigation destroy work | Visible save state and recoverable navigation | Correct invalid input, go back, undo and resume without losing valid input. |
| R2 | Visual operation passes while access fails | Native semantics and tested keyboard/focus/reflow | Complete the entire flow by keyboard and inspect accessible labels/status. |

Requirement-retention rate, clarification/correction count, visible decisions and task completion should be measured together. A shorter response is not automatically better. Use the same fictional tasks and host/model conditions for baseline and candidate; disclose evaluator judgment and sampling limits. Fixture success must not be reported as participant validation.

## Prioritised backlog and unresolved validation

1. **Before a tested-local claim:** verify the actual package and example, requirement fixtures, correction/stop/local-only behaviour, keyboard/focus, labels, errors, back/undo and resumption. Record the exact version and failures. Static presence of a rule is not behavioural proof.
2. **Before an improvement claim:** run baseline/candidate on identical fictional tasks using an available host without new API charges. Include concise, detail-seeking and literal/creative preference profiles and negative cases. Independent evaluation should check semantic fidelity and whether the app task completes.
3. **Before a user-validated claim:** involve consenting people with varied access preferences in real tasks. Let participants choose communication, pace and disclosure; do not substitute synthetic personas. Recruitment, data handling and any payment require their own authorised plan.
4. **Before cross-device/assistive-technology claims:** test the exact install/selection path and example on each claimed desktop, web and mobile host, plus actual screen-reader use and narrow/zoomed layouts. A browser viewport test is not a physical-device or screen-reader test.
5. **Later, only if useful:** expand examples and language coverage based on observed failed tasks. Revisit comparator capabilities, cost and licence facts before recommending or reusing them. Do not add capture, surveillance or persistent memory by implication.

Plain Steps remains an evidence-informed candidate until its own results exist. These studies do not establish clinical efficacy, universal comprehension, every-host support or automatic WCAG certification.
