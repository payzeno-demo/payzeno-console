/**
 * Card entry — arc PCI.
 *
 * This component replaced `CardNumberInput.tsx`, which posted the PAN to payzeno-api and put
 * Payzeno's entire API tier in PCI scope. The rules it exists to enforce, from ADR 0003:
 *
 *  1. The PAN goes **directly** from this browser to the vault at `VITE_VAULT_PUBLIC_URL`.
 *     It never touches `ApiClient`, never enters TanStack Query, and never reaches
 *     payzeno-api. The `fetch` below is the only network call in the repo that does not go
 *     through `api/client.ts`, and that is deliberate — routing it through the client would
 *     put the card number into the request breadcrumb pipeline.
 *  2. The PAN is never stored in React state that outlives the submit. `pan` lives in a ref
 *     and is cleared the moment a token comes back or the component unmounts.
 *  3. Nothing here is ever passed to `captureError` / `trackEvent`. The only thing we report
 *     is the vault's own reference. dhotfix reviews every change to this file.
 *  4. The authorisation for the vault call is derived from `payment_intent.client_secret`,
 *     which is scoped to exactly one intent (`AuthPrincipal.kind === 'client_secret'`).
 *
 * a11y: three separate labelled inputs rather than one combined field, `autoComplete` values
 * that let a password manager fill them, and `aria-describedby` on every error.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import type { PaymentMethodToken } from '@payzeno/contracts';

import { vaultUrl } from '@config/runtime';
import { pz } from '@lib/cn';
import { VaultTokenisationError } from '@lib/errors';
import { captureError } from '@lib/telemetry';

import { InlineError } from '../feedback/InlineError';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { color, font, radius, space } from '../ui/tokens';

export interface TokenizedCardInputProps {
  /** Scopes the vault call to one payment intent. Never logged, never stored. */
  clientSecret: string;
  /** Receives the `pmt_…` token. This is the only value that leaves this component. */
  onToken: (token: PaymentMethodToken, lastFour: string) => void;
  onError?: (error: VaultTokenisationError) => void;
  disabled?: boolean;
  submitLabel?: string;
}

interface VaultTokenResponse {
  token: string;
  last_four: string;
  reference?: string;
}

/** Digits only, 12–19. Full validation is the vault's job; this is a typo guard. */
export function looksLikePan(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 12 && digits.length <= 19;
}

/** `12/29` or `1229` → `{ month: 12, year: 2029 }`. Returns null for anything else. */
export function parseExpiry(value: string): { month: number; year: number } | null {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 4) return null;

  const month = Number.parseInt(digits.slice(0, 2), 10);
  const year = 2000 + Number.parseInt(digits.slice(2), 10);
  if (month < 1 || month > 12) return null;

  return { month, year };
}

export function isExpired(month: number, year: number, now: Date = new Date()): boolean {
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
  return endOfMonth.getTime() < now.getTime();
}

/** 4-digit groups, for readability while typing. Display only — never sent anywhere. */
export function groupDigits(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 19);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

