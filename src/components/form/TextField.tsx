/**
 * `FormField` + `Input`, for the common case of one labelled text control.
 *
 * `Input` computes its own `aria-invalid` / `aria-describedby` from `invalid`, `errorId` and
 * `describedBy`, so spreading `FormField`'s wiring onto it would be silently overwritten. This
 * component maps the wiring onto `Input`'s own props instead, so the hint and the error are
 * both announced (PAY-1698's failure mode, avoided by construction).
 *
 * Added with RFC platform-v2's account and onboarding forms. Presentational only.
 */
import type { InputHTMLAttributes } from 'react';

import { Input } from '../ui/Input';

import { FormField, errorIdFor, hintIdFor } from './FormField';

export interface TextFieldProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'id' | 'value' | 'onChange' | 'className' | 'prefix' | 'required'
  > {
  id: string;
  label: string;
  value: string;
  onValueChange: (next: string) => void;
  hint?: string;
  error?: string;
  required?: boolean;
  labelHint?: string;
}

export function TextField({
  id,
  label,
  value,
  onValueChange,
  hint,
  error,
  required = false,
  labelHint,
  ...inputProps
}: TextFieldProps) {
  return (
    <FormField
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      labelHint={labelHint}
    >
      {() => (
        <Input
          {...inputProps}
          id={id}
          required={required}
          value={value}
          invalid={Boolean(error)}
          errorId={error ? errorIdFor(id) : undefined}
          describedBy={hint ? hintIdFor(id) : undefined}
          onChange={(event) => onValueChange(event.target.value)}
        />
      )}
    </FormField>
  );
}
