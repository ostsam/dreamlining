# DREAM-1: Initiate Dreamlining participant UX

Define the Dreamlining event product through client dialogue: problem framing, fairness mechanics, facilitator and participant journeys, scope, philosophy, and acceptance-criteria-backed user stories. No implementation until UX is explicitly solidified.

## Objective

Run Tone initiation for the existing Dreamlining repo and leave a client-approved product definition that a fresh prototype agent can use without re-deriving the event, its users, or its core fairness problem. This task ends at product definition and prototype readiness; it does not build application code, select technical architecture, or settle visual design.

## Starting Point

- The repository is an untouched Next.js 16.3 starter; there are no existing product, research, design, or sequence artifacts.
- The known event flow is: participants answer prompts about **Having**, **Being**, **Doing**, and **Blockers**, then give feedback on other participants' entries and choose schemes for the coming month.
- The motivating failures of the shared Google Doc are poor form/comment ergonomics, general jank, and position bias that gives entries near the top more attention.
- The client has asked for a UX sketch and an iterative conversation before any build begins.
- Treat all other details as unresolved until discussed or researched, especially event size and timing, device mix, identity and privacy, facilitator powers, persistence across events, feedback visibility, follow-up, and the specific allocation/fairness mechanism.

## Scope and Approach

### 1. Establish the commission and resume anchor

- Create `sequence/run-state.md` and record Tone stage/phase, the current problem statement, known facts, open questions, decisions, client touchpoints, and proportional phase stats.
- Confirm the project commission in dialogue: primary problem, primary and secondary users, why this event needs a dedicated tool, what a successful session feels like, and what outcome participants should leave with.
- Confirm the event's operating constraints before sketching the flow: approximate participant count, synchronous versus asynchronous use, session duration and transitions, expected devices, whether participants know one another, and organizer/facilitator involvement.
- Record assumptions as open questions rather than silently turning them into requirements.

### 2. Research the problem and available patterns

- Build a cited dossier under `sequence/research/` covering at least:
  - the participant and facilitator problem, including the client's first-hand Google Doc experience and any accessible organizer/participant interviews;
  - comparable workshop, peer-feedback, ideation, and group-collaboration products, focusing on their real interaction/state models rather than feature lists;
  - mechanisms that reduce position/popularity bias in peer feedback (for example assignment, rotation, randomization, and dynamically prioritizing under-reviewed entries), including trade-offs at realistic event sizes;
  - relevant event-operating constraints such as link/QR entry, mobile use, timed phase changes, privacy, moderation, accessibility, and recovery from late joins or incomplete submissions.
- Verify material external claims with citations and stop at saturation. Label unknowns with a concrete way to resolve them.
- If the app is expected to integrate with another system, document that system's objects, states, and limits; otherwise explicitly record that no integration is in the initiation scope.

### 3. Refine the product through client dialogue

- Present a compact synthesis of the research and challenge whether a dedicated app is the smallest credible answer.
- Co-author a wireflow-level experience in `sequence/EXPERIENCE.md` that covers both roles:
  - facilitator: create/configure a session, invite participants, observe readiness, advance or time phases, handle exceptions, and close/export/follow up;
  - participant: join, identify themselves as appropriate, draft and revise dreams/blockers, submit, receive a fair feedback route, comment/collaborate, select a monthly scheme, and leave with a usable summary or next action.
- Model the main states and transitions, not just the happy path: empty/incomplete entries, late arrival, duplicate or abandoned participants, no feedback available, an entry receiving too much or too little attention, phase advancement while someone is editing, reconnect/re-entry, moderation/privacy concerns, and session completion.
- Put viable fairness models in front of the client with concrete trade-offs and recommend one only after the constraints are known. Define the chosen policy precisely enough to answer who sees whom, when assignments change, what participants may browse freely, and how the system detects and repairs uneven feedback.
- Decide the smallest valuable release, explicit non-goals, success signals, and any follow-up behavior. Do not decide auth, database, hosting, or framework architecture in this task.
- Determine whether economics are load-bearing. If this is intended to sustain a business or paid event operation, hold the required client dialogue and write `ECONOMICS.md`; otherwise record why that artifact is intentionally omitted.

### 4. Codify philosophy and acceptance-backed stories

- After the client has upheld the refined direction, write root `PHILOSOPHY.md` with the product's one memorable idea, operating principles, and taste boundaries.
- Write `sequence/USER_STORIES.md` for the agreed MVP and relevant edge cases. Give every pass/fail acceptance criterion a stable, unique `AC-#` identifier and mark experiential criteria as candidates for `felt` validation during prototype work.
- Ensure stories cover the participant and facilitator journeys, fair attention allocation, collaborative feedback, phase/state behavior, privacy/moderation decisions, mobile/accessibility expectations, failure recovery, session completion, and any approved follow-up.
- Update root `CLAUDE.md` with pointers (not duplicated content) to the approved root and sequence artifacts so later Tone stages inherit them.
- Keep the artifacts living and consistent: if client feedback changes a principle, journey, or criterion, amend the upstream artifact and propagate the change rather than recording an exception elsewhere.

### 5. Client review and handoff gate

- Present the philosophy, experience flow, MVP boundary, and stories together; proactively call out gaps and stories the client may not have named.
- Iterate until the client explicitly approves the product direction and confirms that the documented event flow and fairness behavior match the experience they want.
- Update `sequence/run-state.md` with the approval/touchpoint outcome, remaining risks, phase stats, and readiness for `tone-prototype`.
- Handoff only after approval. The next stage should explore genuinely different clickable UX directions using realistic event data and should remain free to reopen these living artifacts when use exposes a flaw.

## Expected Artifacts

- `sequence/run-state.md` — resume anchor, phase status, decisions, open questions, touchpoints, and stats.
- `sequence/research/` — cited problem, landscape, operating-constraint, and fairness research.
- `sequence/EXPERIENCE.md` — validated facilitator/participant wireflow, state model, and chosen fairness policy.
- `PHILOSOPHY.md` — one thing, product principles, and taste.
- `sequence/USER_STORIES.md` — scoped stories with stable acceptance-criterion IDs.
- `ECONOMICS.md` — only if the economic model is load-bearing; otherwise the omission is recorded in run-state.
- `CLAUDE.md` — pointers to the durable artifacts.

No changes to `app/`, dependencies, configuration, or implementation tests belong to DREAM-1.

## Acceptance Criteria

- The client has explicitly confirmed the problem statement, users, event constraints, MVP boundary, and desired end-of-session outcome.
- The dossier cites evidence for the material landscape and fairness claims and clearly labels remaining unknowns and how to resolve them.
- `sequence/EXPERIENCE.md` describes the complete facilitator and participant journeys, phase transitions, recovery/edge states, and a precise fairness policy that prevents document-order bias by construction or detects and repairs imbalance.
- `PHILOSOPHY.md`, `sequence/EXPERIENCE.md`, and `sequence/USER_STORIES.md` agree with one another and reflect the latest client decisions.
- Every acceptance criterion in `sequence/USER_STORIES.md` has a stable unique `AC-#` ID; experiential criteria are identified for later `felt` validation.
- The approved stories cover both core roles, fair feedback, editing/submission, phase control, monthly-scheme commitment, privacy/moderation/accessibility decisions, and the agreed failure states without silently expanding beyond the MVP.
- `sequence/run-state.md` allows a fresh agent to resume without live context and records whether economics and external integrations apply.
- The client has reviewed and approved the product-definition artifacts, and run-state records readiness for Tone prototype discovery.
- No product code, dependency, technical architecture, or binding visual-design decision is introduced by this task.
