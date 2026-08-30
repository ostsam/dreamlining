# Dreamlining specification

Status: working build contract. The room-first take (`prototypes/01-roomboard.html`) is the working visual reference; final human-use approval is still required before the contract becomes binding. The gallery, inbox, and admin takes remain supporting references.

## Product boundary

Dreamlining is a private, browser-based session runner for a facilitator-led group of approximately 50 people. Participants join by link/QR from a phone or computer, write a dreamline, submit it, browse the room, make useful contributions, request contact with consent, and leave with one monthly scheme. An admin operates the session through `/admin`.

## Decided architecture

- **Web:** Next.js App Router with server-rendered pages and route handlers/server actions. Never put database credentials or authorization decisions in client components.
- **Database:** Neon Postgres. Use a pooled `DATABASE_URL` for application queries and `DATABASE_URL_UNPOOLED` for Drizzle migrations/administrative tooling. `NEON_BRANCH` identifies disposable test branches.
- **Data access:** Drizzle ORM plus `@neondatabase/serverless` is the working recommendation; pin versions in the foundation ticket after reviewing the current Next.js/Neon runtime docs.
- **Realtime:** short polling (2 seconds while active, backed off when idle) for room state, readiness, coverage, reports, and contact-request notifications. This avoids a separate realtime service for a 50-person event; all writes are idempotent and transactions are authoritative. A later build may replace polling only if it preserves the same state contract.
- **Identity:** no participant accounts. Each join creates a random participant token; store only a cryptographic hash. Set it in an HTTP-only, secure, same-site cookie and provide a private resume/recap URL for another device. Admin authentication uses `ADMIN_PASSWORD_HASH` and `ADMIN_SESSION_SECRET` environment secrets and an expiring signed cookie.
- **Sensitive contacts:** store contact values encrypted with a server-only `CONTACT_ENCRYPTION_KEY`. Return a value only from a server authorization path that finds an unexpired, unrevoked `ContactGrant` for the requester/owner/method/session tuple.
- **QR:** generate the code locally from the opaque participant join URL; never encode admin credentials or raw contact data.
- **Retention:** closed sessions are read-only and purged by a protected maintenance job after 30 days by default.

## Domain model and field ownership

| Entity | Key fields | Writer | Reader |
|---|---|---|---|
| Session | id, publicJoinTokenHash, title, phase, phaseEndsAt, phaseConfig, retentionDays, createdAt, closedAt | Admin session creation/phase actions | Session participants; admin sees operational fields |
| Participant | id, sessionId, displayName, tokenHash, state, joinedAt, lastSeenAt | Join/re-entry service | Same-session participant for display; owner and admin for operational status |
| Dreamline | id, participantId, submissionSnapshot, submittedAt, visibility, updatedAt | Participant draft/submit service | Same-session participants after submit; owner; admin never receives private draft text |
| ViewEvent | id, viewerParticipantId, dreamlineId, viewedAt, recommendationContext | Server view/recommendation route | Viewer’s private history; aggregate router metrics |
| Comment | id, dreamlineId, authorParticipantId, body, kind, visibility, createdAt, updatedAt | Comment service | Public: same-session participants; private: author/owner; admin only after report |
| CommentReport | id, commentId, reporterParticipantId, disclosedAt, reason, status, actionAt | Report/moderation service | Reporter status; admin sees disclosed report and context |
| ContactMethod | id, participantId, label, ciphertext, type, createdAt, revokedAt | Owner settings service | Owner only; never in participant lists |
| ContactRequest | id, ownerParticipantId, requesterParticipantId, context, reason, status, createdAt, decidedAt | Request/owner decision service | Owner and requester metadata; raw method value remains hidden |
| ContactGrant | id, requestId, ownerParticipantId, requesterParticipantId, methodId, expiresAt, revokedAt, revealedAt | Approval/revocation service | Owner and requester grant status; raw value only through approved read |
| Commitment | id, participantId, dreamEntryRef, outcome, firstAction, firstActionDate, helpWanted, collaborators, confirmedAt | Participant commitment service | Owner; closing wall exposes only approved fields |
| AdminAuditEvent | id, action, targetType, targetId, actor, metadataRedacted, createdAt | Every admin mutation | Admin audit view; no secrets or sensitive bodies |

## Non-negotiable invariants

1. Unsubmitted drafts never appear in another participant’s response.
2. Submitted dreamlines are visible only inside their session; participants can open every other submitted dreamline manually.
3. The router never assigns a reviewer, blocks browsing, creates self-review, uses document position, or exposes popularity counts.
4. Recommendations start balanced/randomized, then prioritize lower distinct-commenter coverage, lower recent impressions, and viewer-unseen entries with randomized ties.
5. Public comments are the default. Private comments/replies are readable only by their author and dreamline owner until a report discloses the reported thread to an admin.
6. Contact values are never sent to a client before a specific grant is approved. No endpoint returns a contact directory or allows enumeration.
7. Admin authentication is server-side. Admin access does not bypass comment privacy or contact grants.
8. Every mutation is idempotent where a retry can occur; phase changes and submissions are transactionally ordered.
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

- Human drives the four prototype takes and selects/iterates the binding direction.
- Human approves the architecture tradeoffs and final contract.
- A real facilitator and representative participants run the release-candidate rehearsal before production.
