# payzeno-console

The merchant-facing dashboard. Everything a merchant can do without an API key happens here:
payments and charges, refunds, disputes, balance, payouts, settlements, invoices, API keys and
webhooks, reporting, and team settings.

Owned by **Web** (@tflexbox, @rrefactor). One approval to merge; two if you touch anything
under the PCI list in `CODEOWNERS` — that list is not negotiable, see ADR 0003.

---

## What this thing actually is

A React SPA. No SSR, no BFF, no server of our own. In production it is a directory of static
files behind nginx, and every byte of data on screen came from **payzeno-api** over HTTP or
over one WebSocket.

That has a few consequences worth internalising before your first PR:

- **There is exactly one transport.** `HttpTransport` in `src/api/transport.ts`, implemented by
  `ApiClient` (`src/api/client.ts`) and by `MockTransport` (`src/api/mock/mock-transport.ts`).
  `MockTransport` is production code, not a test helper — Sales demos on it.
- **There is exactly one `fetch()`** in the repo, in `src/api/http/fetch-transport.ts`. eslint
  fails the build if you add a second. If you need a request, you need an endpoint.
- **There is exactly one cache.** TanStack Query. No Redux, no Zustand, no context holding
  server data. If you are about to put a server response in `useState`, read ADR 0001 first.
- **We are not on the event bus.** The console emits nothing and consumes no queue. Our only
  push channel is a WebSocket client against `/ws/notifications`. Do not add an SQS client.
- **We do no money arithmetic.** `src/lib/money.ts` re-exports `@payzeno/contracts`. One
  implementation of `toMinor`/`applyBps` exists in this company and it is not in this repo.

The call path is deliberately boring and always the same:

```
router.tsx → <Feature>Page → feature component → use<Thing>()
           → <feature>.queries.ts → SomeEndpoint.method() → ApiClient.request()
           → http/* → fetch-transport
```

Nine layers, every feature, no exceptions. If your change makes a component call an endpoint
directly it will get sent back, not because it is wrong today but because the next person will
copy it.

---

## Running it

You need Node 20 and pnpm 9 (`corepack enable` handles both), and you need the **workspace
root** — `@payzeno/contracts` is a `workspace:*` dependency, so a lone clone of this repo
cannot install.

```sh
git clone git@github.com:payzeno/payzeno-workspace.git   # contracts + api + console
cd payzeno-workspace
pnpm install
pnpm --filter @payzeno/contracts build

cd payzeno-console
cp .env.example .env
pnpm dev                     # http://localhost:5173
```

`pnpm dev` proxies `/v1` and `/ws` to `localhost:8080`, so bring payzeno-api up first
(`cd ../payzeno-infrastructure && docker compose up payzeno-api`). The proxy exists because the
CSRF cookie `pz_csrf` has to stay first-party; hitting the API cross-origin gives you 403s on
every mutation and a very confusing afternoon.

### No backend? `pnpm dev:mock`

```sh
pnpm dev:mock                # or add ?mock=1 to any URL
```

`TransportProvider` swaps in `MockTransport`, which serves `src/api/mock/fixtures.ts` with
seeded latency so it looks alive. This is what Sales runs. **If you break `?mock=1` you will
find out from Sagi, at standup, in front of everyone.** There is one contract-mandated test
guarding it (`src/api/mock/mock-transport.test.ts`); please do not let it be the only one.

### The whole stack

```sh
cd payzeno-console
docker compose -f docker-compose.override.yml up --build
```

That extends the root compose service from payzeno-infrastructure, but widens the build
context to the workspace root — the root file's `context: ../payzeno-console` cannot resolve
`workspace:*`. Don't "fix" the root file; api has the same shape and infra owns it. PAY-1774.

---

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | vite dev server, proxying to a local api |
| `pnpm dev:mock` | the same app on `MockTransport`, no backend |
| `pnpm test` | vitest, jsdom, MSW-backed |
| `pnpm test:coverage` | the gate: 70% lines. Below it, CI is red |
| `pnpm lint` | eslint, `--max-warnings 0`. The layering rules live here |
| `pnpm typecheck` | `tsc --noEmit`, strict, `noUncheckedIndexedAccess` on |
| `pnpm build` | typecheck then vite build; enforces a 3.5 MiB asset budget in CI |
| `pnpm openapi:pull` | refresh the checked-in payzeno-api OpenAPI the contract test reads |

Tests are colocated (`usePayouts.ts` → `usePayouts.test.ts`). Hook tests go through MSW using
the handlers in `src/test/msw/handlers.ts` — one handler per real API route — and components
render through `src/test/render.tsx`. Use `renderWithProviders`; a bare `render()` will blow up
the moment the component touches a query, and rightly so.

---

## Configuration

