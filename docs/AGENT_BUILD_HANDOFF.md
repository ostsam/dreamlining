# Dreamlining agent build handoff

The product, binding prototype, technical contract, evaluation plan, repository protocol, and dependency graph are ready for implementation. `DREAM-7` is the only contract gate; no implementation task may enter planning until it is `done`.

## Start here

1. Read `AGENTS.md` and `CLAUDE.md` completely.
2. Set `LATTICE_ROOT=/Users/so/Documents/projects/dreamlining`; this installed Lattice version expects the project root, not `.lattice/`.
3. Run `lattice next --actor agent:<id> --claim --json`. The first implementation task must be `DREAM-8`.
4. Follow `docs/AGENT_WORKTREE_PROTOCOL.md`: one Git branch and sibling worktree per implementation task, one shared absolute Lattice root, no `lattice init` in a worktree, and PR/merge only through the Dreamlining repository.
5. For work that touches persistence, create/check out a disposable Neon child branch matching the Git branch. Never run provider tests or migrations against the default/production branch.

## Source-of-truth order

When artifacts differ, stop and route the contradiction back through DREAM-7 rather than choosing locally.

1. Stable behavior and privacy: `sequence/USER_STORIES.md` and `SPEC.md` (AC-1–AC-44).
2. Verification: `EVALUATION.md` and `.lattice/orchestration/validation-plan.md`.
3. Interaction/visual contract: `DESIGN.md`, `prototypes/01-roomboard.html`, `prototypes/04-admin-control-room.html`, and `prototypes/05-admin-login.html`.
4. Delivery order and ownership: `BUILDPLAN.md` plus Lattice dependency edges.
5. Product rationale: `PRODUCT.md`, `PHILOSOPHY.md`, and `sequence/EXPERIENCE.md`.

Gallery and Guided Inbox are non-binding pattern references. They must not become alternate application shells.

## Locked architecture

- Next.js 16.3.3 App Router on Node.js 20.9+; no Edge runtime.
- Drizzle ORM over `pg`/node-postgres through one server-only repository layer.
- Pooled `DATABASE_URL` for application traffic; direct `DATABASE_URL_UNPOOLED` for migrations/admin tooling.
- Two-second active polling and ten-second idle polling; no WebSocket/SSE service in MVP.
- No participant accounts; random per-session bearer cookie with only a SHA-256 hash stored.
- Shared `/admin` password verified from a versioned scrypt hash; signed expiring admin cookie.
- AES-256-GCM contact encryption and requester-specific, method-specific grants; no directory or bulk export.
- Provider-portable Node deployment. Hosting vendor, cost, domain, and alerting remain a named DREAM-28 human decision.
- Privacy-safe Postgres aggregates, structured redacted logs, and health endpoints; no third-party analytics or outbound notification provider.

## Product guardrails

- Drafts stay owner-only until submission; submitted snapshots are immutable and session-only.
- Every participant can manually browse every other submitted dreamline. Recommendations nudge but never assign or gate.
- Participant surfaces expose no popularity, comment-count, impression-count, or stable document-order signal.
- Feedback is public by default; private threads are author/owner-only until the recipient reports the thread.
- Admin access does not bypass private feedback or contact grants.
- Contact approval reveals one method to one requester; once revealed it cannot be made unseen.
- Closed sessions are read-only and purge after 30 days by default.

## Verified handoff state

- AC coverage: 44/44 in stories, spec, evaluation, and validation plan.
- Evidence classes: autonomous, operator-assisted, external-oracle, and felt all represented.
- Current starter: lint and production build pass.
- Neon: linked project/branch, pooled/direct URL shapes, branch policy, and read-only connectivity verified without printing credentials.
- Prototypes: Impeccable detector clean; desktop/mobile in-app-browser checks show no horizontal overflow or console errors on the binding participant surface.
- Lattice: 32 tasks, 25 contract-gated implementation tasks, direct DREAM-7 dependency on each, and a healthy event store/graph.

The recurring Next.js warning about an ignored parent `package-lock.json` is already assigned to DREAM-8: set `turbopack.root` to this repository without touching the unrelated parent project.
