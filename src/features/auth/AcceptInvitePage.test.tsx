/**
 * `AcceptInvitePage` — RFC platform-v2 §4.
 */
import { HttpResponse, http } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { AcceptInvitePage } from '@features/auth/AcceptInvitePage';
import { makeApiErrorBody, makeSession } from '@/test/factories';
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

function renderAt(route: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/accept-invite" element={<AcceptInvitePage />} />
      <Route path="/" element={<h1>Dashboard landed</h1>} />
    </Routes>,
    { route, session: null },
  );
}

describe('accepting an invitation', () => {
  it('sends the token, name and password, then signs the member in', async () => {
    let seen: Record<string, unknown> | null = null;
    server.use(
      http.post(url('/auth/invitations/accept'), async ({ request }) => {
        seen = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          object: 'login',
          user: makeSession().user,
          merchant: makeSession().merchant,
        });
      }),
    );

    const { user } = renderAt('/accept-invite?token=inv_tok');
    await user.click(screen.getByLabelText(/^Your full name/));
    await user.paste('Ida Member');
    await user.click(screen.getByLabelText(/^Password/));
    await user.paste('a-good-password');
    await user.click(screen.getByLabelText(/^Confirm password/));
    await user.paste('a-good-password');
    await user.click(screen.getByRole('button', { name: 'Accept invitation' }));

    expect(await screen.findByRole('heading', { name: 'Dashboard landed' })).toBeInTheDocument();
    expect(seen).toEqual({
      token: 'inv_tok',
      full_name: 'Ida Member',
      password: 'a-good-password',
    });
  });

  it('catches mismatched passwords before sending anything', async () => {
    const { user } = renderAt('/accept-invite?token=inv_tok');
    await user.click(screen.getByLabelText(/^Your full name/));
    await user.paste('Ida Member');
    await user.click(screen.getByLabelText(/^Password/));
    await user.paste('a-good-password');
    await user.click(screen.getByLabelText(/^Confirm password/));
    await user.paste('a-different-one');
    await user.click(screen.getByRole('button', { name: 'Accept invitation' }));

    expect(await screen.findByText('The two passwords do not match.')).toBeInTheDocument();
  });

  it('explains an expired invitation', async () => {
    server.use(
      http.post(url('/auth/invitations/accept'), () =>
        HttpResponse.json(makeApiErrorBody('not_found', 'no such invite'), { status: 404 }),
      ),
    );

    const { user } = renderAt('/accept-invite?token=inv_old');
    await user.click(screen.getByLabelText(/^Your full name/));
    await user.paste('Ida Member');
    await user.click(screen.getByLabelText(/^Password/));
    await user.paste('a-good-password');
    await user.click(screen.getByLabelText(/^Confirm password/));
    await user.paste('a-good-password');
    await user.click(screen.getByRole('button', { name: 'Accept invitation' }));

    expect(await screen.findByText(/invalid or has already been used/)).toBeInTheDocument();
  });

  it('shows no form without a token', () => {
    renderAt('/accept-invite');

    expect(screen.getByText('This link is incomplete')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Accept invitation' })).not.toBeInTheDocument();
  });
});
