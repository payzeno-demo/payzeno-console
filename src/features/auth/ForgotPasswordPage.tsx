/**
 * `ForgotPasswordPage` — `/forgot-password`, public (RFC platform-v2 §4).
 *
 * Asks for an address and always answers the same way, whether or not it has an account.
 */
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { InlineError } from '@components/feedback/InlineError';
import { TextField } from '@components/form/TextField';
import { EnvironmentBanner } from '@components/layout/EnvironmentBanner';
import { PageContainer } from '@components/layout/PageContainer';
import { Alert } from '@components/ui/Alert';
import { Button } from '@components/ui/Button';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { ROUTES } from '@/routes';

import { useForgotPassword } from './useForgotPassword';

export function ForgotPasswordPage() {
  useDocumentTitle('Reset your password');

  const [email, setEmail] = useState('');
  const { submit, isPending, sentTo, errorMessage } = useForgotPassword();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending || email.trim().length === 0) return;
    submit(email);
  };

  return (
    <PageContainer as="main" width="narrow">
      <EnvironmentBanner />
      <h1>Reset your password</h1>

      {sentTo ? (
        <Alert tone="success" title="Check your email">
          <p>
            If <strong data-testid="reset-sent-to">{sentTo}</strong> has a Payzeno account, we have
            emailed it a link to choose a new password. The link expires in one hour.
          </p>
        </Alert>
      ) : (
        <form onSubmit={handleSubmit} noValidate aria-label="Request a password reset">
          <p>Enter the email address you sign in with and we will send you a reset link.</p>
          <TextField
            id="forgot-email"
            label="Email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onValueChange={setEmail}
          />
          {errorMessage ? <InlineError id="forgot-error">{errorMessage}</InlineError> : null}
          <Button type="submit" disabled={isPending || email.trim().length === 0}>
            {isPending ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      )}

      <p>
        Remembered it? <Link to={ROUTES.auth.login}>Back to sign in</Link>.
      </p>
    </PageContainer>
  );
}
