/**
 * Route paths. The only place in the console where a URL literal is written.
 *
 * Two shapes live here and they are not interchangeable:
 *
 *   ROUTES.*        absolute paths, for `<Link to>`, `navigate()` and `<Navigate to>`.
 *   ROUTE_PATTERNS.* react-router patterns (`:chargeId`), for `<Route path>` in `router.tsx`.
 *
 * `router.tsx` is the only importer of `ROUTE_PATTERNS`; everything else imports `ROUTES`.
 * Keeping both in one file is what makes the pair drift-proof, and `src/router.test.tsx`
 * ("route helpers") renders the real table at paths built from `ROUTES` — so a builder that
 * stops matching its pattern fails there rather than in production.
 *
 * Owner: tflexbox. Touched by nearly every feature PR, which is why it is deliberately boring —
 * no dynamic segments beyond a single id, no query-string construction (that is
 * `useQueryParamState`), no conditional paths.
 */

/** Percent-encode an id before it goes into a path segment. */
function seg(id: string): string {
  return encodeURIComponent(id);
}

export const ROUTES = {
  root: '/',

  auth: {
    login: '/login',
  },

  reporting: {
    index: '/',
  },

  balance: {
    index: '/balance',
  },

  payments: {
    index: '/payments',
    detail: (paymentIntentId: string) => `/payments/${seg(paymentIntentId)}`,
  },

  charges: {
    index: '/charges',
    detail: (chargeId: string) => `/charges/${seg(chargeId)}`,
  },

  refunds: {
    index: '/refunds',
  },

  disputes: {
    index: '/disputes',
    detail: (disputeId: string) => `/disputes/${seg(disputeId)}`,
  },

  payouts: {
    index: '/payouts',
    detail: (payoutId: string) => `/payouts/${seg(payoutId)}`,
  },

  settlements: {
    index: '/settlements',
    detail: (batchId: string) => `/settlements/${seg(batchId)}`,
  },

  invoices: {
    index: '/invoices',
    detail: (invoiceId: string) => `/invoices/${seg(invoiceId)}`,
  },

  developers: {
    index: '/developers',
    apiKey: (apiKeyId: string) => `/developers/api-keys/${seg(apiKeyId)}`,
    webhookEvent: (eventId: string) => `/developers/webhook-events/${seg(eventId)}`,
  },

  settings: {
    index: '/settings',
  },

  notFound: '/404',
} as const;

/**
 * The `<Route path>` side of the same table.
 *
 * Detail routes are declared **relative** to their index route, because `router.tsx` nests them
 * as children (blueprint §0: "detail routes are registered as children of that index route").
 */
export const ROUTE_PATTERNS = {
  login: '/login',
  reporting: '/',
  balance: '/balance',

  payments: '/payments',
  paymentDetail: ':paymentIntentId',

  charges: '/charges',
  chargeDetail: ':chargeId',

  refunds: '/refunds',

  disputes: '/disputes',
  disputeDetail: ':disputeId',

  payouts: '/payouts',
  payoutDetail: ':payoutId',

  settlements: '/settlements',
  settlementDetail: ':batchId',

  invoices: '/invoices',
  invoiceDetail: ':invoiceId',

  developers: '/developers',
  apiKeyDetail: 'api-keys/:apiKeyId',
  webhookEventDetail: 'webhook-events/:eventId',

  settings: '/settings',

  catchAll: '*',
} as const;

/** Every top-level path, for the "is this a known route" check in `NotFoundPage`. */
export const TOP_LEVEL_PATHS: ReadonlyArray<string> = [
  ROUTES.reporting.index,
  ROUTES.balance.index,
  ROUTES.payments.index,
  ROUTES.charges.index,
  ROUTES.refunds.index,
  ROUTES.disputes.index,
  ROUTES.payouts.index,
  ROUTES.settlements.index,
  ROUTES.invoices.index,
  ROUTES.developers.index,
  ROUTES.settings.index,
];

