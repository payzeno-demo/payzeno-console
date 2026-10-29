/**
 * Admin route paths — the admin twin of `src/routes.ts`, and the only place an admin URL
 * literal is written. Paths are relative to the admin host's root (`http://admin.localhost/`).
 *
 *   ADMIN_ROUTES.*          absolute paths, for `<Link to>` and `navigate()`;
 *   ADMIN_ROUTE_PATTERNS.*  react-router patterns, for `<Route path>` in `AdminRouter.tsx` only.
 */
function seg(id: string): string {
  return encodeURIComponent(id);
}

export const ADMIN_ROUTES = {
  login: '/login',
  home: '/',
  merchants: {
    index: '/merchants',
    detail: (merchantId: string) => `/merchants/${seg(merchantId)}`,
  },
  reviews: {
    index: '/reviews',
    detail: (reviewId: string) => `/reviews/${seg(reviewId)}`,
  },
  disputes: { index: '/disputes' },
  settlements: { index: '/settlements' },
  support: { index: '/support' },
  emails: {
    index: '/emails',
    /** `?to=` is the lookup itself, so a support agent can paste the link into a ticket. */
    lookup: (address: string) => `/emails?to=${encodeURIComponent(address)}`,
  },
} as const;

export const ADMIN_ROUTE_PATTERNS = {
  login: '/login',
  home: '/',
  merchants: '/merchants',
  merchantDetail: ':merchantId',
  reviews: '/reviews',
  reviewDetail: ':reviewId',
  disputes: '/disputes',
  settlements: '/settlements',
  support: '/support',
  emails: '/emails',
  catchAll: '*',
} as const;
