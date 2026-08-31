# Dreamlining specification

Status: architecture-complete contract awaiting the DREAM-7 approval gate. `prototypes/01-roomboard.html` is the binding participant reference; `prototypes/04-admin-control-room.html` and `prototypes/05-admin-login.html` are the binding facilitator references. The gallery and guided-inbox takes are non-binding pattern references only.

## Product boundary

Dreamlining is a private, browser-based session runner for a facilitator-led group of approximately 50 people. Participants join by link/QR from a phone or computer, write a dreamline, submit it, browse the room, make useful contributions, request contact with consent, and leave with one monthly scheme. An admin operates the session through `/admin`.

## Decided architecture

- **Web/runtime:** Next.js 16.3.3 App Router on the default Node.js runtime, Node.js 20.9 or newer, with server-rendered pages plus route handlers/server actions. Edge runtime is rejected: the bundled Next.js guide marks it deprecated, and transactional Postgres/auth/crypto paths require Node. Database credentials and authorization decisions never enter client components.
- **Database:** Neon Postgres is the system of record. The linked project and production branch already respond to a read-only query. Application traffic uses the pooled `DATABASE_URL`; Drizzle migrations, dumps, and administrative tooling use `DATABASE_URL_UNPOOLED`. Production is never a test target.
- **Data access:** Drizzle ORM with `pg`/node-postgres and `drizzle-orm/node-postgres`. A server-only repository layer owns every query and transaction. This was chosen over `@neondatabase/serverless` HTTP because the product needs ordinary interactive transactions and a provider-portable Node deployment; feature agents do not get to choose a second driver.
- **Neon workflow:** schema changes are migrations-as-code. Each implementation branch uses a disposable Neon child branch (`neon checkout <git-branch>`), `NEON_BRANCH` identifies it, and the existing `neon.ts` gives newly created non-default branches a seven-day TTL. Migration tests use the direct URL; app and browser tests use the pooled URL. `neon diff` is reviewed before migration commits.
- **Hosting:** build a standard Next.js Node deployment with no provider-specific APIs. No hosting vendor has been approved; DREAM-28 must present the production provider/cost/domain choice to the human operator. If Vercel is selected later, DREAM-28 may add its documented pool attachment without changing repository contracts.
- **Live updates:** poll every two seconds while the session tab is visible and active, back off to ten seconds when idle, and refresh immediately after a successful mutation or focus return. Poll only authorized projections for room phase, participant readiness, contact-request state, and admin aggregate coverage/reports. Transactions remain authoritative; no WebSocket/SSE service is in MVP.
- **Participant identity:** no participant accounts. Generate a 256-bit random bearer token per join, store only its SHA-256 hash, and put the raw token in a per-session HTTP-only cookie (`Secure` in production, `SameSite=Lax`, bounded to retention). Phone and computer are supported as alternatives; cross-device identity transfer is not an MVP promise. Recap access is scoped to the same participant cookie.
- **Admin authentication:** `ADMIN_PASSWORD_HASH` is a versioned scrypt hash; compare with a constant-time check. A successful `/admin` login creates an expiring, HMAC-SHA-256-signed HTTP-only cookie using `ADMIN_SESSION_SECRET`. Every mutation validates the cookie, same-origin request, and CSRF-safe origin; the shared actor is recorded as `admin`.
- **Sensitive contacts:** encrypt each value with AES-256-GCM using a random 96-bit IV, authenticated metadata for session/owner/method, and a versioned ciphertext envelope under server-only `CONTACT_ENCRYPTION_KEY`. Only a server authorization path holding an unexpired, unrevoked requester/owner/method/session `ContactGrant` may decrypt and return one value.
- **Idempotency:** every retryable mutation accepts a client-generated UUID idempotency key. A session/participant/operation unique constraint and `MutationReceipt` make duplicate submit/comment/request/phase actions return the original result instead of repeating effects.
- **QR:** generate a PNG/SVG locally from `APP_ORIGIN` plus the opaque participant join URL. The encoded payload contains no admin path, credential, participant token, or contact value.
- **Observability/analytics:** emit structured JSON server logs with request ID, deployment ID, session pseudonym, action, duration, and result; never bodies, bearer tokens, contact ciphertext/plaintext, or private-comment content. Product analytics are Postgres aggregates only: joins, submissions, phase timing, distinct-commenter coverage, recommendation impressions, recovery events, commitments, and reports. No third-party analytics SDK is in MVP.
- **Notifications/monitoring:** notifications are in-app polling only; no email, SMS, or push provider. Provide `/api/health/live` (process) and `/api/health/ready` (read-only DB check), redaction tests, and release/deployment markers. Provider alerting is configured only after DREAM-28’s human hosting choice; Neon Postgres logs are not assumed to be available.
- **Retention:** closed sessions become read-only immediately and are purged after 30 days by a same-origin/protected maintenance route authenticated with `MAINTENANCE_SECRET`. Purge runs transactionally in bounded batches and records only a redacted completion audit row.

