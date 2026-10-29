import { screen, waitFor, within } from '@testing-library/react';

import { AdminApp } from '../../AdminApp';
import { renderAdmin } from '../../test/renderAdmin';

function table() {
  return screen.getByRole('table', { name: /Merchants|KYC decision/ });
}

describe('MerchantsPage', () => {
  it('lists every merchant with its status and onboarding state', async () => {
    renderAdmin(<AdminApp />, { route: '/merchants', role: 'support' });

    expect(await screen.findByRole('heading', { level: 1, name: 'Merchants' })).toBeInTheDocument();
    await waitFor(() => expect(within(table()).getAllByRole('row')).toHaveLength(6));
    const lumenRow = within(table()).getByRole('row', { name: /Lumen Print/ });
    expect(lumenRow).toHaveTextContent('Pending review');
    expect(lumenRow).toHaveTextContent('Submitted — awaiting review');
    expect(lumenRow).toHaveTextContent('priya@lumenprint.example');
  });

  it('filters from the URL, so the KYC queue is a link', async () => {
    renderAdmin(<AdminApp />, { route: '/merchants?onboarding_state=submitted', role: 'risk' });

    const queue = await screen.findByRole('table', { name: 'Merchants waiting for a KYC decision' });
    await waitFor(() => expect(within(queue).getAllByRole('row')).toHaveLength(2));
    expect(within(queue).getByText('Lumen Print')).toBeInTheDocument();
    expect(screen.getByText('1 filter active')).toBeInTheDocument();
  });

  it('searches by name, id or owner email', async () => {
    const { user } = renderAdmin(<AdminApp />, { route: '/merchants', role: 'admin' });

    await user.type(await screen.findByLabelText('Search'), 'orbitgames');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() => expect(within(table()).getAllByRole('row')).toHaveLength(2));
    expect(within(table()).getByText('Orbit Games')).toBeInTheDocument();
  });

  it('opens a merchant from its row', async () => {
    const { user } = renderAdmin(<AdminApp />, { route: '/merchants', role: 'admin' });

    await user.click(await screen.findByRole('button', { name: /Bramble Café/ }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Bramble Café' })).toBeInTheDocument();
    expect(screen.getByText('Please add a bank account in the business name before we can review.')).toBeInTheDocument();
  });
});
