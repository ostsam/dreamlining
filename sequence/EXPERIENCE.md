# Dreamlining experience contract

## Roles

- **Participant:** joins with a display name, writes a dreamline, browses submitted dreamlines, contributes feedback, requests contact, and leaves with one monthly scheme.
- **Facilitator/admin:** signs into `/admin`, creates and runs a session, displays the QR code, controls the phases, monitors readiness and coverage, handles reports/exceptions, and closes the event.

## Session flow

### 1. Admin setup

The admin opens `/admin`, enters the shared password, and sees active and recent sessions. **Create session** asks for a name, optional date, phase durations, feedback recommendation settings, and retention. Saving creates an opaque join URL and locally generated QR code. The QR code contains only the participant join URL.

The admin can copy the link, show the QR code full-screen, or open a presentation view. Admin actions are audited as `admin`; this is intentionally not a multi-user admin identity system.

### 2. Join and lobby

The participant opens the link, chooses a display name, and receives a session-scoped secret for re-entry. No account or email is required. The lobby explains the phases and shows anonymous readiness progress. Duplicate names receive a disambiguation prompt; the facilitator can remove an abandoned or abusive participant.

### 3. Dreamline drafting

The participant uses a responsive stepper or tabs for **Having**, **Being**, **Doing**, and **Blockers**. Each dream category allows up to five entries; blockers are optional. Cards support add, edit, reorder, and delete. Drafts autosave with visible saving/saved/offline states. At least one dream entry is required to submit.

Drafts are private. The participant may revise until submitting. Submission creates an immutable session snapshot; the submitted dreamline becomes visible to the session and is not edited during the feedback phase. A participant may reference one entry in their commitment, but cannot silently change the reviewed snapshot.

### 4. Open feedback and adaptive recommendations

There are no assigned reviewers. Every submitted dreamline is browseable by every participant except its owner.

The feedback surface has:

- **Give feedback:** opens the next personalized recommendation.
- **Browse everyone:** unrestricted access to submitted dreamlines.
- **Seen, no comment yet:** entries this participant opened without sending feedback.
- **Commented:** entries this participant already engaged with.

The router begins with a balanced randomized ordering. It then prioritizes entries with fewer distinct commenters, then fewer recent impressions, then entries the current viewer has not seen, with a randomized tie-breaker. A comment from a participant counts once toward distinct-commenter coverage even if it contains multiple replies. Private comments count toward coverage without being exposed.

Participants may skip, browse manually, revisit, or comment on any entry. The router never blocks access and never displays popularity counts. A facilitator may see aggregate coverage and a list of entries receiving unusually little attention, but not private comment contents.

### 5. Comments and reports

Each response is attached to a specific dream or blocker and offers response types such as idea/advice, resource/introduction, question, or offer to help. The visibility control is checked by default:

> ☑ Visible to everyone in this session

Unchecking it makes the response visible only to the commenter and dreamline owner. A private response and its replies form a private thread. The facilitator cannot read it by default. Reporting a private thread explicitly discloses the reported content to the facilitator for moderation.

### 6. Contact requests

The participant can add one or more optional contact methods, each labeled and hidden. Another participant chooses **Request contact**, selects the context, and writes a short reason. The owner sees the requester, related dreamline/comment, reason, and available methods. They approve one method, approve none, or deny.

An approval grants one requester access to one method for this session and retention window. There is no directory, bulk approval, contact search, or preloaded contact value in client data. Revocation stops future reads but cannot erase information already copied.

### 7. Monthly scheme and close

The participant selects one dream, writes a monthly outcome, names the first action and date, and optionally states help wanted and collaborators. The closing wall displays schemes and help requests, not blockers or private feedback. The participant receives a private recap link containing their own dreamline, received feedback/offers, commitment, and approved contacts. The session becomes read-only and is deleted after 30 days by default.

## Admin control room

`/admin` includes:

- Password login and session list
- Create session and generated QR/join link
- Current phase, timer, readiness, submitted count, and feedback coverage
- Manual advance, extend, pause/resume, close, and safe reopen controls
- Presentation mode for the room
- Late-join, duplicate, abandonment, and reconnect handling
- Report queue and moderation actions
- Archive/delete controls with confirmation

“Full dashboard” means operational visibility and control. It does not bypass private-comment or contact-consent rules.

## State model and recovery

`draft session → lobby → drafting → feedback → commitment → closed → archived/deleted`.

- A late joiner can enter the lobby or drafting state while the session is open; after submitting, they enter the recommendation pool.
- If a phase advances while someone is editing, the last saved draft remains intact and the UI explains what is locked.
- Reconnect restores the participant’s session token and unsent local draft; duplicate sends are idempotent.
- If there are fewer than four participants, the router reports coverage as a reference, not a hard requirement.
- If a participant leaves without commenting, their seen-without-comment history remains private to them.
- If a report is filed, the facilitator receives only the reported thread and enough context to act.

## MVP non-goals

No participant accounts, public profiles, cross-event social graph, DMs, AI-generated advice, payment, email/SMS integration, or public web indexing.
