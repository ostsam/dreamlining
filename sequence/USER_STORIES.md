# Dreamlining user stories and acceptance criteria

Acceptance criteria use stable IDs so the prototype, build contract, and validation plan can carry them forward unchanged. Criteria marked `felt` require human use of the prototype or shipped surface.

## Participant

### US-1 — Join with minimal friction

As a participant, I want to join from a QR code or link without creating an account so I can start with the room.

- **AC-1** (`autonomous`): A valid join URL opens a session-scoped name entry without requiring an email, password, or third-party account.
- **AC-2** (`felt`): A participant can join successfully on both a phone and a desktop/laptop viewport.

### US-2 — Draft a complete dreamline

As a participant, I want a guided Having/Being/Doing/Blockers flow so I can write without wrestling with a document.

- **AC-3** (`autonomous`): A participant can add, edit, reorder, and delete up to five entries in each dream category and optionally add blockers.
- **AC-4** (`autonomous`): Draft changes persist through refresh/reconnect with an explicit saved/offline state.
- **AC-5** (`felt`): The drafting flow is understandable and comfortable on phone and computer without horizontal scrolling.

### US-3 — Control submission visibility

As a participant, I want drafts private until I submit so I can write honestly.

- **AC-6** (`autonomous`): A draft is not returned to other participants before its owner submits it.
- **AC-7** (`autonomous`): After submission, the dreamline is visible only inside the current session and is excluded from public indexing.
- **AC-8** (`autonomous`): At least one dream entry is required before submission; blockers remain optional.

### US-4 — Find a useful contribution to make

As a participant, I want open access with a fair recommendation order so I can help people who might otherwise be overlooked.

- **AC-9** (`autonomous`): Every submitted dreamline except the viewer’s own can be opened manually by a session participant.
- **AC-10** (`autonomous`): Initial recommendations use balanced randomized ordering rather than document position or alphabetical order.
- **AC-11** (`autonomous`): After feedback begins, recommendations prioritize fewer distinct commenters, then lower recent impressions, with randomized tie-breaking.
- **AC-12** (`autonomous`): The router never creates a self-review or prevents manual browsing.

### US-5 — Return to unfinished attention

As a participant, I want to see dreamlines I viewed but did not comment on so I can come back when I have something useful.

- **AC-13** (`autonomous`): The participant can open a private “Seen, no comment yet” list containing their own view history.
- **AC-14** (`autonomous`): One participant cannot read another participant’s seen-without-comment history.

### US-6 — Comment with a privacy choice

As a participant, I want public feedback by default with a private option for sensitive responses.

- **AC-15** (`autonomous`): A new response defaults to session-visible and the control clearly communicates that state.
- **AC-16** (`autonomous`): Unchecking visibility makes the response and its replies readable only by the commenter and dreamline owner.
- **AC-17** (`autonomous`): A facilitator cannot read a private response unless its recipient reports that thread.
- **AC-18** (`autonomous`): Reporting a private thread discloses the reported content and context to the facilitator and records the moderation action.

### US-7 — Request contact safely

As a participant, I want to request a specific contact method so people cannot harvest a directory of private details.

- **AC-19** (`autonomous`): Contact methods are absent from participant payloads until the owner approves a requester-specific grant.
- **AC-20** (`autonomous`): An owner can approve or deny one requester and one method without exposing other methods.
- **AC-21** (`autonomous`): No participant or admin endpoint returns a bulk contact list or supports contact enumeration.
- **AC-22** (`felt`): The request and approval language makes the visibility consequence clear before approval.

### US-8 — Leave with momentum

As a participant, I want one concrete monthly scheme and a private recap.

- **AC-23** (`autonomous`): A participant can select one dream, enter an outcome, first action/date, and optional help request.
- **AC-24** (`autonomous`): The closing wall excludes blockers, private comments, and unapproved contacts.
- **AC-25** (`autonomous`): The private recap is scoped to its participant token and expires with the session retention window.

## Facilitator/admin

### US-9 — Operate the room from `/admin`

As a facilitator, I want a password-gated control room so I can run the event without editing a shared document.

- **AC-26** (`autonomous`): `/admin` requires a server-side password check before any dashboard or mutation is available.
- **AC-27** (`autonomous`): A successful login creates an expiring HTTP-only admin session; the password is never sent to client code or stored in the database.
- **AC-28** (`felt`): The dashboard makes phase, timer, readiness, coverage, and exceptions legible at a glance.

### US-10 — Create and start a session

As a facilitator, I want to create a session and show a QR code so the room can join quickly.

- **AC-29** (`autonomous`): Creating a session returns an opaque participant join URL and a locally generated QR code.
- **AC-30** (`autonomous`): The QR code contains no admin password, session secret, or contact data.
- **AC-31** (`felt`): A facilitator can display the QR code and participants can join from both phone and computer without instruction beyond the screen copy.

### US-11 — Control phases and recover exceptions

As a facilitator, I want manual phase controls so the event can adapt without losing work.

- **AC-32** (`autonomous`): The facilitator can advance, extend, pause/resume, close, and safely reopen a session with explicit confirmation for destructive actions.
- **AC-33** (`autonomous`): Late joins, reconnects, duplicate names, abandoned participants, and duplicate submissions have defined recoverable states.
- **AC-34** (`felt`): A participant understands what happened when a phase changes while they are editing.

### US-12 — Moderate only what is disclosed

As a facilitator, I want to act on reports without gaining unrestricted private access.

- **AC-35** (`autonomous`): The report queue exposes reported content and enough context to moderate it, but not unrelated private comments or contact methods.
- **AC-36** (`autonomous`): Moderation, contact grants, phase overrides, and session deletion are audit-recorded as admin actions.

## System qualities

### US-13 — Preserve fair attention

As the event owner, I want to know whether attention is distributed fairly.

- **AC-37** (`autonomous`): The system records distinct-commenter coverage and recommendation impressions per submitted dreamline.
- **AC-38** (`autonomous`): Private feedback contributes to coverage metrics without becoming visible to unauthorized readers.
- **AC-39** (`autonomous`): Participant-facing surfaces do not expose popularity counts or a stable document-order ranking.

### US-14 — Persist securely and expire

As the event owner, I want session data to survive the event but not become a permanent archive.

- **AC-40** (`autonomous`): Session, participant, dreamline, comment, coverage, grant, and commitment data persist in the selected Neon Postgres database through server-only access.
- **AC-41** (`autonomous`): Application traffic uses the pooled Neon URL and migrations use the unpooled URL; neither secret is exposed to the browser.
- **AC-42** (`autonomous`): Closed sessions become read-only and are deleted after the configured 30-day default retention window.

### US-15 — Work for the room

As a participant, I want the experience to be accessible and reliable on my device.

- **AC-43** (`felt`): Core participant and admin flows work at phone and desktop widths, with keyboard navigation, visible focus, screen-reader labels, and sufficient contrast.
- **AC-44** (`autonomous`): The app handles refresh/reconnect and idempotent writes without cross-session data leakage.
