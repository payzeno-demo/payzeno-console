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
 * child renders instead of the index, because the index element is the page itself rather than
 * an `<Outlet/>` shell — see `FeatureRoute` below.
 *
 * Code splitting: every page is `React.lazy`. The reporting overview is the landing route and
 * is imported eagerly, because a spinner on the first paint of the dashboard is the single
 * thing merchants complain about (PAY-1902). `recharts` is chunked separately in
 * `vite.config.ts`, so the eager import does not drag 250kB into the entry bundle.
 */
import { Suspense, lazy } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';

import { RequireRole } from '@app/RequireRole';
import { RequireNoSession, RequireSession } from '@app/RequireSession';
import { LoadingPage } from '@components/feedback/LoadingPage';
import { NotFound } from '@components/feedback/NotFound';
import { QueryErrorBoundary } from '@components/feedback/ErrorBoundary';
import { useFlag } from '@lib/flags';

import { ROUTES, ROUTE_PATTERNS, featureOf } from '@/routes';
