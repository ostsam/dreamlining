# Dreamlining evaluation contract

This contract turns the stable criteria in `sequence/USER_STORIES.md` into checks a build agent can run. The binding references are `prototypes/01-roomboard.html`, `prototypes/04-admin-control-room.html`, `prototypes/05-admin-login.html`, and `DESIGN.md`. Gallery and Guided Inbox are non-binding pattern references.

## Harness

- `bun run check` — fast, hermetic typecheck/lint/unit/authorization-contract suite. It uses no network, browser, or Neon branch; independent shards run concurrently and the command must finish within 60 seconds on CI hardware.
- `bun run test:full` — browser, multi-user, disposable-Neon-branch, migration, accessibility, and slower integration checks. Provider-dependent cases are tagged and run only when the required branch/env exists.
- `bun run build` — production build.
- `bun run test:router` — seeded router distribution/property simulation across 1, 2, 10, 30, and 50-person fixtures, including ties, late joins, skips, and duplicate requests.
- `bun run test:security` — authorization, session-isolation, enumeration, token, CSRF, private-comment, report-scope, secret-redaction, and contact-leak tests.

The foundation ticket must create these scripts if they do not exist. Tests use deterministic factories; provider tests create or select a disposable Neon child branch and assert it is not the default branch before applying migrations. No test may write to production. Every run records commit, runtime versions, branch name/id (not credentials), seed, command, duration, and artifact path.

## Evidence classes

- **autonomous:** deterministic code/test evidence an agent can produce locally or in CI.
- **operator-assisted:** an objective flow that needs a human to drive a real browser/device or named environment.
- **external-oracle:** truth supplied by an external system such as Neon, a QR scanner, or deployment provider and captured as an artifact.
- **felt:** human judgment about clarity, trust, comfort, or visual/accessibility quality; green automation cannot substitute.

## Criterion matrix

