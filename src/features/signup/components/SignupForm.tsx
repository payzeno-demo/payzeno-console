/**
 * The self-serve signup form (RFC platform-v2 §3): the owner's login, plus just enough about
 * the business to open test mode. Everything KYC-shaped is asked later, on `/onboarding`,
 * after the email address is proven.
 *
 * Presentational: `SignupPage` hands it `useSignup()`'s result.
 */
import { useState } from 'react';
import type { FormEvent } from 'react';

import { COUNTRY_CURRENCY } from '@payzeno/contracts';
import type { CurrencyCode, SignupRequest } from '@payzeno/contracts';

import { InlineError } from '@components/feedback/InlineError';
import { CurrencySelect } from '@components/form/CurrencySelect';
import { TextField } from '@components/form/TextField';
import { Button } from '@components/ui/Button';
import { Select } from '@components/ui/Select';
import { MIN_PASSWORD_LENGTH } from '@features/auth/password';

/** Countries Payzeno onboards today: the adaptive-pricing table's keys. */
const SIGNUP_COUNTRIES: ReadonlyArray<{ code: string; name: string }> = [
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'IL', name: 'Israel' },
  { code: 'JP', name: 'Japan' },
];

export interface SignupFormProps {
  onSubmit: (request: SignupRequest) => void;
  isPending: boolean;
  errorMessage: string | null;
  fieldErrors: Record<string, string>;
}

export function SignupForm({ onSubmit, isPending, errorMessage, fieldErrors }: SignupFormProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [legalName, setLegalName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [country, setCountry] = useState('GB');
  const [currency, setCurrency] = useState<CurrencyCode>('GBP');
  const [tooShort, setTooShort] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending) return;
    if (password.length < MIN_PASSWORD_LENGTH) {
      setTooShort(true);
      return;
    }
    setTooShort(false);
    onSubmit({
      full_name: fullName.trim(),
      email: email.trim(),
      password,
      legal_name: legalName.trim(),
      display_name: displayName.trim() || legalName.trim(),
      country,
      default_currency: currency,
    });
  };

  const complete =
    fullName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length > 0 &&
    legalName.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Create your Payzeno account">
      {errorMessage ? (
        <p role="alert" data-testid="signup-error">
          {errorMessage}
        </p>
      ) : null}

      <fieldset>
        <legend>You</legend>
        <TextField
          id="signup-full-name"
          label="Your full name"
          autoComplete="name"
          required
          value={fullName}
          onValueChange={setFullName}
          error={fieldErrors.full_name}
        />
        <TextField
          id="signup-email"
          label="Work email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onValueChange={setEmail}
          error={fieldErrors.email}
        />
        <TextField
          id="signup-password"
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          value={password}
          onValueChange={setPassword}
          error={
            fieldErrors.password ??
            (tooShort ? `Use at least ${MIN_PASSWORD_LENGTH} characters.` : undefined)
          }
        />
      </fieldset>

      <fieldset>
        <legend>Your business</legend>
        <TextField
          id="signup-legal-name"
          label="Legal business name"
          autoComplete="organization"
          required
          value={legalName}
          onValueChange={setLegalName}
          error={fieldErrors.legal_name}
        />
        <TextField
          id="signup-display-name"
          label="Name customers see"
          hint="On receipts and card statements. Defaults to the legal name."
          value={displayName}
          onValueChange={setDisplayName}
          error={fieldErrors.display_name}
        />
        <Select
          id="signup-country"
          label="Country"
          value={country}
          onValueChange={(next) => {
            setCountry(next);
            const local = COUNTRY_CURRENCY[next];
            if (local) setCurrency(local);
          }}
          options={SIGNUP_COUNTRIES.map((entry) => ({ value: entry.code, label: entry.name }))}
          invalid={Boolean(fieldErrors.country)}
          errorId="signup-country-error"
        />
        {fieldErrors.country ? (
          <InlineError id="signup-country-error">{fieldErrors.country}</InlineError>
        ) : null}
        <CurrencySelect
          id="signup-currency"
          label="Default currency"
          value={currency}
          onChange={setCurrency}
        />
      </fieldset>

      <Button type="submit" disabled={isPending || !complete}>
        {isPending ? 'Creating your account…' : 'Create account'}
      </Button>
    </form>
  );
}
