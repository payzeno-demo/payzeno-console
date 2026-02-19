/**
 * `SettingsPage` — the second of the two tests `features/settings` gets (blueprint §8.5).
 *
 * The team tab has no test of its own on purpose: `useUsers` still goes through
 * `src/api/legacy/api-fetch.ts`, its errors arrive as bare `Error`s rather than
 * `ConsoleApiError` subclasses, and there is an open ticket to migrate it. Testing around that
 * would make the debt look handled.
 */
import { describe, expect, it } from 'vitest';

import { SettingsPage } from '@features/settings/SettingsPage';
import { makeBankAccount, makePage } from '@/test/factories';
import { errorHandler, recordRequests, server, url } from '@/test/msw/server';
import { renderWithProviders, screen, waitFor } from '@/test/render';

import { HttpResponse, http } from 'msw';

describe('the page', () => {
  it('renders its heading', async () => {
    renderWithProviders(<SettingsPage />, { route: '/settings' });

    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument();
  });

  it('summarises the merchant in the description', async () => {
    renderWithProviders(<SettingsPage />, { route: '/settings' });

    expect(await screen.findByText('Northwind · GB · GBP')).toBeInTheDocument();
  });

  it('sets the document title', async () => {
    renderWithProviders(<SettingsPage />, { route: '/settings' });

    await waitFor(() => {
      expect(document.title).toContain('Settings');
    });
  });

  it('renders a labelled tab list', async () => {
    renderWithProviders(<SettingsPage />, { route: '/settings' });

    expect(
      await screen.findByRole('tablist', { name: 'Settings sections' }),
    ).toBeInTheDocument();
  });
});

describe('the bank accounts tab', () => {
  it('reads the bank accounts', async () => {
    const recorder = recordRequests();
    renderWithProviders(<SettingsPage />, { route: '/settings' });

    await waitFor(() => {
      expect(
        recorder.requests.some((request) => request.url.includes('/v1/bank-accounts')),
      ).toBe(true);
    });
    recorder.stop();
  });

  it('shows the masked coordinates rather than a full account number', async () => {
    const { container } = renderWithProviders(<SettingsPage />, { route: '/settings' });

    await waitFor(() => {
      expect(container.textContent).toContain('••••');
    });
    expect(container.textContent).toContain('0417');
    expect(container.textContent).not.toMatch(/\d{8,}/);
  });

  it('names the bank', async () => {
    renderWithProviders(<SettingsPage />, { route: '/settings' });

    await waitFor(() => {
      expect(screen.getByRole('main').textContent).toContain('Northern Counties Bank');
    });
  });

  it('renders an error state when the accounts fail to load', async () => {
    server.use(errorHandler('get', '/bank-accounts', 500, 'internal_error'));

    renderWithProviders(<SettingsPage />, { route: '/settings' });

    expect(
      await screen.findByRole('heading', { name: 'We could not load your bank accounts' }),
    ).toBeInTheDocument();
  });

  it('copes with a merchant who has no bank account yet', async () => {
    server.use(http.get(url('/bank-accounts'), () => HttpResponse.json(makePage([]))));

    renderWithProviders(<SettingsPage />, { route: '/settings' });

    await screen.findByRole('heading', { name: 'Settings' });
    expect(screen.queryByText('Northern Counties Bank')).not.toBeInTheDocument();
  });

  it('shows a non-default account without marking it default', async () => {
    server.use(
      http.get(url('/bank-accounts'), () =>
        HttpResponse.json(
          makePage([makeBankAccount({ id: 'ba_second', is_default: false })]),
        ),
      ),
    );

    renderWithProviders(<SettingsPage />, { route: '/settings' });

    await waitFor(() => {
      expect(screen.getByRole('main').textContent).toContain('Northern Counties Bank');
    });
  });
});

describe('the payout configuration panel', () => {
  it('renders the merchant payout schedule', async () => {
    renderWithProviders(<SettingsPage />, { route: '/settings' });

    expect(
      await screen.findByRole('region', { name: 'Payout configuration' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Payout schedule' })).toBeInTheDocument();
  });

  it('shows the configured schedule and delay from the session merchant', async () => {
    renderWithProviders(<SettingsPage />, { route: '/settings' });

    const region = await screen.findByRole('region', { name: 'Payout configuration' });
    expect(region.textContent).toMatch(/daily/i);
  });
});
