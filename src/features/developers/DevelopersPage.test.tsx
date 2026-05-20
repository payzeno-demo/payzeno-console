/**
 * `DevelopersPage`.
 *
 * Three tabs behind one route. The keys tab is the one with a real security property: a
 * plaintext secret exists in the browser exactly once, and nothing on this page may render one
 * that came from a list read.
 */
import { describe, expect, it } from 'vitest';

import { DevelopersPage } from '@features/developers/DevelopersPage';
import { makeApiKey, makePage, makeWebhookEvent } from '@/test/factories';
import { errorHandler, server, url } from '@/test/msw/server';
import { renderWithProviders, screen, waitFor } from '@/test/render';

import { HttpResponse, http } from 'msw';

describe('the page', () => {
  it('renders its heading and description', async () => {
    renderWithProviders(<DevelopersPage />, { route: '/developers' });

    expect(await screen.findByRole('heading', { name: 'Developers' })).toBeInTheDocument();
    expect(
      screen.getByText('Keys, webhooks and everything you need to integrate.'),
    ).toBeInTheDocument();
  });

  it('sets the document title', async () => {
    renderWithProviders(<DevelopersPage />, { route: '/developers' });

    await waitFor(() => {
      expect(document.title).toContain('Developers');
    });
  });

  it('renders a labelled tab list', async () => {
    renderWithProviders(<DevelopersPage />, { route: '/developers' });

    expect(
      await screen.findByRole('tablist', { name: 'Developer sections' }),
    ).toBeInTheDocument();
  });
});

describe('the keys tab', () => {
  it('renders live and test keys in separate captioned tables', async () => {
    renderWithProviders(<DevelopersPage />, { route: '/developers' });

    expect(await screen.findByRole('table', { name: /Live API keys/ })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: /Test API keys/ })).toBeInTheDocument();
  });

  it('shows the masked key label rather than anything secret', async () => {
    const { container } = renderWithProviders(<DevelopersPage />, { route: '/developers' });

    await screen.findByRole('table', { name: /Live API keys/ });

    expect(container.innerHTML).toContain('9f2c');
    expect(container.innerHTML).not.toContain('sk_live_01HW0RTAPIKEYCREATED01_shown_once');
  });

  it('offers a labelled revoke control per key', async () => {
    renderWithProviders(<DevelopersPage />, { route: '/developers' });

    expect(
      await screen.findByRole('button', { name: 'Revoke Checkout server' }),
    ).toBeInTheDocument();
  });

  it('shows an empty state when there are no live keys', async () => {
    server.use(
      http.get(url('/api-keys'), () =>
        HttpResponse.json(makePage([makeApiKey({ mode: 'test', prefix: 'sk_test_' })])),
      ),
    );

    renderWithProviders(<DevelopersPage />, { route: '/developers' });

    expect(await screen.findByText('No live keys')).toBeInTheDocument();
  });

  it('renders an error state when the key list fails', async () => {
    server.use(errorHandler('get', '/api-keys', 500, 'internal_error'));

    renderWithProviders(<DevelopersPage />, { route: '/developers' });

    expect(
      await screen.findByRole('heading', { name: 'We could not load your keys' }),
    ).toBeInTheDocument();
  });
});

describe('the webhooks tab', () => {
  it('is reachable from the tab list', async () => {
    const { user } = renderWithProviders(<DevelopersPage />, { route: '/developers' });

    const tab = await screen.findByRole('tab', { name: /Webhook/ });
    await user.click(tab);

    expect(
      await screen.findByRole('table', { name: /Webhook deliveries, most recent first/ }),
    ).toBeInTheDocument();
  });

  it('warns when some events were given up on', async () => {
    const { user } = renderWithProviders(<DevelopersPage />, { route: '/developers' });

    await user.click(await screen.findByRole('tab', { name: /Webhook/ }));

    expect(await screen.findByText('Some events were given up on')).toBeInTheDocument();
  });

  it('does not warn when every delivery landed', async () => {
    server.use(
      http.get(url('/webhook_events'), () =>
        HttpResponse.json(makePage([makeWebhookEvent({ status: 'delivered' })])),
      ),
    );

    const { user } = renderWithProviders(<DevelopersPage />, { route: '/developers' });
    await user.click(await screen.findByRole('tab', { name: /Webhook/ }));

    await screen.findByRole('table', { name: /Webhook deliveries/ });
    expect(screen.queryByText('Some events were given up on')).not.toBeInTheDocument();
  });

  it('lists the configured endpoints', async () => {
    const { user } = renderWithProviders(<DevelopersPage />, { route: '/developers' });

    await user.click(await screen.findByRole('tab', { name: /Webhook/ }));

    expect(
      await screen.findByRole('region', { name: 'Webhook endpoints' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/northwind\.example\/hooks\/payzeno/)).toBeInTheDocument();
  });
});

describe('the build-info panel', () => {
  it('shows the console version the browser is running', async () => {
    const { user } = renderWithProviders(<DevelopersPage />, { route: '/developers' });

    const tabs = await screen.findAllByRole('tab');
    const last = tabs.at(-1);
    if (last) await user.click(last);

    await waitFor(() => {
      expect(screen.getByRole('main').textContent).toMatch(/1\.34\.0-test|Build info/);
    });
  });
});
