/**
 * `SettlementDetailPage` — the arc-INC screen.
 *
 * This is where the incident became visible to a merchant, and it is the deepest chain in the
 * repo (blueprint §3.2, nine `CALLS` levels from the route element to the fetch seam). Three
 * things landed here in the month-9 commit and all three are asserted below:
 *  - `<BatchTotalsPanel/>`, which puts posted against expected;
 *  - `<DuplicateBadge/>` on items that settled after more than one attempt;
 *  - the `409 settlement_locked` no-op on `<RetryItemButton/>`.
 */
import { describe, expect, it } from 'vitest';

import { SettlementDetailPage } from '@features/settlements/SettlementDetailPage';
import {
  makePage,
  makeReconciliationItem,
  makeSettlementBatch,
  makeViewerSession,
} from '@/test/factories';
import { errorHandler, server, url } from '@/test/msw/server';
import { renderWithProviders, screen, waitFor } from '@/test/render';

import { HttpResponse, http } from 'msw';

