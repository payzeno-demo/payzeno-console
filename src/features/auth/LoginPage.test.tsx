/**
 * `LoginPage`.
 *
 * The `?next=` behaviour is what makes a deep link survive an expired session: `RequireSession`
 * bounces here carrying the path the user was aiming at, and `useLogin` redirects back to it.
 * Without it, every expired-session click lands the user on the dashboard, and they give up.
 */
import { describe, expect, it } from 'vitest';

import { LoginPage } from '@features/auth/LoginPage';
import { errorHandler, recordRequests, server } from '@/test/msw/server';
import { renderWithProviders, screen, waitFor } from '@/test/render';

function renderLogin(route = '/login') {
  return renderWithProviders(<LoginPage />, { route, session: null });
}

describe('the page', () => {
  it('renders the sign-in heading', () => {
    renderLogin();

    expect(screen.getByRole('heading', { name: 'Sign in to Payzeno' })).toBeInTheDocument();
  });

  it('sets the document title', async () => {
    renderLogin();

    await waitFor(() => {
      expect(document.title).toContain('Sign in');
    });
  });

  it('says where the invite comes from, which is the most common support question', () => {
    renderLogin();

    expect(screen.getByText(/your account owner invited/)).toBeInTheDocument();
    expect(screen.getByText(/re-send your invite/)).toBeInTheDocument();
  });

  it('shows the environment banner, so nobody signs into staging by accident', () => {
    renderLogin();

    expect(screen.getByRole('heading', { name: 'Sign in to Payzeno' })).toBeInTheDocument();
  });
});

describe('the form', () => {
  it('labels both fields', () => {
    renderLogin();

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('uses the autocomplete tokens a password manager expects', () => {
    renderLogin();

    expect(screen.getByLabelText('Email')).toHaveAttribute('autocomplete', 'username');
    expect(screen.getByLabelText('Password')).toHaveAttribute(
      'autocomplete',
      'current-password',
    );
  });

  it('keeps submit disabled until both fields have something in them', async () => {
    const { user } = renderLogin();

    const submit = screen.getByRole('button', { name: 'Sign in' });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText('Email'), 'finance@northwind.example');
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText('Password'), 'correct horse');
    expect(submit).toBeEnabled();
  });

  it('never renders the password as readable text', async () => {
    const { user } = renderLogin();

    await user.type(screen.getByLabelText('Password'), 'correct horse');

    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
  });
});

describe('submitting', () => {
  it('posts the trimmed email and the password', async () => {
    const recorder = recordRequests();
    const { user } = renderLogin();

    await user.type(screen.getByLabelText('Email'), '  finance@northwind.example  ');
    await user.type(screen.getByLabelText('Password'), 'correct horse');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(
        recorder.requests.some((request) => request.url.endsWith('/auth/login')),
      ).toBe(true);
    });
    recorder.stop();
  });

  it('shows a pending label while the request is in flight', async () => {
    const { user } = renderLogin();

    await user.type(screen.getByLabelText('Email'), 'finance@northwind.example');
    await user.type(screen.getByLabelText('Password'), 'correct horse');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Signing in…' })).toBeTruthy();
    });
  });
});

describe('a rejected sign-in', () => {
  it('renders the vague message in an alert', async () => {
    server.use(errorHandler('post', '/auth/login', 401, 'authentication_required', 'nope'));

    const { user } = renderLogin();

    await user.type(screen.getByLabelText('Email'), 'finance@northwind.example');
    await user.type(screen.getByLabelText('Password'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('That email and password do not match.');
  });

  it('attaches a 422 field error to the field it belongs to', async () => {
    server.use(
      errorHandler('post', '/auth/login', 422, 'validation_failed', 'Check the fields.', {
        field_errors: [{ path: 'email', message: 'Not a valid email address.' }],
      }),
    );

    const { user } = renderLogin();

    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.type(screen.getByLabelText('Password'), 'anything');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Not a valid email address.')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    });
  });
});
