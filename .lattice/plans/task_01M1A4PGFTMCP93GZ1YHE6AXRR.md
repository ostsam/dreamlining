# DREAM-2: Populate dependency-ordered Dreamlining delivery board

Create a complete, dependency-aware Lattice roadmap from product definition through prototype, architecture, implementation, validation, deployment, and live-event readiness. Downstream build tickets must be gated by approved Tone artifacts and must preserve safe parallelism for future agents.

## Objective

Populate the Dreamlining Lattice board with a delivery graph, not merely a feature list. A fresh orchestrator must see what can start, what must wait for a human, which lanes can safely run in parallel, and what evidence closes each milestone. Reuse the existing initiation ticket (`DREAM-1`) and create the remaining tickets with durable descriptions, conservative dependencies, explicit Tone/build gates, and human-use checkpoints.

This task changes only `.lattice/` coordination state. It does not perform product initiation, design prototypes, choose architecture, edit application code, configure a remote, deploy, or run an event.

## Starting Point and Repository Safety

- `DREAM-1` owns Tone initiation and is `needs_human` on the keystone fairness decision: enforced balanced assignments before free exploration versus suggestions/free browsing throughout. Do not duplicate or bypass it.
- The app is an untouched Next.js 16.3.3 / React 19.2.8 / Tailwind 4 starter with Bun scripts for `dev`, `build`, `start`, and `lint`; it has no product, prototype, contract, test, persistence, deployment, or operations artifacts.
- At initial inspection, `git rev-parse --show-toplevel` resolved to `/Users/so/Documents/projects` and that parent repository's `origin` was unrelated `https://github.com/ostsam/vapight-kampff.git`. The user then isolated Dreamlining. Revalidation now resolves the top level to `/Users/so/Documents/projects/dreamlining`; `main` has baseline commit `50ec4c2` (`init`) and a clean upstream relationship to `origin/main`.
- `origin` is now the Dreamlining-specific `https://github.com/ostsam/dreamlining.git` for both fetch and push. The unsafe parent-repository coupling is resolved; no agent may attach or push to the parent `vapight-kampff` remote.
- T04 audits and records the established baseline, ignore policy, branch/upstream expectations, and worktree/Lattice protocol before parallel agent work. T27 verifies and uses the existing Dreamlining remote for distributed PR orchestration and deployment.
- Parallel worktrees must be siblings of the standalone checkout and share its `.lattice/` through an absolute `LATTICE_ROOT`; never run `lattice init` in a worktree.

## Board Construction Rules

1. Create every new ticket in `backlog`, unassigned, with a description containing outcome/why, outputs, completion evidence, human checkpoint if applicable, and contract/AC lineage. Use `critical` only for gates/ship blockers, `high` for core path, `medium` for bounded or hardening work; set realistic complexity.
2. Add `related_to DREAM-2` to every roadmap ticket, including existing DREAM-1. Do not make DREAM-2 a blocking/claimable umbrella.
3. Reuse DREAM-1 as T01 without changing its status or decision comment.
4. Link only true prerequisites; preserve the parallel lanes below.
5. T06 is the mechanical build gate. Every code-, infrastructure-, deployment-, test-, security-, or operations-changing ticket T07–T31 must directly `depends_on T06`, in addition to functional edges. The redundant common edge prevents accidental pre-contract dispatch without reducing post-gate parallelism.
6. Every T07–T31 description begins: `CONTRACT-GATED BUILD TASK: keep in backlog and do not plan or implement until approved T06 is done. Reconcile this provisional scope against SPEC.md, EVALUATION.md, BUILDPLAN.md, DESIGN.md, and the binding prototype before moving to in_planning; carry final AC IDs and the harness hook into the plan.`
7. T02–T06 require living-artifact updates and stable AC lineage. T06 verifies every story AC appears in `EVALUATION.md` and `SPEC.md`; builders cite those IDs rather than replace them.
8. Human-use checkpoints are visible tickets (T03, T09, T28, T29). When ready, move them to `needs_human` with a one-line request and resume only after evidence/approval.
9. Feature tickets own local tests. T07/T08/T10 own shared primitives; T21 owns final shared route/registration/state wiring. Other tickets should use isolated modules so parallel work does not repeatedly collide in aggregators.
10. Do not preselect auth, database, realtime, hosting, analytics, email, or monitoring vendors. T05 decides with the client; downstream tickets consume that contract.

