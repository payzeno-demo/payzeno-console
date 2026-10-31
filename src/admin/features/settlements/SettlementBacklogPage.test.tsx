import { screen, waitFor, within } from '@testing-library/react';

import { AdminApp } from '../../AdminApp';
import { renderAdmin } from '../../test/renderAdmin';

const ITEM = 'ri_01HZADMITEM00000000001';
const BATCH = 'sb_01HZADMBATCH000000001';

describe('SettlementBacklogPage', () => {
  it('summarises the backlog and lists the items', async () => {
    renderAdmin(<AdminApp />, { route: '/settlements', role: 'finance' });

    expect(await screen.findByRole('heading', { level: 1, name: 'Settlements' })).toBeInTheDocument();
    const summary = screen.getByRole('region', { name: 'Backlog summary' });
    expect(summary).toHaveTextContent(/Retryable\s*2/);
    expect(summary).toHaveTextContent(/Orphaned\s*1/);
    expect(screen.getByRole('table', { name: /Backlog per settlement batch/ })).toHaveTextContent(BATCH);
    expect(screen.getByRole('table', { name: 'Reconciliation items waiting to settle' })).toHaveTextContent(ITEM);
  });

  it('retries an item, and treats a second retry racing the sweep as already being settled', async () => {
    const { user, db } = renderAdmin(<AdminApp />, { route: '/settlements', role: 'finance' });

    await user.click(await screen.findByRole('button', { name: `Retry item ${ITEM}` }));
    let dialog = await screen.findByRole('dialog', { name: `Retry ${ITEM}?` });
    await user.click(within(dialog).getByRole('button', { name: 'Retry item' }));

    expect(await screen.findByTestId('action-outcome')).toHaveTextContent(`Retry queued for ${ITEM}`);
    expect(db.backlog.items?.find((item) => item.id === ITEM)?.status).toBe('settling');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    // A settling item has no row button any more; the by-id form still reaches the route.
    await user.type(screen.getByLabelText(/^Batch id/), BATCH);
    await user.type(screen.getByLabelText(/^Item id/), ITEM);
    await user.type(screen.getByLabelText(/^Merchant id/), 'mer_01HZADMNORTHWIND000001');
    await user.click(screen.getByRole('button', { name: 'Retry item' }));
    dialog = await screen.findByRole('dialog', { name: `Retry ${ITEM}?` });
    await user.click(within(dialog).getByRole('button', { name: 'Retry item' }));

    await waitFor(() =>
      expect(screen.getByTestId('action-outcome')).toHaveTextContent(`Already being settled: ${ITEM}`),
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('lets an admin retry, since admin passes every role check', async () => {
    renderAdmin(<AdminApp />, { route: '/settlements', role: 'admin' });
    expect(await screen.findByRole('button', { name: `Retry item ${ITEM}` })).toBeEnabled();
  });
});