| ID | Verification | Class | Pass condition |
|---|---|---|---|
| AC-1 | Browser test joins a valid session | autonomous | Name entry works without an account or email. |
| AC-2 | Human drives phone and desktop join | operator-assisted | Both viewports complete join without assistance. |
| AC-3 | Unit/browser draft CRUD test | autonomous | Five dream entries per category plus optional blockers can be edited/reordered/deleted. |
| AC-4 | Persistence/reconnect test | autonomous | Refresh/reconnect restores the latest saved draft and explicit save state. |
| AC-5 | Human drives drafting at target widths | felt | No horizontal scroll; prompts and controls remain understandable. |
| AC-6 | Authorization test before submit | autonomous | Other participants receive no draft rows or text. |
| AC-7 | Authorization/indexing test after submit | autonomous | Submitted rows are session-scoped and carry no public index exposure. |
| AC-8 | Submission validation test | autonomous | One dream is sufficient; blockers are optional. |
| AC-9 | Multi-user browse test | autonomous | Any participant can open every other submitted dreamline manually. |
| AC-10 | Seeded ordering test | autonomous | Initial recommendations are not document or alphabetical order and are balanced across viewers. |
| AC-11 | Router property test | autonomous | Fewer distinct commenters and lower impressions receive higher recommendation priority after activity begins. |
| AC-12 | Router authorization/unit test | autonomous | No self-review is suggested and manual browse is never blocked. |
| AC-13 | View-history test | autonomous | Viewer sees a private list of opened, un-commented dreamlines. |
| AC-14 | Authorization test | autonomous | Viewer history cannot be read by another participant or admin. |
| AC-15 | Composer UI/browser test | autonomous | New response starts session-visible and says so. |
| AC-16 | Private-thread authorization test | autonomous | Private response/replies are readable only by author and dreamline owner. |
| AC-17 | Admin authorization test | autonomous | Facilitator cannot read unreported private responses. |
| AC-18 | Report flow integration test | autonomous | Reporting discloses only the reported thread/context and records moderation. |
| AC-19 | Contact payload test | autonomous | No contact value appears before a requester-specific approval. |
| AC-20 | Grant matrix test | autonomous | Owner approves/denies one requester and one method without exposing others. |
| AC-21 | Enumeration/security test | autonomous | No bulk contact endpoint, search, export, or predictable grant lookup exists. |
| AC-22 | Human drives contact copy | felt | Request/approval consequence is clear before approval. |
| AC-23 | Commitment browser test | autonomous | One dream, outcome, first action/date, and optional help are saved. |
| AC-24 | Closing-wall authorization test | autonomous | Wall excludes blockers, private comments, and unapproved contacts. |
| AC-25 | Recap-token expiry test | autonomous | Recap is participant-scoped and unavailable after retention expiry. |
| AC-26 | Admin-route authorization test | autonomous | Every dashboard/mutation redirects or rejects without server-side password auth. |
| AC-27 | Cookie/secrets test | autonomous | Admin cookie expires, is HTTP-only/secure/same-site, and secrets never reach client/database. |
| AC-28 | Human drives admin dashboard | felt | Phase, timer, readiness, coverage, and exceptions are legible at a glance. |
| AC-29 | QR generation integration test | autonomous | Session creation returns an opaque join URL and locally generated QR artifact. |
| AC-30 | QR payload/security test | autonomous | QR contains only the participant join URL. |
| AC-31 | Human scans QR on phone and computer | external-oracle | Independent device scanners decode only the intended join URL and both devices join that session. |
| AC-32 | Session state-machine test | autonomous | Advance/extend/pause/resume/close/reopen transitions are explicit and safe. |
| AC-33 | Failure-state integration test | autonomous | Late join, reconnect, duplicate, abandonment, and duplicate submission have defined recovery. |
| AC-34 | Human drives transition during edit | felt | Participant understands what changed and no saved work disappears. |
| AC-35 | Report/admin authorization test | autonomous | Report queue exposes only disclosed content and never unrelated private/contact data. |
| AC-36 | Audit-log test | autonomous | Moderation, grants, phase overrides, and deletion create actor/time/action records. |
| AC-37 | Metrics/unit test | autonomous | Distinct-commenter coverage and recommendation impressions are persisted/derived per submission. |
| AC-38 | Privacy/metrics test | autonomous | Private feedback affects coverage but not unauthorized reads. |
| AC-39 | Ordering/privacy test | autonomous | Participant surfaces expose neither popularity counts nor stable document order. |
| AC-40 | Schema/writer-reader test on disposable Neon branch | external-oracle | All required session, participant, dreamline, comment, coverage, grant, and commitment fields persist through server-only access. |
| AC-41 | Neon environment/build test | external-oracle | Live branch evidence proves the app URL is pooled, migration URL is direct, and neither reaches the browser or build output. |
| AC-42 | Retention integration test | autonomous | Closed sessions are read-only and purge after the configured 30-day default. |
| AC-43 | Human accessibility audit | felt | Phone/desktop flows meet WCAG 2.2 AA expectations, including keyboard, focus, labels, contrast, and reduced motion. |
| AC-44 | Failure/security integration test | autonomous | Refresh/reconnect/idempotent writes do not leak across sessions. |

## Human-use checkpoints

1. **Walking skeleton (operator-assisted):** facilitator creates a session in `/admin`, displays QR, two devices join, one phase update is observed, and a reconnect restores identity.
2. **Participant flow:** a human completes drafting, submits, opens a recommendation, sends public/private feedback, requests contact, and creates a scheme on phone and desktop.
3. **Admin flow:** a human runs the room, scans the QR, advances/extends a phase, reviews aggregate coverage, handles a report, and confirms the dashboard never reveals unreported private content or contacts.
4. **Release candidate (operator-assisted + felt):** a real facilitator rehearses a 30–50 person fixture, including late join, dropout, reconnect, private report, and contact approval.

No user-facing milestone is complete on green tests alone; the felt checkpoints must be recorded against the binding prototype.

## Required evidence bundle

For every build or release task, attach the commands run, exit status, duration, relevant seed/fixture, screenshots or traces for browser failures, redacted provider output for external-oracle checks, and a per-AC pass/fail list. Missing evidence is a failure, not a prose waiver.
