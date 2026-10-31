/**
 * `SignupPage` — RFC platform-v2 §3. The form posts `SignupRequest`; success never signs
 * anyone in, it says "check your email".
 */
import { HttpResponse, http } from 'msw';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { SignupPage } from '@features/signup/SignupPage';
import { makeApiErrorBody } from '@/test/factories';
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

async function fillForm(
  user: ReturnType<typeof renderWithProviders>['user'],
  password = 'long-enough-pw',
) {
  await user.click(screen.getByLabelText(/^Your full name/));
  await user.paste('Ada Owner');
  await user.click(screen.getByLabelText(/^Work email/));
  await user.paste('ada@newco.example');
  await user.click(screen.getByLabelText(/^Password/));
  await user.paste(password);
  await user.click(screen.getByLabelText(/^Legal business name/));
  await user.paste('NewCo Trading Ltd');
}

describe('signing up', () => {
  it('posts the account and business basics, then asks the owner to check their email', async () => {
    let seen: Record<string, unknown> | null = null;
    server.use(
      http.post(url('/signup'), async ({ request }) => {
        seen = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          { object: 'signup', merchant_id: 'mch_new', verification_required: true },
          { status: 201 },
        );
      }),
    );

    const { user } = renderWithProviders(<SignupPage />, { route: '/signup', session: null });
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('heading', { name: 'Check your email' })).toBeInTheDocument();
    expect(screen.getByTestId('signup-sent-to')).toHaveTextContent('ada@newco.example');
    expect(seen).toEqual({
      full_name: 'Ada Owner',
      email: 'ada@newco.example',
      password: 'long-enough-pw',
      legal_name: 'NewCo Trading Ltd',
      // Left blank, so the legal name stands in.
      display_name: 'NewCo Trading Ltd',
      country: 'GB',
      default_currency: 'GBP',
    });
  });

  it('refuses a short password without a request', async () => {
    let called = false;
    server.use(
      http.post(url('/signup'), () => {
        called = true;
        return HttpResponse.json({}, { status: 201 });
      }),
    );

    const { user } = renderWithProviders(<SignupPage />, { route: '/signup', session: null });
    await fillForm(user, 'short');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Use at least 10 characters.')).toBeInTheDocument();
    expect(called).toBe(false);
  });

  it('puts the api’s field errors next to the field they belong to', async () => {
    server.use(
      http.post(url('/signup'), () =>
        HttpResponse.json(
          makeApiErrorBody('validation_failed', 'Invalid', {
            field_errors: [{ path: 'email', code: 'invalid', message: 'Use a real address.' }],
          }),
          { status: 422 },
        ),
      ),
    );

    const { user } = renderWithProviders(<SignupPage />, { route: '/signup', session: null });
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Use a real address.')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Work email/)).toHaveAttribute('aria-invalid', 'true');
  });

  it('links back to sign in', () => {
    renderWithProviders(<SignupPage />, { route: '/signup', session: null });

    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
  });
});

describe('an address that already has an account', () => {
  it('says so and points at sign-in', async () => {
    server.use(
      http.post(url('/signup'), () =>
        HttpResponse.json(makeApiErrorBody('conflict', 'exists'), { status: 409 }),
      ),
    );

    const { user } = renderWithProviders(<SignupPage />, { route: '/signup', session: null });
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(screen.getByTestId('signup-error')).toHaveTextContent(/already uses that email/);
    });
  });
});
