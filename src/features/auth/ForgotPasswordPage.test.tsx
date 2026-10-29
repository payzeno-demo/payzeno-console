/**
 * `ForgotPasswordPage` — RFC platform-v2 §4. Same answer whether or not the address exists.
 */
import { HttpResponse, http } from 'msw';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { ForgotPasswordPage } from '@features/auth/ForgotPasswordPage';
import { makeApiErrorBody } from '@/test/factories';
import { server, url } from '@/test/msw/server';
import { configure, renderWithProviders, screen } from '@/test/render';

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

describe('requesting a reset', () => {
  it('posts the address and says to check email', async () => {
    let seen: unknown = null;
    server.use(
      http.post(url('/auth/password/reset'), async ({ request }) => {
        seen = await request.json();
        return new HttpResponse(null, { status: 202 });
      }),
    );

    const { user } = renderWithProviders(<ForgotPasswordPage />, {
      route: '/forgot-password',
      session: null,
    });
    await user.click(screen.getByLabelText(/^Email/));
    await user.paste(' dana@northwind.example ');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));

    expect(await screen.findByText('Check your email')).toBeInTheDocument();
    expect(screen.getByTestId('reset-sent-to')).toHaveTextContent('dana@northwind.example');
    expect(seen).toEqual({ email: 'dana@northwind.example' });
  });

  it('reads a 4xx exactly like a success — no account enumeration', async () => {
    server.use(
      http.post(url('/auth/password/reset'), () =>
        HttpResponse.json(makeApiErrorBody('not_found', 'nope'), { status: 404 }),
      ),
    );

    const { user } = renderWithProviders(<ForgotPasswordPage />, {
      route: '/forgot-password',
      session: null,
    });
    await user.click(screen.getByLabelText(/^Email/));
    await user.paste('nobody@example.com');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));

    expect(await screen.findByText('Check your email')).toBeInTheDocument();
  });

  it('links back to sign in', () => {
    renderWithProviders(<ForgotPasswordPage />, { route: '/forgot-password', session: null });

    expect(screen.getByRole('link', { name: 'Back to sign in' })).toHaveAttribute('href', '/login');
  });
});
