import { screen, waitFor, within } from '@testing-library/react';

import { AdminApp } from '../../AdminApp';
import { renderAdmin } from '../../test/renderAdmin';

const REVIEW = 'rv_01HZADMREVIEW0000000001';

describe('ReviewDetailPage', () => {
  it('lays out the rules, score, countries and amount', async () => {
    renderAdmin(<AdminApp />, { route: `/reviews/${REVIEW}`, role: 'risk' });

    expect(await screen.findByRole('heading', { level: 1, name: `Review ${REVIEW}` })).toBeInTheDocument();
    const signals = screen.getByRole('region', { name: 'Risk signals' });
    expect(signals).toHaveTextContent(/Acquirer risk score\s*78/);
    expect(signals).toHaveTextContent(/Shopper country vs card country\s*NG \/ GB\s*Mismatch/);
    expect(screen.getByRole('heading', { level: 2, name: 'Rules that fired' })).toBeInTheDocument();
    expect(screen.getByText('Card country ≠ shopper country')).toBeInTheDocument();
    expect(screen.getByText('The acquirer scored this authorisation as risky.')).toBeInTheDocument();
  });

  it('approves with a note after confirmation, and the review closes', async () => {
    const { user, db } = renderAdmin(<AdminApp />, { route: `/reviews/${REVIEW}`, role: 'risk' });

    await user.click(await screen.findByRole('button', { name: 'Approve payment' }));
    const dialog = await screen.findByRole('dialog', { name: 'Approve this payment?' });
    await user.type(within(dialog).getByLabelText(/^Note/), 'Known customer');
    await user.click(within(dialog).getByRole('button', { name: 'Approve payment' }));

    expect(await screen.findByTestId('action-outcome')).toHaveTextContent('Payment approved');
    expect(db.reviews.find((review) => review.id === REVIEW)).toMatchObject({
      status: 'approved',
      note: 'Known customer',
      closed_by: 'stf_01HZRISK00000000000001',
    });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Approve payment' })).toBeDisabled());
    expect(screen.getByText('This review is already approved.')).toBeInTheDocument();
  });

  it('declines without a note', async () => {
    const { user, db } = renderAdmin(<AdminApp />, { route: `/reviews/${REVIEW}`, role: 'admin' });

    await user.click(await screen.findByRole('button', { name: 'Decline payment' }));
    const dialog = await screen.findByRole('dialog', { name: 'Decline this payment?' });
    await user.click(within(dialog).getByRole('button', { name: 'Decline payment' }));

    expect(await screen.findByTestId('action-outcome')).toHaveTextContent('Payment declined');
    expect(db.reviews.find((review) => review.id === REVIEW)?.status).toBe('declined');
  });

  it('opens from the queue', async () => {
    const { user } = renderAdmin(<AdminApp />, { route: '/reviews', role: 'risk' });

    await user.click(await screen.findByRole('button', { name: REVIEW }));
    expect(await screen.findByRole('heading', { level: 1, name: `Review ${REVIEW}` })).toBeInTheDocument();
  });

  it('says so when the review does not exist', async () => {
    renderAdmin(<AdminApp />, { route: '/reviews/rv_nope', role: 'risk' });

    expect(await screen.findByText('We could not load this review')).toBeInTheDocument();
  });
});
