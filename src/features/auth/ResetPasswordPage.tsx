/**
 * `ResetPasswordPage` — `/reset-password?token=…`, public (RFC platform-v2 §4).
 *
 * Opened from the `password_reset` email. Sets the new password; the user then signs in
 * normally — the api does not hand out a session for a reset.
 */
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { InlineError } from '@components/feedback/InlineError';
import { TextField } from '@components/form/TextField';
import { EnvironmentBanner } from '@components/layout/EnvironmentBanner';
import { PageContainer } from '@components/layout/PageContainer';
import { Alert } from '@components/ui/Alert';
import { Button } from '@components/ui/Button';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { ROUTES } from '@/routes';

import { MIN_PASSWORD_LENGTH, passwordProblem } from './password';
import { useResetPassword } from './useResetPassword';

export function ResetPasswordPage() {
  useDocumentTitle('Choose a new password');

  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const { submit, isPending, isDone, errorMessage } = useResetPassword(token);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending) return;
    const found = passwordProblem(password, confirmation);
    setProblem(found);
    if (!found) submit(password);
  };

  return (
    <PageContainer as="main" width="narrow">
      <EnvironmentBanner />
      <h1>Choose a new password</h1>

      {!token ? (
        <Alert tone="warning" title="This link is incomplete">
          <p>
            Open the link from your reset email exactly as it was sent, or{' '}
            <Link to={ROUTES.auth.forgotPassword}>ask for a new one</Link>.
          </p>
        </Alert>
      ) : null}

      {isDone ? (
        <Alert tone="success" title="Password changed">
          <p>
            Your password has been updated. <Link to={ROUTES.auth.login}>Sign in</Link> with the new
            one.
          </p>
        </Alert>
      ) : null}

      {token && !isDone ? (
        <form onSubmit={handleSubmit} noValidate aria-label="Choose a new password">
          <TextField
            id="reset-password"
            label="New password"
            type="password"
            autoComplete="new-password"
            required
            hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
            value={password}
            onValueChange={setPassword}
          />
          <TextField
            id="reset-password-confirm"
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            required
            value={confirmation}
            onValueChange={setConfirmation}
            error={problem ?? undefined}
          />
          {errorMessage ? <InlineError id="reset-error">{errorMessage}</InlineError> : null}
          {errorMessage ? (
            <p>
              <Link to={ROUTES.auth.forgotPassword}>Request a new reset link</Link>
            </p>
          ) : null}
          <Button type="submit" disabled={isPending || password.length === 0}>
            {isPending ? 'Saving…' : 'Set new password'}
          </Button>
        </form>
      ) : null}
    </PageContainer>
  );
}
