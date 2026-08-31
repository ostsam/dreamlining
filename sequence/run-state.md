# Dreamlining Tone run state

## Current position

- Stage: `tone-prototype complete → tone-architect ready`
- Phase: `binding prototype approved; architecture contract ready for final audit`
- Product hypothesis: a browser-based, facilitator-led session runner for a roughly 50-person social circle; participants may use phones or computers.
- Current task: `DREAM-6`, after DREAM-4 closeout.
- Next stage: finalize and approve the architecture contract through `DREAM-6` and `DREAM-7`.
- Visual register: product UI; welcoming, communal, lightly playful; pure-white canvas with indigo primary and coral invitation accents; WCAG 2.2 AA target.
- `prototypes/01-roomboard.html` is the binding participant prototype; `04-admin-control-room.html` and `05-admin-login.html` are the binding facilitator surfaces. `DESIGN.md` is the binding visual/interaction contract. `EVALUATION.md`, `SPEC.md`, and `BUILDPLAN.md` await architecture closeout and the DREAM-7 build gate.

## Problem statement

The event currently uses a shared Google Doc. The form is awkward, comments are janky, and entries near the top receive disproportionate attention. The product must make every submitted dreamline reachable while creating a fair, low-friction path to useful feedback and a concrete monthly commitment.

## Decisions recorded with the client

| Decision | Resolution | Why |
|---|---|---|
| Device | Phone or computer | The event should not privilege one screen size. |
| Identity | No participant accounts | Lowest-friction entry for a trusted social circle. |
| Submission visibility | Drafts private; submitted dreamlines visible to the session | People need a private writing moment, then a shared room. |
| Feedback access | All participants can browse and comment on every submitted dreamline | Open serendipity is part of the event. |
| Feedback ordering | Personalized randomization first; then prioritize dreamlines with fewer distinct commenters | Corrects document-order and popularity feedback loops without forced assignments. |
| Seen-without-comment | Personal history is retained | Participants can return to contributions they opened but could not yet answer. |
| Comment privacy | Public by default; commenter may make a response private | Public generosity is the norm, with an explicit escape hatch. |
| Facilitator access | Private comments are disclosed only when reported | “Private” must mean private. |
| Contact sharing | Requester asks; owner approves a specific method | Prevents a leaky contact directory. |
| Admin | Password-gated `/admin` creates sessions, QR links, controls phases, and moderates reports | One trusted operator is enough for this local event. |
| Persistence provider | Neon Postgres selected; pooled app URL and unpooled migration URL | Fits relational permissions and small event concurrency. |
| Economics/integrations | Not load-bearing; no external integration in MVP | This is a community tool, not a paid platform yet. |
| Retention | Session data read-only after close, deleted after 30 days by default | Keeps recaps useful without creating a permanent archive. |
| Submitted snapshot | Immutable during feedback | Reviewers should not be responding to a moving target. |
| Default agenda | 5 min join/lobby, 20 min drafting, 30 min open feedback, 15 min commitment, 10 min close; facilitator-editable | Gives a 50-person room a usable starting point without making timing a product dependency. |

## Open risks / resolution method

- Exact phase timings and maximum room size: validate in prototype rehearsal with a 30–50 person fixture.
- Whether participants want blocker text visible to the whole session: prototype both a full-session and limited-sensitivity treatment, then choose during human use. Current default is submitted dreamline visibility within the session; the author may omit blockers.
- Shared admin password accountability: acceptable for this event; log actions as generic `admin` and revisit if the product serves multiple organizers.
- Router fairness metric: use distinct commenters as the primary coverage measure; validate distribution in a seeded simulation and pilot.

## Touchpoints and handoff

- Client approved the core open-browsing/adaptive-router direction, no-account entry, report-only private-comment disclosure, Neon persistence, and the admin surface through dialogue on 2026-08-30.
- The client reviewed the redesigned prototype set, requested visual critique and in-app-browser verification, then instructed the session to continue. That instruction is recorded in Lattice as explicit approval to bind Roomboard.
- Roomboard leads with event rhythm and a quiet balanced nudge without removing open browsing. Gallery and Guided Inbox remain pattern references only. Admin Login and Admin Control Room are binding companion states.
- The client requested that no subagents be used. Lifecycle stages and review evidence are therefore separated within this session, and the reduced independence is recorded at each gate.

## Run stats

- Human touchpoints: 10+ dialogue turns
- Browser validation: Roomboard, Gallery, and Admin at desktop and mobile; post-convergence copy rechecked on Roomboard and Guided Inbox
- Impeccable audit: detector clean after redesign; participant-count and assignment-like residuals removed during convergence
- External integrations: none in initiation scope
