import { screen, waitFor, within } from '@testing-library/react';

import { AdminApp } from '../../AdminApp';
import { renderAdmin } from '../../test/renderAdmin';

describe('EmailLookupPage', () => {
  it('asks for an address before looking anything up', async () => {
    renderAdmin(<AdminApp />, { route: '/emails', role: 'support' });

    expect(await screen.findByText('Enter an address')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('lists what Payzeno sent to an address, with delivery status', async () => {
    const { user } = renderAdmin(<AdminApp />, { route: '/emails', role: 'support' });

    await user.type(await screen.findByLabelText(/^Email address/), 'ops@orbitgames.example');
    await user.click(screen.getByRole('button', { name: 'Look up' }));

    const table = await screen.findByRole('table', { name: 'Emails sent to ops@orbitgames.example' });
    await waitFor(() => expect(within(table).getAllByRole('row')).toHaveLength(2));
    expect(table).toHaveTextContent('A payout to your bank account failed');
    expect(table).toHaveTextContent('Failed');
  });

  it('reads the address from the link a merchant page hands over', async () => {
    renderAdmin(<AdminApp />, { route: '/emails?to=priya%40lumenprint.example', role: 'admin' });

    const table = await screen.findByRole('table', { name: 'Emails sent to priya@lumenprint.example' });
    await waitFor(() => expect(table).toHaveTextContent('Verify your email for Payzeno'));
  });

  it('says so when nothing was sent', async () => {
    renderAdmin(<AdminApp />, { route: '/emails?to=nobody%40example.com', role: 'support' });

    expect(await screen.findByText('Payzeno has not emailed nobody@example.com.')).toBeInTheDocument();
  });
});
