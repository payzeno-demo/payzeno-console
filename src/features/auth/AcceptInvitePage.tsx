/**
 * `AcceptInvitePage` — `/accept-invite?token=…`, public (RFC platform-v2 §4).
 *
 * Opened from the `team_invite` email. The invitee picks their name and password and is signed
 * straight in; the inviter's team tab flips them from "Invitation pending" to "Active".
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
import { useAcceptInvitation } from './useAcceptInvitation';

export function AcceptInvitePage() {
  useDocumentTitle('Join your team on Payzeno');

  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const { submit, isPending, errorMessage } = useAcceptInvitation(token);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending || fullName.trim().length === 0) return;
    const found = passwordProblem(password, confirmation);
    setProblem(found);
    if (!found) submit({ fullName, password });
  };

  return (
    <PageContainer as="main" width="narrow">
      <EnvironmentBanner />
      <h1>Join your team on Payzeno</h1>

      {!token ? (
        <Alert tone="warning" title="This link is incomplete">
          <p>
            Open the link from your invitation email exactly as it was sent. If it has expired, ask
            whoever invited you to send a new one.
          </p>
        </Alert>
      ) : (
        <form onSubmit={handleSubmit} noValidate aria-label="Accept your invitation">
          <p>Choose how your name appears to your team and set a password.</p>
          <TextField
            id="invite-full-name"
            label="Your full name"
            autoComplete="name"
            required
            value={fullName}
            onValueChange={setFullName}
          />
          <TextField
            id="invite-password"
            label="Password"
            type="password"
            autoComplete="new-password"
            required
            hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
            value={password}
            onValueChange={setPassword}
          />
          <TextField
            id="invite-password-confirm"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            required
            value={confirmation}
            onValueChange={setConfirmation}
            error={problem ?? undefined}
          />
          {errorMessage ? <InlineError id="accept-error">{errorMessage}</InlineError> : null}
          <Button
            type="submit"
            disabled={isPending || fullName.trim().length === 0 || password.length === 0}
          >
            {isPending ? 'Joining…' : 'Accept invitation'}
          </Button>
        </form>
      )}

      <p>
        Already joined? <Link to={ROUTES.auth.login}>Sign in</Link>.
      </p>
    </PageContainer>
  );
}
