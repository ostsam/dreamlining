# Dreamlining initiation research dossier

## First-hand problem

The client’s event used one long Google Doc for drafting and commenting. The reported failures are ergonomic friction, janky comment interaction, and position bias: people nearer the top receive more attention. This is the primary evidence for a dedicated session runner. It is a qualitative report, not a population estimate; the first pilot should measure completion, feedback distribution, and perceived fairness.

## Comparable interaction patterns

- **SessionLab** treats a session as an ordered set of timed blocks, pages, and forms, with reusable templates and a clear agenda. That supports our phase-based facilitator model, but it is a planning tool rather than a live peer-feedback room. [SessionLab session planner](https://help.sessionlab.com/en/articles/4472935-session-planner-overview)
- **Miro** explicitly recommends time-boxing workshop activities and provides facilitator controls, timers, voting, and participant progress. That validates visible phase control, but a freeform canvas still leaves attention allocation to the room. [Miro workshops and meetings](https://help.miro.com/hc/en-us/articles/360012753200-Miro-for-workshops-meetings), [Miro voting](https://help.miro.com/hc/en-us/articles/360017572274-Voting)
- **Mentimeter** supports open-ended text responses, multiple responses, moderation, and voting on responses. That validates concise response capture and moderation affordances, but it does not solve equitable person-level feedback coverage. [Mentimeter open-ended slides](https://help.mentimeter.com/en/articles/410470-how-to-use-open-ended-slides)

## Fairness and routing

Recommendation systems commonly amplify popularity: frequently interacted-with items receive more exposure, which can create a self-reinforcing loop. The relevant design lesson is not “make every item identical”; it is to measure exposure/interactions and deliberately give under-exposed items chances to be seen. [The Unfairness of Popularity Bias in Recommendation](https://arxiv.org/abs/1907.13286), [Multi-sided Exposure Bias in Recommendation](https://arxiv.org/abs/2006.15772)

Dreamlining applies that lesson narrowly:

1. Initial recommendations use balanced randomization and per-viewer tie-breaking, rather than document order.
2. Once activity exists, distinct-commenter coverage becomes the primary priority signal.
3. Impression count and whether the viewer has already seen an entry break ties.
4. Participants can always browse manually; the router is a nudge, not an access gate.
5. Popularity counts remain hidden from participants. Facilitators see coverage aggregates only.

The metric to validate is distribution of distinct commenters per submitted dreamline, not raw comment volume. Private comments count toward coverage while remaining private.

## Operating constraints

- Join should work from a QR code or short link with no account creation.
- A facilitator needs an explicit agenda, timer, readiness view, phase controls, late-join handling, and a recoverable close.
- The product must work on phone and computer widths, with keyboard and screen-reader support.
- Session state needs reconnect-safe persistence and a 30-day deletion policy.
- The admin surface is a trusted local-event control plane, not a multi-tenant identity system.

## Unknowns to measure

- How many entries participants can write before quality collapses.
- Whether 3 distinct commenters is the right “healthy coverage” reference for rooms of 10, 30, and 50.
- How often participants want to return to a seen-but-uncommented entry.
- Whether a private comment needs a separate notification or simply appears in the owner’s inbox.
- Whether participants understand the contact-request consent language.
