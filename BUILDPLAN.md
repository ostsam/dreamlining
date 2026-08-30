# Dreamlining build plan

Status: working draft. The roomboard take is the working visual reference; the gallery and inbox takes remain alternatives until human-use selection. No implementation ticket may leave backlog before the build-contract gate is explicitly approved.

## Architecture decisions

### Runtime and data

Use Next.js App Router with server-rendered pages plus route handlers/server actions. Neon Postgres is the source of truth, accessed through a server-only repository layer. The working driver recommendation is `@neondatabase/serverless` with Drizzle ORM and Drizzle migrations.

- Pooled `DATABASE_URL`: application queries.
- Direct `DATABASE_URL_UNPOOLED`: migrations and administrative tooling.
- `NEON_BRANCH`: disposable test/preview branch identifier.
- `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`, `CONTACT_ENCRYPTION_KEY`: server-only secrets.

Alternative: a document store would make session-scoped privacy, grants, reports, and distinct-commenter coverage harder to audit. Client-direct database access is rejected because it cannot safely enforce draft, private-comment, or contact boundaries.

### Identity and admin

Participants have no accounts. Join creates a random session token; only its hash is stored. The token is held in an HTTP-only, secure, same-site cookie, with a scoped resume link for a second device. `/admin` compares the shared password server-side and issues an expiring signed cookie. Generic `admin` is sufficient audit identity for a trusted local event of about 50 people.

### Live updates

Use two-second polling while a session is active, backing off when idle. This avoids separate realtime infrastructure and works across common serverless runtimes. Writes are transactional and idempotent. A future push transport is allowed only if it preserves the same state contract and privacy rules.

### Privacy and contact safety

Store contact values encrypted with a server-only key. Do not return values until a `ContactGrant` matches requester, owner, method, session, and expiry. There is no directory, bulk export, search, or enumeration route. Private comments are readable only by their author and dreamline owner unless the recipient reports the thread; only then is the disclosed content returned to admin.

## Delivery sequence

### Gate 0 — Definition and operating safety

1. **DREAM-1:** approve the product corpus, privacy model, open-browse/adaptive-router behavior, and admin boundary.
2. **DREAM-3:** run prototype discovery with realistic room data and the five draft surfaces.
3. **DREAM-4:** human drives the takes and selects/iterates the binding direction.
4. **DREAM-5:** verify the standalone Git/worktree protocol and shared project-root `LATTICE_ROOT` behavior for this Lattice install.
5. **DREAM-6:** reconcile `PRODUCT.md`, `DESIGN.md`, `EXPERIENCE.md`, stories, evaluation, spec, and this plan; decide any remaining technical options.
6. **DREAM-7:** independently audit the contract, then obtain explicit human approval. No build agent begins before this gate.

### Gate 1 — Foundation and walking skeleton

7. **DREAM-8:** read the current Next.js guide; pin runtime/dependency conventions; add Neon driver, Drizzle, QR generation, validation, migrations, CI, factories, `bun run check`, `bun run test:full`, and `bun run build`.
8. **DREAM-9:** implement canonical Neon schema and server-only repository layer for sessions, participants, dreamlines, comments, view history, reports, contacts, grants, commitments, and audit events. Enforce deny-by-default session isolation.
9. **DREAM-10:** deliver a production-like skeleton: admin login → create session → QR join → two devices visible → one phase update → reconnect. Human drives phone and computer before feature breadth.

### Gate 2 — State, identity, and observation

10. **DREAM-11:** implement authoritative phase state machine, timers, readiness, immutable submission snapshot, close/reopen, expiry, and audit history.
11. **DREAM-12:** implement join, duplicate-name handling, late join, resume token, reconnect, abandoned participant, closed session, and idempotent writes.
12. **DREAM-13:** add privacy-safe structured logs, health/readiness, deployment markers, phase/coverage/commitment/recovery metrics, and redaction tests.

### Gate 3 — Parallel participant/admin/fairness lanes

13. **DREAM-14:** build the responsive Having/Being/Doing/Blockers flow, draft CRUD, save/offline state, validation, and immutable submission.
14. **DREAM-15:** build `/admin` login, session create form, opaque join URL, real QR, presentation view, phase/timer controls, readiness/coverage roster, report entry point, and destructive confirmations.
15. **DREAM-16:** build the open-access router: balanced randomized initial recommendations, then lower distinct-commenter coverage, lower impressions, viewer-unseen tie-breaks; no assignments, no self-review, no participant counts.