## Ticket Catalog

Aliases are local to this plan. Record returned short/full IDs while minting so links cannot target the wrong task.

### Tone and operational gates

**T01 — `DREAM-1: Initiate Dreamlining participant UX` (existing, high).** Owns commission, cited fairness/landscape research, event constraints, both role journeys, exact fairness policy, philosophy, AC-ID stories, and client approval.

**T02 — `Discover clickable Dreamlining prototype directions` (high, high, task).** Depends on T01. Run Tone prototype discovery from approved initiation artifacts: agree on genuinely different UX assumptions; build realistic clickable HTML takes for participant/facilitator happy and edge states; badge them `PROTOTYPE`; draft rationale. Evidence is multiple usable directions on realistic event data, not static mockups or app code. Flow discoveries amend upstream truth.

**T03 — `Validate and converge the binding Dreamlining prototype` (critical, medium, task).** Depends on T02. The client drives alternatives and iterates the chosen take until they love it. Produce the converged binding prototype, root `DESIGN.md` (voice, visual language, behavior, choice/why), updated upstream artifacts, run-state readiness, and explicit approval. Architecture cannot infer approval from silence.

**T04 — `Verify the standalone Dreamlining repository for agent work` (critical, medium, chore).** May begin independently; T05/T07 depend on it. Verify `/Users/so/Documents/projects/dreamlining` remains the Git top level; review the baseline commit and ignore policy; confirm `main` tracks the Dreamlining-specific `origin/main`; explicitly forbid parent `vapight-kampff`; establish the branch/PR protocol and sibling-worktree use with shared absolute `LATTICE_ROOT`; and prove a worktree sees the same Lattice board. Record the verified facts so future agents do not rediscover or accidentally cross the repository boundary.

**T05 — `Codify the Dreamlining evaluation, specification, and build plan` (critical, high, task).** Depends on T03/T04. Run Tone architect as client dialogue. Read product/design artifacts cold; write `EVALUATION.md`, `SPEC.md`, `BUILDPLAN.md`; classify every AC (`autonomous`, `operator-assisted`, `external-oracle`, `felt`); define hermetic parallel <=60s `test` and `test:full`; name human checkpoints; decide stack/data/auth/realtime/hosting/observability with options/tradeoffs; map every persisted field to writer/reader; enforce privacy/fairness guardrails; reconcile the starter DONE/PARTIAL/MISSING; sequence a real deployable walking skeleton. Run adversarial spec/codebase review and amend upstream contradictions.

**T06 — `Approve the Dreamlining build contract` (critical, low, task; BUILD GATE).** Depends on T05. Independently verify prototype/DESIGN/PHILOSOPHY/stories/EVALUATION/SPEC/BUILDPLAN agreement, AC coverage/evaluation, runnable harnesses, human checkpoints, field writers/readers, guardrail enforcement, existing-code audit, and approved technical decisions. Record adversarial verdict and explicit human approval. Route gaps upstream instead of approving exceptions. Only `done` permits T07–T31 planning.

### Foundation and earliest risk retirement

**T07 — `Establish the application foundation and quality harness` (high, high, task).** Depends on T04/T06. Reconcile the starter; read bundled Next.js 16.3 docs; pin runtime/env/dependency conventions; establish CI, formatting/types/lint, hermetic `test`/`test:full`, factories, env validation, migrations, and documented commands. Evidence: clean install, fast checks, tests, production build in standalone repo.

**T08 — `Implement canonical domain, persistence, and authorization primitives` (high, high, task).** Depends on T07. Implement contracted schema/access boundaries for sessions, participants, dreams/blockers, feedback, assignments/coverage, commitments, phase/audit state; migrations/factories; writer/reader proof; deny-by-default session isolation. Own canonical types.

**T09 — `Build and validate the deployable walking skeleton` (critical, high, task/human checkpoint).** Depends on T07/T08. On a production-like preview, facilitator creates/invites, participant joins on another device, facilitator sees them, one phase change propagates, reconnect works, state survives restart using real selected architecture. Include minimal binding styling, telemetry, smoke automation. Then require client use on target devices/network and a felt verdict before completion; do not expand into feature breadth.

