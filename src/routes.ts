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