These lanes may run in parallel only after the schema/state contracts are stable. Central route registration and canonical types have one owner.

### Gate 4 — Contribution, contact, and commitment

16. **DREAM-17:** build contribution composition on any submitted dreamline, response type, public-by-default checkbox, private thread, report action, retry, and accessible receipt. Do not imply assigned reviewers.
17. **DREAM-18:** build browse-all exploration from submission visibility onward, neutral/personalized ordering, and private seen-without-comment history. The router nudges; it never gates access.
18. **DREAM-19:** build one-scheme commitment with outcome, first action/date, help wanted, collaborators, edit/confirm, and closing-wall privacy.
19. **DREAM-20:** build participant-scoped recap, approved contact presentation, expiry, export/share controls, and retention behavior.
20. **DREAM-21:** build report-only private disclosure, moderation actions, consent language, rate/length limits, and redacted admin audit events.

### Gate 5 — Integration and hardening

21. **DREAM-22:** own the shared join → draft → submit → browse/router → comment → contact request → commitment → close/recap sequence with seeded 50-person fixtures.
22. **DREAM-23:** harden reconnect, offline replay, stale/duplicate submissions, polling gaps, save conflicts, report/contact partial failures, and advance-while-editing.
23. **DREAM-24:** audit all binding surfaces against `DESIGN.md` at phone/tablet/desktop widths: focus, contrast, text zoom, reduced motion, long names/content, loading/empty/error states.
24. **DREAM-25:** run threat model and authorization audit for tokens, admin password, private comments, report disclosure, contact grants, enumeration, CSRF/XSS/injection, rate limits, secrets, logs, and retention.
25. **DREAM-26:** build deterministic cross-role browser/regression suites; keep `bun run check` hermetic and <=60 seconds, with slow/provider work in `bun run test:full`.
26. **DREAM-27:** run 50-person load/concurrency/realtime-soak checks for autosave bursts, phase transitions, router races, reconnect storms, and duplicate writes.

### Gate 6 — Release, pilot, and closeout

27. **DREAM-28:** configure production-like Neon branch, hosting, secrets, backups/restore, retention purge, health checks, rollback, domain/TLS, and facilitator fallback runbook.
28. **DREAM-29:** human release-candidate rehearsal using all felt/operator-assisted checks.
29. **DREAM-30:** controlled live pilot with consenting participants and privacy-safe evidence for coverage, skips, dropouts, reconnects, reports, contact requests, and commitments.
30. **DREAM-31:** resolve pilot findings through linked tickets and rerun proportionate regression/security/load checks.
31. **DREAM-32:** fresh result-validator audit against `validation-plan.md`, human go/no-go, immutable deployment, post-deploy smoke, and Tone/Lattice retro.

## Guardrail enforcement map

| Guardrail | Enforcement owner |
|---|---|
| `.lattice`, `.env*`, and secrets never staged | DREAM-5, DREAM-8, CI/release checks |
| Server-only Neon/admin/contact secrets | DREAM-8, DREAM-9, DREAM-25 |
| Session isolation and private draft/comment/contact authorization | DREAM-9, DREAM-17, DREAM-20, DREAM-21, DREAM-25 |
| Open browsing without popularity/document-order bias | DREAM-16, DREAM-18, DREAM-24, DREAM-26 |
| Idempotent writes and no loss on transitions | DREAM-11, DREAM-12, DREAM-23, DREAM-26 |
| Retention purge and contact revocation | DREAM-20, DREAM-21, DREAM-28, DREAM-32 |

## Parallelism rules

- Keep schema, session state, and central route registration serialized.
- Fan out participant drafting, admin controls, router engine, and observability after the walking skeleton.
- Fan out recovery, accessibility, security, E2E, and load checks only after shared integration semantics are stable.
- Every ticket must carry its final AC IDs and a harness hook from the approved contract. Provisional board descriptions are reconciled before planning.

## Human checkpoints

- Product/design corpus and binding visual direction.
- Walking skeleton on phone and computer.
- Full facilitated flow with private report/contact approval.
- 30–50 person release rehearsal.
- Live pilot and final go/no-go.
