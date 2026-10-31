import { screen, waitFor, within } from '@testing-library/react';

import { AdminApp } from '../../AdminApp';
import { renderAdmin } from '../../test/renderAdmin';

const DISPUTE = 'dp_01HZADMDISPUTE000000001';

describe('AdminDisputesPage', () => {
  it('lists disputes across merchants and filters by status from the URL', async () => {
    renderAdmin(<AdminApp />, { route: '/disputes?status=needs_response', role: 'risk' });

    const table = await screen.findByRole('table', { name: 'Disputes with status Needs Response' });
    await waitFor(() => expect(within(table).getAllByRole('row')).toHaveLength(3));
    expect(table).toHaveTextContent('mer_01HZADMNORTHWIND000001');
    expect(table).toHaveTextContent('mer_01HZADMORBITGAMES0004');
  });

  it('offers Accept only on a dispute that still needs a response', async () => {
    renderAdmin(<AdminApp />, { route: '/disputes', role: 'risk' });

    const table = await screen.findByRole('table', { name: 'Disputes across all merchants' });
    await waitFor(() => expect(within(table).getAllByRole('row')).toHaveLength(5));
    expect(within(table).getAllByRole('button', { name: /^Accept dispute/ })).toHaveLength(2);
  });

  it('accepts on the merchant’s behalf after confirmation', async () => {
    const { user, db } = renderAdmin(<AdminApp />, { route: '/disputes', role: 'risk' });

    await user.click(await screen.findByRole('button', { name: `Accept dispute ${DISPUTE} on the merchant's behalf` }));
    const dialog = await screen.findByRole('dialog', { name: `Accept dispute ${DISPUTE}?` });
    await user.click(within(dialog).getByRole('button', { name: 'Accept dispute' }));

    expect(await screen.findByTestId('action-outcome')).toHaveTextContent(`Dispute accepted: ${DISPUTE}`);
    expect(db.disputes.find((dispute) => dispute.id === DISPUTE)?.status).toBe('lost');
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: `Accept dispute ${DISPUTE} on the merchant's behalf` })).not.toBeInTheDocument(),
    );
  });
});
