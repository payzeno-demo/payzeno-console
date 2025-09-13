/**
 * Label + control + hint + error, wired together.
 *
 * The whole point is that the wiring cannot be got wrong: this component owns the ids, so
 * `aria-describedby` always points at the hint and the error that are actually rendered, and
 * `aria-invalid` is always in sync with whether an error is showing.
 *
 * Children receive the wiring through a render prop rather than `cloneElement`, because
 * `cloneElement` silently does nothing when the child is wrapped in a fragment or a memo, and
 * that failure is invisible until someone runs a screen reader (PAY-1698 again).
 */
import type { ReactNode } from 'react';

import { pz } from '@lib/cn';

import { InlineError } from '../feedback/InlineError';
import { Label } from '../ui/Label';
import { color, font, space } from '../ui/tokens';
// One `errorIdFor` for the whole form layer. `useZodForm` derives `aria-describedby` from the
// same function, so a field wired by hand and a field wired by the hook agree on the id —
// they did not for two releases, and the error text was announced by neither (PAY-1698).
import { errorIdFor } from './field-errors';

export interface FieldWiring {
  id: string;
  'aria-describedby': string | undefined;
  'aria-invalid': true | undefined;
  required: boolean;
}

export interface FormFieldProps {
  /** Base id. The control gets it; hint and error get suffixed ids. */
  id: string;
  label: string;
  children: (wiring: FieldWiring) => ReactNode;
  /** Explanatory text under the label. Always associated, never a bare `<p>`. */
  hint?: string;
  error?: string;
  required?: boolean;
  /** Note next to the label: "optional", "staff only". */
  labelHint?: string;
}

export function hintIdFor(id: string): string {
  return `${id}-hint`;
}

export { errorIdFor };

/** Join the ids that actually exist, in reading order: hint first, then error. */
export function describedByFor(id: string, hasHint: boolean, hasError: boolean): string | undefined {
  const ids: string[] = [];
  if (hasHint) ids.push(hintIdFor(id));
  if (hasError) ids.push(errorIdFor(id));
  return ids.length > 0 ? ids.join(' ') : undefined;
}

export function FormField({
  id,
  label,
  children,
  hint,
  error,
  required = false,
  labelHint,
}: FormFieldProps) {
  const hasHint = Boolean(hint);
  const hasError = Boolean(error);

  const wiring: FieldWiring = {
    id,
    'aria-describedby': describedByFor(id, hasHint, hasError),
    'aria-invalid': hasError ? true : undefined,
    required,
  };

  return (
    <div className={pz('form-field')} style={{ display: 'grid', gap: space[1] }}>
      <Label htmlFor={id} required={required} hint={labelHint}>
        {label}
