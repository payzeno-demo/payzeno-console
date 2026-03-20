/**
 * A field-level or form-level error message.
 *
 * The `id` is **required**, because the only correct way to use this is to point the control's
 * `aria-describedby` at it. An error message that is visually next to an input but not
 * programmatically associated with it does not exist for a screen-reader user, and this repo
 * shipped seventeen of those before the rule went into the ESLint config (PAY-1698).
 *
 *     <Input id="amount" aria-describedby={err ? 'amount-error' : undefined} />
 *     {err ? <InlineError id="amount-error">{err}</InlineError> : null}
 *
 * `role` defaults to `alert` for form-level errors (something just failed) and can be dropped
 * to `status` for validation that appears as you type, which should not interrupt.
 */
import type { ReactNode } from 'react';

import { pz } from '@lib/cn';

import { color, font, space } from '../ui/tokens';

export interface InlineErrorProps {
  /** Required. Must match the control's `aria-describedby`. */
  id: string;
  children: ReactNode;
  /** `alert` interrupts, `status` waits for a pause. Live validation should use `status`. */
  severity?: 'alert' | 'status';
  /** Renders the warning tone instead of danger — for "this will be delayed", not "this failed". */
  tone?: 'danger' | 'warning';
}

export function InlineError({ id, children, severity = 'alert', tone = 'danger' }: InlineErrorProps) {
  return (
    <p
      id={id}
      role={severity}
      className={pz('inline-error', undefined, tone)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: space[1],
        margin: `${space[1]} 0 0`,
        fontFamily: font.family,
        fontSize: font.size.sm,
        lineHeight: font.lineHeight.normal,
        color: tone === 'danger' ? color.danger : color.warning,
      }}
    >
      <span aria-hidden="true">{tone === 'danger' ? '⚠' : 'ⓘ'}</span>
      <span>{children}</span>
    </p>
  );
}