### Core lifecycle and parallel feature lanes

**T10 — `Complete the session and event-phase lifecycle` (high, high, task).** Depends on T09. Implement configuration, lobby/open/closed lifecycle, authoritative transitions, readiness/completion, idempotency, editability during transitions, expiry/archive, deterministic audit history; central exhaustive tests.

**T11 — `Implement participant join, identity, re-entry, and recovery` (high, medium, task).** Depends on T10. Approved low-friction identity, duplicate names, safe tokens, late join, reconnect/re-entry, abandoned participants, expired/closed states, no cross-session leaks.

**T12 — `Instrument privacy-preserving observability and event metrics` (medium, medium, task).** Depends on T10. Structured logs/error/trace, health/readiness, deploy markers, alerts, and privacy-safe join/draft/phase/coverage/commitment/recovery metrics; dashboards/retention/redaction verification. Never log dream/blocker/feedback text or secrets unless explicitly contracted.

T11/T12 run in parallel after T10. After T11, T13/T14/T15 run concurrently against T08/T10 contracts.

**T13 — `Build the participant dreamlining drafting experience` (high, high, task).** Depends on T11. Binding mobile-first Having/Being/Doing/Blockers flow, contracted limits/prompts, add/edit/delete/reorder, autosave states, incomplete/empty/readiness/submission rules, keyboard/focus/screen-reader behavior, reconnect-safe drafts; realistic long/empty browser coverage.

**T14 — `Build the facilitator control room and presentation view` (high, high, task).** Depends on T11. Session config/invite/QR, participant/readiness/coverage state, timer and phase controls, late-join/exceptions, presentation mode, safe close. Show coverage not popularity; confirm/audit destructive commands.

**T15 — `Implement and prove the fair feedback routing engine` (critical, high, task).** Depends on T11. Deterministic concurrency-safe contracted assignment/coverage; prevent/repair document-order bias; minimum distinct reviewers; no self-assignment; skip/rematch, late join/dropout, duplicate requests, exhausted pools, small/odd/large rooms. Seeded simulation/property tests and operational coverage without popularity counts.

**T16 — `Build structured assigned-feedback and collaboration UX` (high, high, task).** Depends on T13/T15. One assignment/person/dream at a time; contracted response types; draft/send/edit, skip/rematch explanation, progress/empty/exhausted states, accessible receipt. Atomically update coverage and enforce blocker/feedback privacy.

**T17 — `Build the open exploration phase` (high, medium, task).** Depends on T14/T15/T16. Browse only under approved coverage/phase rule; contracted discovery/filtering, continued feedback/offers, hidden popularity, fair ordering, unmet-contribution/no-entry/override states without recreating document-order bias.

**T18 — `Build the monthly scheme commitment flow` (high, medium, task).** Depends on T10/T13 and intentionally parallels routing/feedback. Turn one dream into contracted monthly outcome, first action/time, help, collaborators; edit/confirm/completion, reconnect, privacy.

**T19 — `Build participant recap, export, and follow-up` (medium, medium, task).** Depends on T16/T18. Secure personal recap with own dreamline, received feedback/offers, scheme, first action/collaborators under consent; contracted access/expiry/export/share/notification; retries, retention/deletion. No assumed email/accounts.

**T20 — `Implement moderation, consent, and facilitator safety controls` (high, medium, task).** Depends on T14/T16. Reporting/removal/visibility, consent for identity/contact/offers, audited moderation, abuse/rate/length limits, hidden/closed UX, and cross-session/private-content denial.

### Integration and hardening

**T21 — `Integrate the complete facilitated event sequence` (critical, high, task).** Depends on T12/T17/T18/T19/T20. Wire join -> draft -> assigned feedback -> coverage gate -> exploration -> commitment -> close/recap. Own central route/state wiring; seeded full-event fixtures; prove transition conflicts, incomplete/small rooms, late arrivals, overrides, closed re-entry.

**T22 — `Harden reconnect, offline, conflict, and partial-failure recovery` (high, medium, task).** Depends on T21. Network/tab/channel loss, duplicate/stale submissions, save conflicts, retries/restarts, notification/export partial failure, advance while editing; idempotent reconciliation, actionable UI, telemetry, documented unrecoverable cases.

