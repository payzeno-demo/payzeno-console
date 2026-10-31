import { screen, waitFor, within } from '@testing-library/react';

import { recordRequests } from '@/test/msw/server';

import { AdminApp } from '../../AdminApp';
import { renderAdmin } from '../../test/renderAdmin';

describe('AdminHomePage', () => {
  it('counts every queue for an admin, each linking to its filtered list', async () => {
    renderAdmin(<AdminApp />, { route: '/', role: 'admin' });

    const kyc = await screen.findByTestId('overview-pending-kyc');
    await waitFor(() => expect(kyc).toHaveTextContent('Pending KYC1'));
    expect(within(kyc).getByRole('link', { name: 'Review applications' })).toHaveAttribute(
      'href',
      '/merchants?onboarding_state=submitted',
    );

    await waitFor(() => expect(screen.getByTestId('overview-open-reviews')).toHaveTextContent('3'));
    await waitFor(() =>
      expect(screen.getByTestId('overview-disputes-needing-response')).toHaveTextContent('2'),
    );
    expect(
      within(screen.getByTestId('overview-disputes-needing-response')).getByRole('link', { name: 'See disputes' }),
    ).toHaveAttribute('href', '/disputes?status=needs_response');
    await waitFor(() => expect(screen.getByTestId('overview-settlement-backlog')).toHaveTextContent('3'));
    await waitFor(() => expect(screen.getByTestId('overview-open-support-tasks')).toHaveTextContent('2'));
  });

  it('shows a support agent only the queues they can open, and asks for nothing else', async () => {
    const recorder = recordRequests();
    renderAdmin(<AdminApp />, { route: '/', role: 'support' });

    await waitFor(() => expect(screen.getByTestId('overview-open-support-tasks')).toHaveTextContent('2'));
    expect(screen.getByTestId('overview-pending-kyc')).toBeInTheDocument();
    expect(screen.queryByTestId('overview-open-reviews')).not.toBeInTheDocument();
    expect(screen.queryByTestId('overview-settlement-backlog')).not.toBeInTheDocument();

    const paths = recorder.requests.map((request) => new URL(request.url).pathname);
    expect(paths).not.toContain('/v1/admin/reviews');
    expect(paths).not.toContain('/v1/admin/disputes');
    expect(paths).not.toContain('/v1/admin/settlements/backlog');
    recorder.stop();
  });
});
