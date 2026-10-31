/**
 * `VerifyEmailPage` — RFC platform-v2 §3. Verifies exactly once on arrival and lands the new
 * owner on onboarding.
 */
import { HttpResponse, http } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { VerifyEmailPage } from '@features/signup/VerifyEmailPage';
import { makeApiErrorBody, makeSession } from '@/test/factories';
import { server, url } from '@/test/msw/server';
import { configure, renderWithProviders, screen, waitFor } from '@/test/render';

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
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/onboarding" element={<h1>Onboarding landed</h1>} />
    </Routes>,
    { route, session: null },
  );
}

describe('verifying', () => {
  it('posts the token once and sends the owner to onboarding', async () => {
    const tokens: string[] = [];
    server.use(
      http.post(url('/signup/verify'), async ({ request }) => {
        tokens.push(((await request.json()) as { token: string }).token);
        return HttpResponse.json({
          object: 'login',
          user: makeSession().user,
          merchant: makeSession().merchant,
        });
      }),
    );

    renderAt('/verify-email?token=tok_abc');

    expect(await screen.findByRole('heading', { name: 'Onboarding landed' })).toBeInTheDocument();
    expect(tokens).toEqual(['tok_abc']);
  });

  it('explains a spent or expired link and offers a retry', async () => {
    server.use(
      http.post(url('/signup/verify'), () =>
        HttpResponse.json(makeApiErrorBody('invalid_request', 'bad token'), { status: 400 }),
      ),
    );

    renderAt('/verify-email?token=tok_old');

    expect(await screen.findByText(/invalid or has already been used/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('does nothing without a token, and says why', async () => {
    let called = false;
    server.use(
      http.post(url('/signup/verify'), () => {
        called = true;
        return HttpResponse.json({});
      }),
    );

    renderAt('/verify-email');

    expect(screen.getByText('This link is incomplete')).toBeInTheDocument();
    await waitFor(() => expect(called).toBe(false));
  });
});