Seven `VITE_*` variables, listed in `.env.example`, read in exactly one module:
`src/config/env.ts`. eslint bans `import.meta.env` everywhere else.

They are **build-time**. Changing one is a rebuild and a redeploy, not a restart, which is why
the deploy pipeline builds a separate image per environment. If you want a runtime knob, you
want a flag on payzeno-api, not a var here.

Two feature flags, both build-time, both read through `useFlag()` in `src/lib/flags.ts`:

| Flag | Default | Gates |
| --- | --- | --- |
| `settlement_explorer` | on | the settlements UI |
| `dispute_evidence_v2` | off (on in qa) | `EvidenceFormV2` |

A missing required var throws `EnvConfigError` from `main.tsx` before the first render. That is
intentional: a console that boots without an API URL renders an empty dashboard that looks like
a merchant with no payments, and we have had that support ticket already.

---

## Gotchas

Things that have cost someone a day. In rough order of how likely they are to cost you one.

**`src/api/legacy/` is still alive.** Four files that predate ADR 0004, with four real callers:
`features/invoices/*` and `features/settings/useUsers.ts` + `useInviteUser.ts`. Code in there
builds its own CSRF header, throws bare `Error` instead of a `ConsoleApiError`, and does not
participate in query invalidation. So: invoices don't refresh after a mutation elsewhere, and a
403 on the team tab renders the generic fallback instead of `<PermissionDenied />`. It is ~85%
migrated and has been for a while. Do not add a fifth caller. Do not copy the pattern.

**`lib/format.ts::formatAmount` is wrong for JPY.** It divides by 100 unconditionally. It
predates `lib/money.ts` and three files still import it (`SummaryCards`, `invoices.columns`,
`ExportCsvButton`), each with a TODO above the import. `lib/money.ts` is correct and tested;
`formatAmount` is not tested at all. New code uses `useMoneyFormat` / `lib/money.ts`.

**`DataTableProps.caption` is required and it is not decorative.** It is the table's accessible
name. `DataTable.test.tsx` asserts it. Passing `caption=""` to make TypeScript quiet is worse
than not having a table.

**Colours come from `components/ui/tokens.ts`.** A hex literal anywhere else is a review
rejection (ADR 0005). Yes, even in a chart. `charts/chart-theme.ts` reads the tokens.

**Never log a response body.** Not `console.debug`, not a Sentry breadcrumb, not "temporarily".
`config/telemetry.config.ts` carries a `beforeSend` denylist and a PAN regex, and
`http/response-parser.ts` had exactly one debug log in it once, briefly. ADR 0003.

**Card data never touches payzeno-api.** `TokenizedCardInput` posts straight to the vault at
`VITE_VAULT_PUBLIC_URL` and gets a `pmt_…` token back. Same for bank accounts in
`AddBankAccountDialog`. If you find yourself putting a PAN in a request to `/v1/…`, stop.

**`409 settlement_locked` is not an error.** In `useRetrySettlementItem` it means a sweep got
there first — show "already being settled", refetch, no toast. It has been the normal outcome
of a manual retry since PAY-2043.

**Idempotency keys are per attempt, not per call.** `ApiClient` mints a ULID for each mutation
attempt and reuses it across its own transport retries. A user clicking Refund twice is two
attempts and two keys; a 503 retried inside the client is one.

**`router.tsx` is touched by every feature PR.** Expect a conflict, rebase, don't merge blind.

**Dead files exist on purpose-ish.** `api/endpoints/statements.endpoint.ts` (route moved to the
ledger), `features/settlements/components/SettlementExportPanel.tsx`, `hooks/useLocalStorage.ts`
and `lib/sort.ts::multiSort` have zero importers. They are on the list. Deleting one is a fine
PR; deleting one *inside* a feature PR is not.

---

## Where things live

```
src/
  app/            composition root — providers, transport selection, route guards
  api/            transport, endpoints, errors, query keys, ws client, mock, legacy debt
  components/     ui/ layout/ data/ feedback/ form/ charts/   — presentational only
  features/<f>/   <F>Page, DetailPage, components/, use*.ts, <f>.queries.ts, <f>.columns.tsx
  config/         env.ts (the only import.meta.env reader), runtime, constants, telemetry
  hooks/          cross-cutting hooks only — anything that fetches lives in its feature
  lib/            money (re-export), date, csv, flags, format, ids, telemetry
  types/          view models — these only ever `extends` a @payzeno/contracts type
  test/           setup, MSW handlers/server, renderWithProviders, factories
docs/adr/         the five decisions that explain most of the rules above
docs/runbooks/    console.md — what to do when the dashboard is white
```

Read `docs/adr/` before arguing with a rule; there is a decent chance the argument already
happened in a PR thread two years ago and lost.