## Environment contract

| Variable | Purpose | Allowed readers | Browser exposure |
|---|---|---|---|
| `DATABASE_URL` | Pooled Neon application queries | server repository, integration harness | forbidden |
| `DATABASE_URL_UNPOOLED` | Drizzle migrations/admin tooling | migration and release commands only | forbidden |
| `NEON_BRANCH` | Disposable branch identity/provenance | dev/test/release tooling | forbidden |
| `APP_ORIGIN` | Canonical origin for join URLs and QR | server session creation | only the resulting public origin/URL |
| `ADMIN_PASSWORD_HASH` | Versioned scrypt verifier | admin login service | forbidden |
| `ADMIN_SESSION_SECRET` | Admin-cookie HMAC key | admin session service | forbidden |
| `CONTACT_ENCRYPTION_KEY` | Base64 32-byte AES-GCM key | contact repository only | forbidden |
| `MAINTENANCE_SECRET` | Retention-job authentication | protected purge route/operator job | forbidden |

Startup validation fails closed when a required server variable is missing or malformed. `.env*`, `.neon`, and `.lattice` remain untracked; tests assert no `NEXT_PUBLIC_` alias exists for any secret.

## Domain model and field ownership

Every table carries `id`, `createdAt`, and an explicit `sessionId` or a foreign-key path to one. Repositories reject cross-session joins before returning a projection.

| Entity | Persisted fields | Writer | Authorized reader / prohibited projection |
|---|---|---|---|
| Session | publicJoinTokenHash, title, phase, phaseStartedAt, phaseEndsAt, phaseConfig, pausedAt, retentionDays, closedAt | Admin session/phase services | Participants receive title/phase/timing only; admin receives operational state; hashes never project |
| Participant | displayName, tokenHash, state, joinedAt, lastSeenAt, leftAt | Join/re-entry/heartbeat services | Same-session peers receive id/name only; owner/admin receive state; tokenHash never projects |
| DreamlineDraft | participantId, havingEntries, beingEntries, doingEntries, blockers, revision, savedAt | Owner autosave service | Owner only; admin and peers receive neither row existence nor text |
| DreamlineSubmission | participantId, immutableSnapshot, submittedAt | Submit transaction copied from owner draft | Same-session participants and admin after submit; no public/indexable route; owner may read own snapshot |
| RecommendationImpression | viewerParticipantId, submissionId, algorithmVersion, servedAt, dedupeBucket | Server router only | Aggregate router/admin metrics only; no participant row/count projection |
| DreamlineView | viewerParticipantId, submissionId, source, viewedAt, commentedAt | Server open/comment services | Viewer’s private trail and aggregate router only; peers/admin cannot read history |
| Comment | submissionId, authorParticipantId, parentCommentId, kind, body, visibility, updatedAt | Author comment/reply service | Public: same-session projection; private: author + submission owner; admin only through disclosed report context |
| CommentReport | commentId, reporterParticipantId, reason, disclosedAt, status, action, actionAt | Recipient report service; admin moderation service | Reporter sees status; admin sees only reported thread/context; peers see none |
| ContactMethod | participantId, type, label, ciphertextEnvelope, revokedAt | Owner contact settings service | Owner metadata only; ciphertext never projects; plaintext only through granted decrypt path |
| ContactRequest | ownerParticipantId, requesterParticipantId, context, reason, status, decidedAt | Requester create; owner decision | Owner/requester see request metadata; nobody receives a method value from this row |
| ContactGrant | requestId, ownerParticipantId, requesterParticipantId, methodId, expiresAt, revokedAt, revealedAt | Owner approval/revocation; server reveal timestamp | Owner/requester see status; requester may receive exactly one decrypted value while grant is valid |
| Commitment | participantId, submissionId, outcome, firstAction, firstActionDate, helpWanted, collaborators, confirmedAt | Owner commitment service | Owner sees full row; closing wall gets explicit approved projection only |
| MutationReceipt | participantId/adminActor, operation, idempotencyKeyHash, resultType, resultId, expiresAt | Transaction wrapper for retryable writes | Server only; caller receives original operation result, never the stored key hash |
| AdminAuditEvent | action, targetType, targetId, actor, requestId, metadataRedacted, occurredAt | Every admin mutation plus purge/grant/report actions | Admin audit view; no bodies, tokens, contact values/ciphertext, or private text |

## Non-negotiable invariants

