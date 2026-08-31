# Dreamlining

Dreamlining is a private, browser-based session runner for a facilitated group
to turn dreams into momentum. The product contract and build sequence live in
`SPEC.md`, `EVALUATION.md`, and `BUILDPLAN.md`; the implementation begins with
DREAM-8's shared foundation.

## Local prerequisites

- Node.js 20.19.x or newer compatible Node 20 (see `.node-version`)
- Bun 1.3.4
- A disposable, non-default Neon child branch for any database I/O

Install with the frozen lockfile:

```bash
bun install --frozen-lockfile
```

## Environment scopes

Application traffic reads only a pooled `DATABASE_URL`. Migrations read only
the direct `DATABASE_URL_UNPOOLED`, and I/O-capable migration/full-test paths
also require provider-authenticated `NEON_PROJECT_ID`, `NEON_BRANCH`, and
`NEON_API_KEY`. `NEON_API_KEY` is sent only as an HTTPS REST `Authorization:
Bearer` header and is never a command argument or artifact. `APP_ORIGIN`, the
versioned scrypt `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`, base64
32-byte `CONTACT_ENCRYPTION_KEY`, and `MAINTENANCE_SECRET` are server-only.
See `.env.example` for the shape (never commit a real `.env` file).

Neon URLs must use `postgres:` or `postgresql:`, credentials, a database path,
an `ep-...` host under `.neon.tech`, no fragment, no port or port 5432, and
exactly `sslmode=require` plus `channel_binding=require`. A `-pooler` endpoint
is pooled; the same normalized endpoint ID and database name must be present in
the direct URL. Provider preflight additionally proves both endpoints belong
to the same ready, non-default project branch.

`NEON_BRANCH_SOURCE=injected` exists only for pure unit-test fixtures. It never
authorizes a database, migration, application server, browser, or network
request. `db:migrate` and provider-enabled `test:full` always resolve branch
and endpoint metadata through Neon REST API v2 before spawning I/O.

## Commands

```bash
bun run dev             # local development server
bun run build           # production build
bun run start           # production server
bun run format:check    # Prettier check
bun run typecheck       # TypeScript check
bun run lint            # ESLint
bun run check           # hermetic <=60s parallel fast shards
bun run db:generate     # offline schema-only Drizzle generation
bun run db:migrate      # guarded provider migration
bun run test:unit       # foundation primitives
bun run test:router     # generic harness; DREAM-16 is not applicable here
bun run test:security   # boundaries/redaction; domain checks are later tasks
bun run test:full       # production/browser/provider slots
```

Raw `drizzle-kit migrate` is unsupported because it bypasses the mandatory
non-default branch and endpoint-pair guard. `db:generate` intentionally reads
no database URL, provider metadata, or app secret and makes no network call.

The fast `check` command strips the database/provider/app key set before
launching children. It records `branchResolution: "not-run"`. Child output is
redacted and bounded before console forwarding or writing `artifacts/**`;
artifacts are ignored by Git. Child process trees have a monotonic 60-second
deadline, bounded termination grace, and deterministic timeout status 124.

Optional provider slots are `skipped` only without explicit
`DREAM_PROVIDER=neon`; an explicit provider opt-in fails for missing
credentials, metadata, lookup, default-branch, or endpoint mismatch. The full
browser slot checks Chromium, Firefox, and WebKit executables first. Missing
browsers are a failed `browser-missing` slot with exit code 2 and:

```bash
bunx playwright install chromium firefox webkit
```

`DREAM_SKIP_BROWSER=1` is an explicit local escape hatch, but records a
non-passing skip and exits nonzero. CI installs browsers only in its full-test
job. Foundation tests deliberately do not claim participant, admin, router,
contact, or other domain acceptance criteria; those begin with DREAM-9 onward.

## Neon branch workflow

Create a disposable child branch from the linked Neon project before any
provider-enabled work, set the two URL variables to its pooled/direct endpoint
pair, and set `NEON_BRANCH` to its provider name. Review `neon diff` before
applying migrations. The local `neon.ts` policy expires new non-default
branches after seven days. Never use the linked default/production branch as a
test target.