**T23 — `Run accessibility, responsive, copy, and prototype-fidelity audit` (high, high, task).** Depends on T21. All participant/facilitator/recap states versus binding prototype on target widths, keyboard, screen readers, reduced motion, contrast, zoom/text expansion, long content, loading/empty/error, room readability; fix gaps and retain evidence.

**T24 — `Run security, privacy, and abuse-resistance audit` (critical, high, task).** Depends on T20/T21. Threat model codes, capabilities, object/session access, recap links, realtime, CSRF/injection/XSS, enumeration/replay/rate limiting, secrets/logs/retention, moderation abuse, dependencies; approved static/dynamic checks; audit existing code against guardrails; remediate critical/high and record residual risk.

**T25 — `Build cross-role end-to-end and regression suites` (high, high, task).** Depends on T21/T22. Deterministic full multi-user event, concurrency/fairness, commitments/recaps, privacy denial, reconnect/failure tests; preserve <=60s hermetic parallel `test`, slow browser/provider work in `test:full`; flake policy/artifacts.

**T26 — `Run load, concurrency, and realtime soak validation` (critical, high, task).** Depends on T21/T22. Contracted capacity, transition bursts, autosave/submission/assignment races, long connections, reconnect storms, duplicates, fairness invariants, provider limits/degradation; reproducible scripts/results, fixes, capacity/cost envelope.

T22/T23/T24 parallelize after T21; T25/T26 begin once T22 establishes recovery semantics. Architecture/design-changing findings route upstream.

### Release, real use, and closed-loop validation

**T27 — `Prepare production-like release infrastructure and event runbooks` (critical, high, task).** Depends on T12/T23/T24/T25/T26. Verify and use the existing Dreamlining-specific `origin` (`https://github.com/ostsam/dreamlining.git`), confirm `main`'s clean upstream relationship, prove no operation targets parent `vapight-kampff`, and enforce the approved PR/CI policy. Configure contracted hosting/data, environments, migrations, backups/restore, secrets/rotation, domain/TLS, capacity, health/alerts, rollback, retention/deletion, facilitator/incident/event fallback runbooks. Deploy immutable RC with version/config provenance; not yet production-ready.

**T28 — `Run release-candidate operator and felt validation` (critical, medium, task/human checkpoint).** Depends on T27. Execute all operator-assisted/external-oracle/felt checks on representative devices/network using binding prototype. Real facilitator and participants rehearse full flow, exceptions, recovery/rollback. Record pass/fail per AC and explicit go/no-go; failures create/reopen tickets, never prose waivers.

**T29 — `Run a controlled live Dreamlining pilot` (critical, high, task/human checkpoint).** Depends on T28. Real facilitated consenting participants and observer; privacy-safe evidence for funnel, distinct-reviewer distribution, skips/dropouts/reconnects/interventions/incidents and qualitative experience. Use runbook/fallback; no unrecorded mid-event behavior change.

**T30 — `Resolve pilot findings and produce the launch candidate` (critical, high, task).** Depends on T29. Triage by SPEC AC; linked bugs for nontrivial work; all blockers through normal plan/implement/fresh-review; proportionate regression/load/security reruns; signed evidence summary. Scope/design change reopens Tone/gate.

**T31 — `Terminally validate, deploy, and close the Dreamlining run` (critical, high, task).** Depends on T30. Fresh result-validator reads contract cold, executes validation plan exactly, reports per-AC/pass/drift/risks/operator smoke, blocks missing evidence. After pass and human go, deploy immutable launch candidate, post-deploy smoke/rollback/monitoring. Then run Tone/Lattice retro after shipment and real pilot: timeless lessons to `LESSONS.md`/`CLAUDE.md`, run specifics to ledger, next roadmap, run-state closeout; close only with no required work.

## Dependency Graph

All T07–T31 also directly depend on T06.

```text
T01 -> T02 -> T03 ----+
                       +-> T05 -> T06 (approved build contract)
T04 ------------------+

T04 + T06 -> T07 -> T08 -> T09 -> T10
                                      |\
                                      | +-> T12 -----------------------+
                                      +----> T11                       |
                                               |\                      |
                                               | +-> T14 --+            |
                                               | +-> T15 -> T16 -> T17  |
                                               +----> T13 -+ |          |
                                                            +-> T18 -> T19
                                                       T14 + T16 -> T20

T12 + T17 + T18 + T19 + T20 -> T21
T21 -> T22
T21 -> T23
T21 + T20 -> T24
T21 + T22 -> T25
T21 + T22 -> T26
T12 + T23 + T24 + T25 + T26 -> T27 -> T28 -> T29 -> T30 -> T31
```

