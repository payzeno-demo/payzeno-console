/**
 * `LoginPage` — the `auth` feature's one route element, registered at `ROUTES.auth.login`
 * in `src/router.tsx`. Layout plus section components only; all data logic is in `useLogin`.
 *
 * It is outside `RequireSession`, so a signed-out user lands here rather than looping.
 */
import { Link, useSearchParams } from 'react-router-dom';

import { PageContainer } from '@components/layout/PageContainer';
import { EnvironmentBanner } from '@components/layout/EnvironmentBanner';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { ROUTES } from '@/routes';

import { LoginForm } from './components/LoginForm';
import { useLogin } from './useLogin';

export function LoginPage() {
  useDocumentTitle('Sign in');

  const [params] = useSearchParams();
  // `RequireSession` bounces here with ?next=<attempted path> so a deep link survives login.
  const next = params.get('next') ?? ROUTES.reporting.index;

  const { submit, isPending, errorMessage, fieldErrors } = useLogin(next);

  return (
    <PageContainer as="main" width="narrow">
      <EnvironmentBanner />

      <h1>Sign in to Payzeno</h1>
      <p>Use the email address your account owner invited.</p>

      <LoginForm
        onSubmit={submit}
        isPending={isPending}
        errorMessage={errorMessage}
        fieldErrors={fieldErrors}
      />

      <p>
        <Link to={ROUTES.auth.forgotPassword}>Forgot your password?</Link>
      </p>

      <p>
        Trouble signing in? Ask an owner or admin on your account to re-send your invite.
      </p>

      <p>
        New to Payzeno? <Link to={ROUTES.auth.signup}>Create an account</Link>.
      </p>
    </PageContainer>
  );
}