1. Unsubmitted drafts never appear in another participant’s response.
2. Submitted dreamlines are visible only inside their session; participants can open every other submitted dreamline manually.
3. The router never assigns a reviewer, blocks browsing, creates self-review, uses document position, or exposes popularity counts.
4. Recommendations start as a deterministic per-viewer shuffle. Once feedback exists, the sort tuple is: distinct commenter count ascending, recommendation impressions in the current 15-minute window ascending, viewer-unseen first, then a deterministic per-viewer random tie-break. An impression is recorded at most once per viewer/submission/five-minute bucket so polling cannot inflate it.
5. Public comments are the default. Private comments/replies are readable only by their author and dreamline owner until a report discloses the reported thread to an admin.
6. Contact values are never sent to a client before a specific grant is approved. No endpoint returns a contact directory or allows enumeration.
7. Admin authentication is server-side. Admin access does not bypass comment privacy or contact grants.
8. Every retryable mutation is idempotent; phase changes, submissions, comments, contact decisions, and audit writes commit transactionally with their receipts.
9. Closed sessions are read-only; retention deletion removes dreamlines, comments, view history, contacts, grants, commitments, and audit metadata according to the retention policy.
10. The UI communicates state with text/icon plus color, meets WCAG 2.2 AA targets, and works at phone and desktop widths.

## Acceptance criteria

The canonical wording lives in `sequence/USER_STORIES.md`; the build must satisfy every criterion below and map each one to `EVALUATION.md`:

- **AC-1:** A valid join URL opens session-scoped name entry without an account or email.
- **AC-2:** A participant can join on phone and desktop/laptop viewports.
- **AC-3:** A participant can CRUD/reorder up to five entries per category and optional blockers.
- **AC-4:** Drafts restore after refresh/reconnect with explicit save/offline state.
- **AC-5:** Drafting is understandable on phone and computer without horizontal scroll.
- **AC-6:** Other participants receive no unsubmitted draft rows or text.
- **AC-7:** Submitted dreamlines are session-only and excluded from public indexing.
- **AC-8:** One dream permits submit; blockers remain optional.
- **AC-9:** A participant can manually open every other submitted dreamline.
- **AC-10:** Initial recommendations are balanced/randomized, not document/alphabetical order.
- **AC-11:** Post-activity recommendations prioritize lower distinct-commenter coverage, lower impressions, and viewer-unseen entries with randomized ties.
- **AC-12:** The router never self-recommends and never blocks manual browse.
- **AC-13:** A participant can open their private seen-without-comment list.
- **AC-14:** Another participant/admin cannot read that history.
- **AC-15:** New responses default to session-visible with clear copy.
- **AC-16:** Private responses/replies are readable only by author and dreamline owner.
- **AC-17:** Admin cannot read unreported private responses.
- **AC-18:** A report discloses only the target thread/context and records moderation.
- **AC-19:** Contact values are absent until a requester-specific approval.
- **AC-20:** An owner can approve/deny one requester and one method without exposing others.
- **AC-21:** No bulk contact list, search, export, or enumeration exists.
- **AC-22:** Contact request/approval copy makes the disclosure consequence clear.
- **AC-23:** A participant can save one dream, outcome, first action/date, and optional help request.
- **AC-24:** The closing wall excludes blockers, private comments, and unapproved contacts.
- **AC-25:** The recap is participant-scoped and expires with retention.
- **AC-26:** `/admin` rejects dashboard/mutations without server-side password auth.
- **AC-27:** Admin login creates an expiring secure HTTP-only cookie and leaks no secret.
- **AC-28:** Admin phase, timer, readiness, coverage, and exceptions are legible.
- **AC-29:** Session creation returns an opaque join URL and local QR artifact.
- **AC-30:** QR payload contains only the participant join URL.
- **AC-31:** The displayed QR joins the intended session from phone and computer.
- **AC-32:** Advance/extend/pause/resume/close/reopen transitions are explicit and safe.
- **AC-33:** Late join, reconnect, duplicate, abandonment, and duplicate submit recover.
- **AC-34:** A participant understands phase changes while editing and saved work remains.
- **AC-35:** Admin report queue exposes only reported/disclosed content and context.
- **AC-36:** Moderation, grants, overrides, and deletion create redacted admin audit records.
- **AC-37:** Distinct-commenter coverage and recommendation impressions are recorded per submission.
- **AC-38:** Private feedback affects coverage without unauthorized visibility.
- **AC-39:** Participant surfaces expose no popularity counts or stable document ranking.
- **AC-40:** Required domain entities persist through server-only Neon Postgres access.
- **AC-41:** App uses pooled `DATABASE_URL`; migrations use unpooled URL; neither reaches browser.
- **AC-42:** Closed sessions are read-only and purge after the configured 30-day default.
- **AC-43:** Core flows meet WCAG 2.2 AA expectations at phone and desktop widths.
- **AC-44:** Refresh/reconnect/idempotent writes cannot leak across sessions.

## Explicit non-goals

No participant accounts, OAuth, public profiles, cross-event network, direct messaging, AI-generated advice, payments, email/SMS integration, public indexing, multi-tenant admin roles, or guaranteed delivery once contact information has been voluntarily revealed.

## Human gates

- Satisfied: the human drove the prototype critique/revision/browser pass and approved Roomboard plus the two admin companion surfaces.
- DREAM-7: the human approves this architecture contract before any build task enters planning.
- A real facilitator and representative participants run the release-candidate rehearsal before production.
