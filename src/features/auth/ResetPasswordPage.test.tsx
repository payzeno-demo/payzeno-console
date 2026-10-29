/**
 * `ResetPasswordPage` — RFC platform-v2 §4.
 */
import { HttpResponse, http } from 'msw';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { ResetPasswordPage } from '@features/auth/ResetPasswordPage';
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

describe('choosing a new password', () => {
  it('sends the token and the new password, then points at sign in', async () => {
    let seen: unknown = null;
    server.use(
      http.post(url('/auth/password/reset/confirm'), async ({ request }) => {
        seen = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { user } = renderWithProviders(<ResetPasswordPage />, {
      route: '/reset-password?token=rst_tok',
      session: null,
    });
    await user.click(screen.getByLabelText(/^New password/));
    await user.paste('brand-new-password');
    await user.click(screen.getByLabelText(/^Confirm new password/));
    await user.paste('brand-new-password');
    await user.click(screen.getByRole('button', { name: 'Set new password' }));

    expect(await screen.findByText('Password changed')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
    expect(seen).toEqual({ token: 'rst_tok', password: 'brand-new-password' });
  });

  it('offers a fresh link when the token is spent', async () => {
    server.use(
      http.post(url('/auth/password/reset/confirm'), () =>
        HttpResponse.json(makeApiErrorBody('invalid_request', 'expired'), { status: 400 }),
      ),
    );

    const { user } = renderWithProviders(<ResetPasswordPage />, {
      route: '/reset-password?token=rst_old',
      session: null,
    });
    await user.click(screen.getByLabelText(/^New password/));
    await user.paste('brand-new-password');
    await user.click(screen.getByLabelText(/^Confirm new password/));
    await user.paste('brand-new-password');
    await user.click(screen.getByRole('button', { name: 'Set new password' }));

    expect(await screen.findByText(/invalid or has already been used/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Request a new reset link' })).toHaveAttribute(
      'href',
      '/forgot-password',
    );
  });

  it('has no form without a token', () => {
    renderWithProviders(<ResetPasswordPage />, { route: '/reset-password', session: null });

    expect(screen.getByText('This link is incomplete')).toBeInTheDocument();
  });
});