Mint all catalog edges even where the drawing compresses them: T05 on T03/T04; T16 on T13/T15; T17 on T14/T15/T16; T18 on T10/T13; T19 on T16/T18; T20 on T14/T16; T21 on T12/T17/T18/T19/T20.

## Execution Waves and Safe Parallelism

- Wave 0: T01 (human gate) and T04's audit of the established standalone baseline/upstream/worktree protocol proceed independently. Verified repository safety is not build authorization.
- Wave 1: T02 then human-driven T03.
- Wave 2: T05 then T06. No build planning/work before T06.
- Wave 3: T07 -> T08 -> T09; shared substrate and walking skeleton intentionally serial.
- Wave 4: T10, then T11/T12 parallel.
- Wave 5: T13/T14/T15 parallel after T11.
- Wave 6: T16 after T13/T15; T18 independent; then T17/T19/T20 via narrow edges.
- Wave 7: T21 serialized shared integration.
- Wave 8: T22/T23/T24 parallel; T25/T26 after T22. Fresh reviewer per ticket.
- Wave 9: T27 convergence; T28–T31 serial evidence/human gates.

Respect configured WIP limits (`in_progress` 10, `review` 5). Practical concurrency must stay below independent file lanes/reviewer capacity; never dispatch two tickets claiming the same canonical schema, state machine, or route aggregator.

## Board-Population Procedure

1. Re-read `lattice list --json`; reconcile any concurrent additions rather than duplicate.
2. Create T02–T31 one at a time with `--actor agent:codex-board-impl`, catalog title/type/priority/complexity, phase tags, and full description. Capture returned IDs immediately.
3. Add `related_to DREAM-2` to T01 and every created ticket.
4. Add functional `depends_on` edges plus direct T06 dependency for every T07–T31. Relationship notes may mark `contract gate`, `human-use gate`, or `functional prerequisite`.
5. Leave new tickets backlog/unassigned with empty scaffold plans. Fresh planning agents fill them when dependencies make them ready.
6. Verify `lattice list --json`, spot-check a Tone gate, parallel feature, hardening task, and T31, then run `lattice doctor`. Check no cycles/duplicates/missing descriptions, no T07–T31 without T06, and no build ticket ready before approval.
7. Comment on DREAM-2 with ticket count, actual gate IDs, waves, verified standalone/upstream status, explicit parent-remote prohibition, and verification. Move DREAM-2 to `review`; cold review compares actual board to this plan before completion.

## Acceptance Criteria

- The board covers initiation; prototype discovery/human validation; standalone repo baseline; technical evaluation/spec/build plan/approval; foundation; walking skeleton; session/data lifecycle; drafting; facilitator controls; fairness routing; feedback; exploration; commitment; recap; moderation/consent; recovery; observability; accessibility/fidelity; security/privacy; E2E; load; remote/release/deployment operations; operator/felt check; live pilot; remediation; terminal validation; production deployment; retro.
- Repository facts are accurate: root is `/Users/so/Documents/projects/dreamlining`, `main` includes baseline commit `50ec4c2`, `origin` is `https://github.com/ostsam/dreamlining.git`, and the clean upstream relationship exists. Unrelated parent `ostsam/vapight-kampff` must never be attached or pushed; T04 verifies agent-work safety and T27 verifies/uses the established remote for release work.
- T01–T06 enforce Tone order, living artifacts, stable ACs, and explicit approvals at T03/T06.
- Every T07–T31 has the warning and direct T06 dependency; none enters planning/progress before approval.
- Functional edges preserve walking skeleton/human checkpoints and safe independent lanes while serializing shared integration.
- Descriptions let fresh planners work cold without pre-deciding vendors before T05.
- New tasks are unassigned backlog with scaffold plans; DREAM-1 state/comment are preserved.
- `lattice doctor` passes and DREAM-2 records actual IDs/gates/verification.
- No application, dependency, Git remote, deployment, or external service changes occur during board population.
