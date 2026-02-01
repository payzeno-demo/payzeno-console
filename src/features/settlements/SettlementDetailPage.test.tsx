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

const BATCH_ID = 'sb_01HW0RTBATCH000000001';
const ROUTE = `/settlements/${BATCH_ID}`;
const PATTERN = '/settlements/:batchId';

function renderPage(route = ROUTE) {
  return renderWithProviders(<SettlementDetailPage />, { route, path: PATTERN });
}

describe('the batch header', () => {
  it('names the batch and its acquirer', async () => {
    renderPage();

    expect(
      await screen.findByRole('heading', { name: `Settlement ${BATCH_ID}` }),
    ).toBeInTheDocument();
    expect(screen.getByText(/worldflow · processing date 2026-03-13/)).toBeInTheDocument();
  });

  it('says the batch has not been funded when funded_at is null', async () => {
    renderPage();

    expect(await screen.findByText('Not funded yet')).toBeInTheDocument();
  });

  it('renders the not-found screen for a batch this merchant has no items in', async () => {
    server.use(errorHandler('get', '/settlements/:batchId', 404, 'not_found'));

    renderPage();

    expect(
      await screen.findByRole('heading', { name: 'No such settlement batch' }),
    ).toBeInTheDocument();
  });
});

describe('the totals panel (arc INC)', () => {
  it('renders posted alongside expected', async () => {
    renderPage();

    expect(await screen.findByText('Your totals in this batch')).toBeInTheDocument();
    expect(screen.getByText('Expected')).toBeInTheDocument();
    expect(screen.getByText('Posted')).toBeInTheDocument();
    expect(screen.getByText('Acquirer fees')).toBeInTheDocument();
    expect(screen.getByText('Variance')).toBeInTheDocument();
  });

  it('stays quiet while posted is within tolerance of expected', async () => {
    renderPage();

