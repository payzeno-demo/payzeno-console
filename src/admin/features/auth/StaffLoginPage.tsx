/**
 * `StaffLoginPage` — `/login` on the admin host. Payzeno employees only; merchants sign in on
 * the console host, and the page says so, because the two forms look alike.
 *
 * Outside `RequireStaffSession`, inside `RequireNoStaffSession`: a signed-in visitor is sent on
 * to wherever they were going (`location.state.from`).
 */
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation } from 'react-router-dom';

import { InlineError } from '@components/feedback/InlineError';
import { FormField } from '@components/form/FormField';
import { EnvironmentBanner } from '@components/layout/EnvironmentBanner';
import { PageContainer } from '@components/layout/PageContainer';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { color, font, space } from '@components/ui/tokens';
import { useDocumentTitle } from '@hooks/useDocumentTitle';

import { ADMIN_ROUTES } from '../../adminRoutes';

import { useStaffLogin } from './useStaffLogin';

export function StaffLoginPage() {
  useDocumentTitle('Staff sign in', 'Admin');

  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const redirectTo = from && from !== ADMIN_ROUTES.login ? from : ADMIN_ROUTES.home;

  const { submit, isPending, errorMessage, fieldErrors } = useStaffLogin(redirectTo);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending || email.trim().length === 0 || password.length === 0) return;
    submit({ email: email.trim(), password });
  };

  return (
    <>
      <EnvironmentBanner />
      <PageContainer as="main" width="narrow">
        <div style={{ display: 'grid', gap: space[5], marginTop: space[10] }}>
          <div style={{ display: 'grid', gap: space[2] }}>
            <p
              style={{
                margin: 0,
                fontSize: font.size.sm,
                fontWeight: font.weight.semibold,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: color.textMuted,
              }}
            >
              Payzeno Admin
            </p>
            <h1 style={{ margin: 0, fontSize: font.size.xxl, fontWeight: font.weight.semibold }}>
              Staff sign in
            </h1>
            <p style={{ margin: 0, color: color.textSecondary }}>
              The back office for Payzeno employees. Merchants sign in to the Payzeno console
              instead.
            </p>
          </div>

          <Card as="div">
            <form onSubmit={onSubmit} noValidate style={{ display: 'grid', gap: space[4] }}>
              {errorMessage ? (
                <InlineError id="staff-login-error">{errorMessage}</InlineError>
              ) : null}

              <FormField id="staff-login-email" label="Work email" required error={fieldErrors.email}>
                {(wiring) => (
                  <Input
                    id={wiring.id}
                    name="email"
                    type="email"
                    autoComplete="username"
                    required
                    value={email}
                    invalid={Boolean(fieldErrors.email)}
                    describedBy={wiring['aria-describedby']}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                )}
              </FormField>

              <FormField
                id="staff-login-password"
                label="Password"
                required
                error={fieldErrors.password}
              >
                {(wiring) => (
                  <Input
                    id={wiring.id}
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    invalid={Boolean(fieldErrors.password)}
                    describedBy={wiring['aria-describedby']}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                )}
              </FormField>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                isLoading={isPending}
                disabled={email.trim().length === 0 || password.length === 0}
              >
                Sign in
              </Button>
            </form>
          </Card>
        </div>
      </PageContainer>
    </>
  );
}
