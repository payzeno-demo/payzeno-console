/**
 * Presentational login form. It owns no data logic — `LoginPage` passes `useLogin()`'s
 * result down.
 *
 * a11y: every input has a real `<label>`, errors are wired with `aria-describedby`, and the
 * form-level error is `role="alert"` so a screen reader announces a failed sign-in without
 * the user hunting for it.
 */
import { useState } from 'react';
import type { FormEvent } from 'react';

import type { LoginRequest } from '@payzeno/contracts';

import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Label } from '@components/ui/Label';
import { InlineError } from '@components/feedback/InlineError';

export interface LoginFormProps {
  onSubmit: (request: LoginRequest) => void;
  isPending: boolean;
  errorMessage: string | null;
  fieldErrors: Record<string, string>;
}

export function LoginForm({ onSubmit, isPending, errorMessage, fieldErrors }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending) return;
    onSubmit({ email: email.trim(), password });
  };

  const emailError = fieldErrors.email;
  const passwordError = fieldErrors.password;

  return (
    <form onSubmit={handleSubmit} noValidate>
      {errorMessage ? (
        <p role="alert" data-testid="login-error">
          {errorMessage}
        </p>
      ) : null}

      <Label htmlFor="login-email">Email</Label>
      <Input
        id="login-email"
        name="email"
        type="email"
        autoComplete="username"
        required
        value={email}
        aria-invalid={emailError ? true : undefined}
        aria-describedby={emailError ? 'login-email-error' : undefined}
        onChange={(event) => setEmail(event.target.value)}
      />
      {emailError ? <InlineError id="login-email-error">{emailError}</InlineError> : null}

      <Label htmlFor="login-password">Password</Label>
      <Input
        id="login-password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        aria-invalid={passwordError ? true : undefined}
        aria-describedby={passwordError ? 'login-password-error' : undefined}
        onChange={(event) => setPassword(event.target.value)}
      />
      {passwordError ? <InlineError id="login-password-error">{passwordError}</InlineError> : null}

      <Button type="submit" disabled={isPending || email.length === 0 || password.length === 0}>
        {isPending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
