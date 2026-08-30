# Dreamlining Tone run state

## Current position

- Stage: `tone-initiation → tone-prototype` (provisional exploration)
- Phase: `4 — stories review / human approval; provisional prototype divergence prepared`
- Product hypothesis: a browser-based, facilitator-led session runner for a roughly 50-person social circle; participants may use phones or computers.
- Current task: `DREAM-1`
- Next stage: `tone-prototype`, after the client approves this product definition.
- Visual register: product UI; welcoming, communal, lightly playful; pure-white canvas with indigo primary and coral invitation accents; WCAG 2.2 AA target.
- Working contract drafts now exist at `DESIGN.md`, `EVALUATION.md`, `SPEC.md`, and `BUILDPLAN.md`; they remain non-binding until the client selects/drives a visual direction and approves the architecture contract.

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

- Client approved the core open-browsing/adaptive-router direction, no-account entry, private comments only when reported, Neon, and the admin surface through dialogue on 2026-08-30.
- Product-definition artifacts are being authored now. Client review is still required before `DREAM-1` can move to done and before `DREAM-3` prototype discovery starts.
- Three participant prototype takes plus the admin control-room and admin-arrival boundary takes have been drafted under `prototypes/` to make the interaction assumptions tangible. They carry persistent `PROTOTYPE` labels and must not be treated as the binding design until the client reviews and chooses a direction.
- Agent-seat interruption: implementation/research subagents hit the host usage limit. The orchestrator is completing synthesis locally; a fresh cold review remains an explicit follow-up gate.

## Run stats

- Human touchpoints: 5+ dialogue turns
- Research agents attempted: 3 (interrupted by host usage limit)
- Product implementation agent: interrupted by host usage limit
- External integrations: none in initiation scope
