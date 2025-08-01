# Contributing to payzeno-console

Short version: branch, small PR, green CI, one approval, squash. The rest of this file is the
part people get wrong.

## Branches and commits

```
<type>/PAY-<num>-<slug>          feat/PAY-1841-settlement-retry
```

Conventional commits, scoped to the area you touched:

```
feat(settlements): surface batch totals on the detail page
fix(a11y): label the merchant switcher
refactor(payouts): extract usePayoutFilters
chore(deps): bump @payzeno/contracts to 3.4.0
```

PR titles include the ticket key. No ticket, no PR — file one, Sagi would rather have a
one-line ticket than none.

## Adding a feature

Every feature has the same five slots. Follow them even when it feels like overkill for two
fields — uniformity here is the only reason the codebase is navigable at 260 files.

```
features/<f>/
  <F>Page.tsx              route element. Layout and section components. No data logic.
  <Resource>DetailPage.tsx child route, registered under the index route in router.tsx
  components/*.tsx         presentational. Take rows and props. Never fetch.
  use<Thing>.ts            the hook. Wraps a queryOptions factory.
  <f>.queries.ts           the ONLY caller of an endpoint in the feature
  <f>.columns.tsx          ColumnDef<TRow>[]
  <f>.selectors.ts         contract type -> view model, where a mapping genuinely exists
```

Then register the route in `src/router.tsx` and the path constant in `src/routes.ts`. A URL
literal outside `routes.ts` is a review comment every time.

## Adding an API call

1. Add the method to the endpoint class in `src/api/endpoints/`. Ten of them extend
   `ResourceEndpoint<TResource, TListQuery>`; four (`auth`, `balance`, `reporting`,
   `webhook-endpoints`) are plain classes because they have no list/get pair. Do not force
   those under the base class to make the hierarchy look tidy.
2. Add a key to `src/api/queryKeys.ts`. Every invalidation site reads from there.
3. Add a `queryOptions` / mutation factory to `<f>.queries.ts`.
4. Add an MSW handler in `src/test/msw/handlers.ts` — one per real route.
5. Write the hook test. MSW-backed, not a mocked module.

If the route is new on payzeno-api too, `pnpm openapi:pull` and commit the refreshed document,
or `src/api/contract/routes.contract.test.ts` will fail and it will be right to.

