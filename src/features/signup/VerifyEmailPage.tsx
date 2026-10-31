/**
 * `VerifyEmailPage` — `/verify-email?token=…`, public (RFC platform-v2 §3).
 *
 * Opened from the `signup_verify` email. Verifies on arrival, signs the owner in and sends them
 * to onboarding; there is no form, because the token is the whole request.
 */
import { Link, useSearchParams } from 'react-router-dom';

import { EnvironmentBanner } from '@components/layout/EnvironmentBanner';
import { PageContainer } from '@components/layout/PageContainer';
import { Alert } from '@components/ui/Alert';
import { Button } from '@components/ui/Button';
import { Spinner } from '@components/ui/Spinner';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { ROUTES } from '@/routes';

import { useVerifyEmail } from './useVerifyEmail';

export function VerifyEmailPage() {
  useDocumentTitle('Verify your email');

  const [params] = useSearchParams();
  const token = params.get('token');
  const { status, errorMessage, retry } = useVerifyEmail(token);

  return (
    <PageContainer as="main" width="narrow">
      <EnvironmentBanner />
      <h1>Verify your email</h1>

      {status === 'missing_token' ? (
        <Alert tone="warning" title="This link is incomplete">
          <p>
            Open the link from your verification email exactly as it was sent — it carries a
            one-time code this page needs.
          </p>
        </Alert>
      ) : null}

      {status === 'pending' ? <Spinner label="Verifying your email address" /> : null}

      {status === 'success' ? (
        <Alert tone="success" title="Email verified">
          <p>Taking you to your account setup…</p>
        </Alert>
      ) : null}

      {status === 'error' ? (
        <>
          <Alert tone="danger" title="We could not verify your email">
            <p>{errorMessage}</p>
          </Alert>
          <Button type="button" variant="secondary" onClick={retry}>
            Try again
          </Button>
        </>
      ) : null}

      <p>
        <Link to={ROUTES.auth.login}>Sign in</Link> ·{' '}
        <Link to={ROUTES.auth.signup}>Create an account</Link>
      </p>
    </PageContainer>
  );
}