export function TokenizedCardInput({
  clientSecret,
  onToken,
  onError,
  disabled = false,
  submitLabel = 'Save card',
}: TokenizedCardInputProps) {
  // The PAN and CVV live in refs, not state — a re-render must not be able to leak them into
  // a React DevTools snapshot or a component-state error report.
  const panRef = useRef('');
  const cvvRef = useRef('');

  const [display, setDisplay] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvvLength, setCvvLength] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  // Belt and braces: wipe on unmount even though nothing here survives it.
  useEffect(
    () => () => {
      panRef.current = '';
      cvvRef.current = '';
    },
    [],
  );

  const tokenise = useCallback(async () => {
    setError(null);

    if (!looksLikePan(panRef.current)) {
      setError('That card number does not look right.');
      return;
    }

    const parsedExpiry = parseExpiry(expiry);
    if (!parsedExpiry) {
      setError('Enter the expiry as MM/YY.');
      return;
    }
    if (isExpired(parsedExpiry.month, parsedExpiry.year)) {
      setError('That card has expired.');
      return;
    }
    if (cvvRef.current.length < 3) {
      setError('Enter the security code from the back of the card.');
      return;
    }

    setSubmitting(true);
    try {
      // One of the two fetches in this repo that bypass ApiClient — the other is
      // AddBankAccountDialog, which does the same thing for bank details. See the header.
      // eslint-disable-next-line no-restricted-syntax -- ADR 0003: the PAN goes to the vault's origin, never through ApiClient.
      const response = await fetch(vaultUrl('/public/tokens'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${clientSecret}`,
        },
        body: JSON.stringify({
          type: 'card',
          number: panRef.current,
          exp_month: parsedExpiry.month,
          exp_year: parsedExpiry.year,
          cvc: cvvRef.current,
        }),
      });

      if (!response.ok) {
        const reference = response.headers.get('X-Vault-Reference');
        throw new VaultTokenisationError(
          response.status === 422
            ? 'The card was rejected. Check the number and try again.'
            : 'We could not save that card. Please try again.',
          reference,
        );
      }

      const body = (await response.json()) as VaultTokenResponse;

      // Wipe before anything else can observe the component.
      panRef.current = '';
      cvvRef.current = '';
      setDisplay('');
      setExpiry('');
      setCvvLength(0);

      onToken(body.token, body.last_four);
    } catch (thrown) {
      const failure =
        thrown instanceof VaultTokenisationError
          ? thrown
          : new VaultTokenisationError('We could not reach the card vault. Please try again.');

      setError(failure.displayMessage);
      // Only the vault reference is reported. No field of the card is in scope here.
      captureError(failure, { feature: 'tokenized-card-input', code: failure.clientCode });
      onError?.(failure);
    } finally {
      setSubmitting(false);
    }
  }, [clientSecret, expiry, onError, onToken]);

  const errorId = error ? 'card-input-error' : undefined;

  return (
    <div
      className={pz('card-input')}
      style={{
        display: 'grid',
        gap: space[3],
        padding: space[4],
        border: `1px solid ${color.border}`,
        borderRadius: radius.lg,
        fontFamily: font.family,
      }}
    >
      <div style={{ display: 'grid', gap: space[1] }}>
        <Label htmlFor="card-number" required>
          Card number
        </Label>
        <Input
          id="card-number"
          type="text"
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="4242 4242 4242 4242"
          disabled={disabled || isSubmitting}
          invalid={Boolean(error)}
          errorId={errorId}
          value={display}
          onChange={(event) => {
            panRef.current = event.target.value.replace(/\D/g, '').slice(0, 19);
            setDisplay(groupDigits(event.target.value));
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: space[3] }}>
        <div style={{ display: 'grid', gap: space[1] }}>
          <Label htmlFor="card-expiry" required>
            Expiry
          </Label>
          <Input
            id="card-expiry"
            type="text"
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/YY"
            maxLength={5}
            disabled={disabled || isSubmitting}
            value={expiry}
            onChange={(event) => setExpiry(event.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gap: space[1] }}>
          <Label htmlFor="card-cvv" required>
            Security code
          </Label>
          <Input
            id="card-cvv"
            type="password"
            inputMode="numeric"
            autoComplete="cc-csc"
            maxLength={4}
            disabled={disabled || isSubmitting}
            // Value comes from the ref's length only — the digits are never in state.
            value={'•'.repeat(cvvLength)}
            onChange={(event) => {
              const digits = event.target.value.replace(/[^\d]/g, '').slice(0, 4);
              cvvRef.current = digits.length > 0 ? digits : cvvRef.current.slice(0, digits.length);
              setCvvLength(event.target.value.length);
            }}
          />
        </div>
      </div>

      {error ? <InlineError id="card-input-error">{error}</InlineError> : null}

      <p style={{ margin: 0, fontSize: font.size.sm, color: color.textMuted }}>
        Card details go straight to our card vault. Payzeno stores only the last four digits.
      </p>

      <div>
        <Button
          type="button"
          variant="primary"
          disabled={disabled}
          isLoading={isSubmitting}
          onClick={() => {
            void tokenise();
          }}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
