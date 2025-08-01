/**
 * The one route table.
 *
 * Every feature adds exactly one line here, which is why this file has the highest commit
 * count in the repo and why it is deliberately flat: a `<Route>` element, a guard, a lazy
 * import. No data loading, no `loader`, no `action` — TanStack Query owns the cache (ADR 0001)
 * and a react-router loader would be a second one.
 *
 * Shape, per blueprint §0: each feature has exactly one `<Feature>Page`, registered as the
 * feature's *index* route, and its detail pages are registered as **children** of it. The
