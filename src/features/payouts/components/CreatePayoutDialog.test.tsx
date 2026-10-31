/**
 * `CreatePayoutDialog` — RFC platform-v2 §7: a balance can be paid to an account in another
 * currency, and the dialog says the ledger will convert before the merchant commits.
 */
import { HttpResponse, http } from 'msw';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { CreatePayoutDialog } from '@features/payouts/components/CreatePayoutDialog';
import { makeBankAccount, makePage } from '@/test/factories';
import { server, url } from '@/test/msw/server';
import { configure, renderWithProviders, screen, waitFor, within } from '@/test/render';

// Page tests here wait on several MSW round trips; on a loaded CI box the default 1s async
// window is not enough, and a flake that only appears under load teaches people to re-run.
// Set at module scope: a test's timeout is fixed when `it` registers it.
vi.setConfig({ testTimeout: 30_000 });
beforeAll(() => {
  configure({ asyncUtilTimeout: 5_000 });
});
afterAll(() => {
  configure({ asyncUtilTimeout: 1_000 });
  vi.resetConfig();
});

function serveAccounts(...accounts: ReturnType<typeof makeBankAccount>[]) {
  server.use(http.get(url('/bank-accounts'), () => HttpResponse.json(makePage(accounts))));
}

describe('choosing an account', () => {
  it('offers accounts in other currencies and explains the conversion', async () => {
    serveAccounts(
      makeBankAccount({
        id: 'ba_eur',
        currency: 'EUR',
        scheme: 'iban',
        bank_name: 'Rheinland Handelsbank',
        status: 'validated',
        is_default: true,
        iban_last_four: '3391',
        sort_code_last_four: null,
      }),
    );

    renderWithProviders(
      <CreatePayoutDialog open onOpenChange={vi.fn()} currency="GBP" availableMinor={100_000} />,
    );

    const note = await screen.findByTestId('payout-conversion-note');
    expect(note).toHaveTextContent(/held in EUR/);
    expect(note).toHaveTextContent(/converts your GBP balance to EUR/);
    expect(screen.queryByText(/no validated/)).not.toBeInTheDocument();
  });

  it('prefers a same-currency account and then says nothing about conversion', async () => {
    serveAccounts(
      makeBankAccount({ id: 'ba_eur', currency: 'EUR', status: 'validated', is_default: true }),
      makeBankAccount({ id: 'ba_gbp', currency: 'GBP', status: 'validated', is_default: true }),
    );

    renderWithProviders(
      <CreatePayoutDialog open onOpenChange={vi.fn()} currency="GBP" availableMinor={100_000} />,
    );

    const dialog = await screen.findByRole('dialog', { name: 'Pay out' });
    await waitFor(() =>
      expect(within(dialog).getByRole('combobox', { name: 'To account' })).toHaveTextContent(/GBP/),
    );
    expect(screen.queryByTestId('payout-conversion-note')).not.toBeInTheDocument();
  });

  it('posts the balance currency and the foreign account', async () => {
    serveAccounts(
      makeBankAccount({ id: 'ba_eur', currency: 'EUR', status: 'validated', is_default: true }),
    );
    let seen: unknown = null;
    server.use(
      http.post(url('/payouts'), async ({ request }) => {
        seen = await request.json();
        return HttpResponse.json({}, { status: 500 });
      }),
    );

    const { user } = renderWithProviders(
      <CreatePayoutDialog open onOpenChange={vi.fn()} currency="GBP" availableMinor={100_000} />,
    );

    await screen.findByTestId('payout-conversion-note');
    await user.click(screen.getByRole('button', { name: 'Schedule payout' }));

    await waitFor(() =>
      expect(seen).toEqual({ currency: 'GBP', bank_account_id: 'ba_eur', method: 'standard_ach' }),
    );
  });
});
