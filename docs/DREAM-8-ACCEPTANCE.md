# DREAM-8 acceptance evidence

This is the foundation-only evidence map. `not-applicable` is intentional and
does not claim the later domain behavior is implemented.

| ID | Status | Owner / evidence |
|---|---|---|
| AC-1 | not-applicable | DREAM-10; no join route in foundation |
| AC-2 | not-applicable | DREAM-10; no participant UI in foundation |
| AC-3 | not-applicable | DREAM-14; no domain editor |
| AC-4 | not-applicable | DREAM-14/23; no draft store |
| AC-5 | not-applicable | DREAM-14/24; no participant UI |
| AC-6 | not-applicable | DREAM-9; no domain rows |
| AC-7 | not-applicable | DREAM-9/10; no session route |
| AC-8 | not-applicable | DREAM-14; no submit action |
| AC-9 | not-applicable | DREAM-18; no browse route |
| AC-10 | not-applicable | DREAM-16; generic seed harness only in `test/router` |
| AC-11 | not-applicable | DREAM-16; no router implementation |
| AC-12 | not-applicable | DREAM-16; no router implementation |
| AC-13 | not-applicable | DREAM-18; no view-history route |
| AC-14 | not-applicable | DREAM-18/25; no domain authorization |
| AC-15 | not-applicable | DREAM-17; no comment composer |
| AC-16 | not-applicable | DREAM-17/21; no comment repository |
| AC-17 | not-applicable | DREAM-21/25; no admin moderation route |
| AC-18 | not-applicable | DREAM-21; no report action |
| AC-19 | not-applicable | DREAM-20/21; no contact repository |
| AC-20 | not-applicable | DREAM-20; no grant action |
| AC-21 | not-applicable | DREAM-20/25; no contact route |
| AC-22 | not-applicable | DREAM-20; no contact UI |
| AC-23 | not-applicable | DREAM-19; no commitment action |
| AC-24 | not-applicable | DREAM-19/20; no closing wall |
| AC-25 | not-applicable | DREAM-20/28; no recap route |
| AC-26 | not-applicable | DREAM-15; no admin route |
| AC-27 | not-applicable | DREAM-15/25; server-only boundary is covered, auth is later |
| AC-28 | not-applicable | DREAM-15; no admin dashboard |
| AC-29 | passed | Pure join URL and injected encoder seam in `src/server/qr.ts`, `test/unit/qr.test.ts` |
| AC-30 | passed | Encoder receives only validated join URL in `test/unit/qr.test.ts` |
| AC-31 | not-applicable | DREAM-15/26/29; no scanner/device proof |
| AC-32 | not-applicable | DREAM-11; no phase state machine |
| AC-33 | not-applicable | DREAM-12; no participant identity service |
| AC-34 | not-applicable | DREAM-11/14; no editing flow |
| AC-35 | not-applicable | DREAM-21; no report queue |
| AC-36 | not-applicable | DREAM-21/25; no admin audit domain |
| AC-37 | not-applicable | DREAM-16; no recommendation metrics |
| AC-38 | not-applicable | DREAM-17/21; no private feedback domain |
| AC-39 | not-applicable | DREAM-16/18; no participant surface |
| AC-40 | passed | Lazy server-only pooled client in `db/client.ts`; direct migration reader in `src/config/env-schema.ts`; no canonical tables until DREAM-9 |
| AC-41 | passed | Pooled/direct URL-kind and paired-endpoint preflight in `src/config/neon-url.ts`, with boundary tests in `test/unit/env-schema.test.ts` |
| AC-42 | not-applicable | DREAM-20/28; no retention route |
| AC-43 | not-applicable | DREAM-24; no domain UI |
| AC-44 | passed | Hermetic redacted bounded runner and deterministic primitives in `scripts/lib/`, `scripts/check.mjs`, and `test/unit/runner.test.ts` |

Foundation command evidence is recorded in the DREAM-8 Lattice handoff
comment. Provider and browser evidence is intentionally explicit: absent
provider opt-in is skipped; missing browser binaries are failed with an
install command (`bunx playwright install chromium webkit`); `DREAM_SKIP_BROWSER=1`
is a non-passing skip.
