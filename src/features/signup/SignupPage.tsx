/**
 * `SignupPage` — `/signup`, public (RFC platform-v2 §3).
 *
 * Two states: the form, then "check your email". There is deliberately no third: the api
 * never signs a new owner in from here, because they have not proved they own the address.
 */
import { Link } from 'react-router-dom';

import { EnvironmentBanner } from '@components/layout/EnvironmentBanner';
import { PageContainer } from '@components/layout/PageContainer';
import { Alert } from '@components/ui/Alert';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { ROUTES } from '@/routes';

import { SignupForm } from './components/SignupForm';
import { useSignup } from './useSignup';

export function SignupPage() {
  useDocumentTitle('Create your account');

  const { submit, isPending, errorMessage, fieldErrors, sentTo } = useSignup();

  if (sentTo) {
    return (
      <PageContainer as="main" width="narrow">
        <EnvironmentBanner />
        <h1>Check your email</h1>
        <Alert tone="success" title="We sent you a verification link">
          <p>
            We emailed <strong data-testid="signup-sent-to">{sentTo}</strong> a link to verify your
            address. Open it on this device to sign in and finish setting up your account.
          </p>
        </Alert>
        <p>
          Nothing there after a few minutes? Check spam, then{' '}
          <Link to={ROUTES.auth.signup}>try again</Link> with the right address.
        </p>
        <p>
          Already verified? <Link to={ROUTES.auth.login}>Sign in</Link>.
        </p>
      </PageContainer>
    );
  }

  return (
    <PageContainer as="main" width="narrow">
      <EnvironmentBanner />

      <h1>Create your Payzeno account</h1>
      <p>
        Start in test mode straight away. Live payments open once we have verified your business —
        you can do that after you sign in.
      </p>

      <SignupForm
        onSubmit={submit}
        isPending={isPending}
        errorMessage={errorMessage}
        fieldErrors={fieldErrors}
      />

      <p>
        Already have an account? <Link to={ROUTES.auth.login}>Sign in</Link>.
      </p>
    </PageContainer>
  );
}
