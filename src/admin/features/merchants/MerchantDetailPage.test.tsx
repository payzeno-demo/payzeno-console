import { screen, waitFor, within } from '@testing-library/react';

import { AdminApp } from '../../AdminApp';
import { MOCK_MERCHANT_IDS } from '../../api/mock/admin-fixtures';
import { renderAdmin } from '../../test/renderAdmin';

const LUMEN = MOCK_MERCHANT_IDS.lumen;

function merchantIn(db: ReturnType<typeof renderAdmin>['db'], id: string) {
  const found = db.merchants.find((detail) => detail.merchant.id === id);
  if (!found) throw new Error(`fixture ${id} missing`);
  return found;
}

describe('MerchantDetailPage', () => {
  it('shows the application: profile, representative, documents, users and bank accounts', async () => {
    renderAdmin(<AdminApp />, { route: `/merchants/${LUMEN}`, role: 'risk' });

    expect(await screen.findByRole('heading', { level: 1, name: 'Lumen Print' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Business profile' })).toBeInTheDocument();
    expect(screen.getByText('Short-run art prints and posters, shipped flat.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Representative' })).toBeInTheDocument();
    expect(screen.getAllByText('Priya Lumen').length).toBeGreaterThan(0);

    const documents = screen.getByRole('table', { name: 'KYC documents the merchant uploaded' });
    expect(within(documents).getByText('passport-scan.pdf')).toBeInTheDocument();
    expect(within(documents).getByRole('link', { name: 'Open passport-scan.pdf in a new tab' })).toHaveAttribute(
      'href',
      `http://localhost/v1/admin/merchants/${LUMEN}/documents/kyc_01HZADMDOC000000000001/content`,
    );
    expect(within(documents).getByRole('link', { name: 'Download passport-scan.pdf' })).toHaveAttribute(
      'download',
      'passport-scan.pdf',
    );

    expect(screen.getByRole('table', { name: /People who can sign in/ })).toHaveTextContent('priya@lumenprint.example');
    expect(screen.getByRole('table', { name: 'Bank accounts payouts can go to' })).toHaveTextContent('Pennine Mutual');
  });

  it('approves a submitted application only after confirmation, then shows the result and refetches', async () => {
    const { user, db } = renderAdmin(<AdminApp />, { route: `/merchants/${LUMEN}`, role: 'risk' });

    await user.click(await screen.findByRole('button', { name: 'Approve onboarding' }));
    const dialog = await screen.findByRole('dialog', { name: 'Approve Lumen Print?' });
    expect(merchantIn(db, LUMEN).onboarding.state).toBe('submitted');

    await user.click(within(dialog).getByRole('button', { name: 'Approve onboarding' }));

    const outcome = await screen.findByTestId('action-outcome');
    expect(outcome).toHaveTextContent('Onboarding approved: Lumen Print');
    expect(outcome).toHaveTextContent('Merchant status is now Active');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    expect(merchantIn(db, LUMEN).onboarding.state).toBe('approved');
    expect(db.emails[0]).toMatchObject({ template: 'onboarding_approved', to: 'priya@lumenprint.example' });
    // The refetched detail drives the header: approve is no longer offered.
    await waitFor(() => expect(screen.getByRole('button', { name: 'Approve onboarding' })).toBeDisabled());
  });

  it('will not reject without a message to the merchant, and sends it when there is one', async () => {
    const { user, db } = renderAdmin(<AdminApp />, { route: `/merchants/${LUMEN}`, role: 'risk' });

    await user.click(await screen.findByRole('button', { name: 'Reject onboarding' }));
    const dialog = await screen.findByRole('dialog', { name: 'Reject Lumen Print?' });

    await user.click(within(dialog).getByRole('button', { name: 'Reject onboarding' }));
    expect(await within(dialog).findByText('Write the message the merchant will receive.')).toBeInTheDocument();
    expect(merchantIn(db, LUMEN).onboarding.state).toBe('submitted');

    await user.type(within(dialog).getByLabelText(/Message to the merchant/), 'We cannot support print-on-demand resale.');
    await user.click(within(dialog).getByRole('button', { name: 'Reject onboarding' }));

    expect(await screen.findByTestId('action-outcome')).toHaveTextContent('Onboarding rejected: Lumen Print');
    expect(merchantIn(db, LUMEN).onboarding).toMatchObject({
      state: 'rejected',
      staff_message: 'We cannot support print-on-demand resale.',
    });
    expect(merchantIn(db, LUMEN).merchant.status).toBe('rejected');
  });

  it('requests more information with a message', async () => {
    const { user, db } = renderAdmin(<AdminApp />, { route: `/merchants/${LUMEN}`, role: 'admin' });

    await user.click(await screen.findByRole('button', { name: 'Request more information' }));
    const dialog = await screen.findByRole('dialog', { name: 'Request more information from Lumen Print' });
    await user.type(within(dialog).getByLabelText(/Message to the merchant/), 'Upload a clearer passport scan.');
    await user.click(within(dialog).getByRole('button', { name: 'Send request' }));

    expect(await screen.findByTestId('action-outcome')).toHaveTextContent('More information requested');
    expect(merchantIn(db, LUMEN).onboarding.state).toBe('needs_info');
    expect(db.emails[0]?.template).toBe('onboarding_info_requested');
  });

  it('restricts an active merchant with an audited reason, and reactivates it', async () => {
    const { user, db } = renderAdmin(<AdminApp />, {
      route: `/merchants/${MOCK_MERCHANT_IDS.northwind}`,
      role: 'risk',
    });

    await user.click(await screen.findByRole('button', { name: 'Restrict merchant' }));
    let dialog = await screen.findByRole('dialog', { name: 'Restrict Northwind?' });
    await user.type(within(dialog).getByLabelText(/^Reason/), 'PAY-3001 chargeback spike');
    await user.click(within(dialog).getByRole('button', { name: 'Restrict merchant' }));

    expect(await screen.findByTestId('action-outcome')).toHaveTextContent('Merchant restricted: Northwind');
    expect(merchantIn(db, MOCK_MERCHANT_IDS.northwind).merchant.status).toBe('restricted');

    await waitFor(() => expect(screen.getByRole('button', { name: 'Reactivate merchant' })).toBeEnabled());
    await user.click(screen.getByRole('button', { name: 'Reactivate merchant' }));
    dialog = await screen.findByRole('dialog', { name: 'Reactivate Northwind?' });
    await user.type(within(dialog).getByLabelText(/^Reason/), 'Spike explained, refunds issued');
    await user.click(within(dialog).getByRole('button', { name: 'Reactivate merchant' }));

    await waitFor(() => expect(merchantIn(db, MOCK_MERCHANT_IDS.northwind).merchant.status).toBe('active'));
    expect(await screen.findByText('Merchant reactivated: Northwind', { selector: 'p' })).toBeInTheDocument();
  });

  it('lets a support agent read the merchant but not act, and says why', async () => {
    renderAdmin(<AdminApp />, { route: `/merchants/${LUMEN}`, role: 'support' });

    const approve = await screen.findByRole('button', { name: 'Approve onboarding' });
    expect(approve).toBeDisabled();
    expect(approve).toHaveAccessibleDescription('Needs the risk role.');
    expect(screen.getByRole('button', { name: 'Restrict merchant' })).toBeDisabled();
    expect(screen.getByText(/You can review this merchant but not act on it/)).toBeInTheDocument();
    // Support can jump to the owner's email history.
    expect(screen.getByRole('link', { name: 'Emails sent to priya@lumenprint.example' })).toHaveAttribute(
      'href',
      '/emails?to=priya%40lumenprint.example',
    );
  });

  it('shows the api error in the dialog when the api refuses', async () => {
    const { user, db } = renderAdmin(<AdminApp />, { route: `/merchants/${LUMEN}`, role: 'risk' });
    await screen.findByRole('heading', { level: 1, name: 'Lumen Print' });

    // Someone else decided while this page was open.
    merchantIn(db, LUMEN).onboarding.state = 'approved';

    await user.click(screen.getByRole('button', { name: 'Approve onboarding' }));
    const dialog = await screen.findByRole('dialog', { name: 'Approve Lumen Print?' });
    await user.click(within(dialog).getByRole('button', { name: 'Approve onboarding' }));

    expect(await within(dialog).findByText(/The application changed state since this page loaded/)).toBeInTheDocument();
  });
});
