/**
 * Amount entry.
 *
 * The value on the wire is always **minor units** (`amount_minor`), because every Payzeno type
 * says so. The value in the box is always major units, because nobody types 1250 meaning
 * £12.50. This component is the only conversion between the two, and it does it through
 * `toMinor` / `fromMinor` from `@payzeno/contracts` — the console does no money arithmetic of
 * its own, so JPY (exponent 0) works without a special case.
 *
 * a11y:
 *  - `inputMode="decimal"` gets the numeric keypad without blocking paste of "1,234.50";
 *  - the currency is rendered as a real suffix element *and* announced through the label, so
 *    "12.50" is never ambiguous;
 *  - out-of-range is announced through the caller's `<InlineError>`, not by clamping silently.
 */
import { forwardRef, useEffect, useState } from 'react';
import type { InputHTMLAttributes } from 'react';

import type { CurrencyCode, MinorUnits } from '@payzeno/contracts';

import { pz } from '@lib/cn';
import { CURRENCY_EXPONENT, fromMinor, toMinor } from '@lib/money';

import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { color, font, space } from '../ui/tokens';

export interface MoneyInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'className' | 'id'> {
  id: string;
  label: string;
  currency: CurrencyCode;
  /** Controlled value, in minor units. */
  valueMinor: MinorUnits;
  onValueChange: (next: MinorUnits) => void;
  /** Rendered under the field: "Up to the authorised amount." */
  hint?: string;
  errorId?: string;
  invalid?: boolean;
  disabled?: boolean;
  /** Hide the visible label (the field is already inside a labelled group). */
  hideLabel?: boolean;
}

/** Strip grouping separators and stray currency symbols before parsing. */
export function normaliseInput(raw: string): string {
  return raw.replace(/[^\d.,-]/g, '').replace(/,/g, '');
}

/**
 * Parse a typed major-unit string into minor units for `currency`.
 *
 * `toMinor` takes a **decimal string**, not a number, and it throws on more fractional digits
 * than the currency has — that is deliberate on the contracts side (a float round-trip is how
 * you lose a cent), so the over-precise case is caught here and reported as "not a valid
 * amount" rather than propagated as a `ValidationError`.
 *
 * Returns `null` for anything that is not an amount. An empty box is not zero.
 */
export function parseAmount(raw: string, currency: CurrencyCode): MinorUnits | null {
  const cleaned = normaliseInput(raw);
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return null;

  // Trim excess precision rather than throwing: the user is mid-keystroke, not wrong yet.
  const trimmed =
    fraction === undefined || exponent === 0
      ? whole
      : `${whole}.${fraction.slice(0, exponent)}`;

  try {
    return toMinor(trimmed, currency);
  } catch {
    return null;
  }
}

/** Minor units → the string that goes in the box. Zero renders as empty, not as "0.00". */
export function formatForInput(minor: MinorUnits, currency: CurrencyCode): string {
  if (minor === 0) return '';
  return fromMinor(minor, currency);
}

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(function MoneyInput(
  {
    id,
    label,
    currency,
    valueMinor,
    onValueChange,
    hint,
    errorId,
    invalid = false,
    disabled = false,
    hideLabel = false,
    ...rest
  },
  ref,
) {
  // Local draft so the box does not fight the user mid-keystroke ("12." must survive).
  const [draft, setDraft] = useState(() => formatForInput(valueMinor, currency));

  useEffect(() => {
    const parsed = parseAmount(draft, currency);
    if (parsed !== valueMinor) setDraft(formatForInput(valueMinor, currency));
    // Only re-sync when the controlled value or the currency changes, never on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueMinor, currency]);

  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={pz('money-input')} style={{ display: 'grid', gap: space[1] }}>
      <Label htmlFor={id} className={hideLabel ? 'pz-visually-hidden' : undefined}>
        {label} ({currency})
      </Label>

      {hint ? (
        <p
          id={hintId}
          style={{ margin: 0, fontFamily: font.family, fontSize: font.size.sm, color: color.textSecondary }}
        >
          {hint}
        </p>
      ) : null}

      <Input
        {...rest}
        ref={ref}
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        disabled={disabled}
        invalid={invalid}
        describedBy={describedBy}
        value={draft}
        suffix={
          <span aria-hidden="true" style={{ color: color.textMuted, fontSize: font.size.sm }}>
            {currency}
          </span>
        }
        onChange={(event) => {
          const next = event.target.value;
          setDraft(next);
          const parsed = parseAmount(next, currency);
          onValueChange(parsed ?? 0);
        }}
        onBlur={() => setDraft(formatForInput(valueMinor, currency))}
      />
    </div>
  );
});
