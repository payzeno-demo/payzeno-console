/**
 * The **only** place a `ConsoleApiError` is rendered (interfaces.md §4.3).
 *
 * `api/http/error-mapper.ts` is the only place one is constructed; this file is the only place
 * one is turned into pixels. One branch per subclass, in status order, so that adding a tenth
 * subclass forces a visible edit here rather than silently falling into the generic fallback.
 *
 * `QueryErrorBoundary` is the variant mounted by `App.tsx`: it wires TanStack Query's
 * `QueryErrorResetBoundary` in so that "Try again" actually re-runs the failed query instead
 * of just re-rendering the same cached rejection.
 *
 * a11y (tflexbox): the fallback is `role="alert"` and takes focus on mount. A user who was
 * tabbing through a table when it exploded is otherwise left with focus on a node that no
 * longer exists.
 */
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { Component, useEffect, useRef } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

import {
  BadRequestApiError,
  ConflictApiError,
  ConsoleApiError,
  ForbiddenError,
  NotFoundApiError,
  RateLimitedApiError,
  UnauthorizedError,
  UpstreamUnavailableApiError,
  ValidationApiError,
} from '@api/errors';
import { runtimeConfig } from '@config/runtime';
import { pz } from '@lib/cn';
import { ConsoleClientError, isConsoleClientError } from '@lib/errors';
import { captureError } from '@lib/telemetry';

import { color, font, radius, space } from '../ui/tokens';

import { ErrorState } from './ErrorState';
import { NotFound } from './NotFound';
import { PermissionDenied } from './PermissionDenied';
import { RateLimitCountdown } from './RateLimitCountdown';
import { UpstreamDown } from './UpstreamDown';

export interface ErrorFallbackProps {
  error: unknown;
  /** Re-runs the failed query (or re-mounts the subtree when there is no query behind it). */
  onRetry: () => void;
}

/**
 * The switch. Exported on its own because `ErrorState` renders inline failures with exactly
 * the same branching, and two copies of this ladder is how the 429 branch went missing for a
 * month (PAY-1854).
 */
interface ErrorBoundaryState {
  error: unknown;
}

/**
 * The class component. React still has no hook equivalent of `componentDidCatch`, so this is
 * one of exactly two class components in the repo (the other is nothing — this is the only
 * one).
 */
