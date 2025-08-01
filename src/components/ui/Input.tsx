/**
 * Text input.
 *
 * The a11y contract, which `Input.test.tsx` asserts:
 *  - `id` is required, because `<Label htmlFor>` needs something to point at;
 *  - when `errorId` is passed the input gets `aria-invalid` **and** `aria-describedby`, so the
 *    error is announced rather than merely coloured red;
 *  - `describedBy` composes rather than replaces, so a field can have both a hint and an error.
 */
import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

import { cn, pz } from '@lib/cn';

import { color, font, radius, space } from './tokens';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  id: string;
  invalid?: boolean;
  /** Id of the element holding this field's error message. */
  errorId?: string;
  /** Id of a hint element. Merged with `errorId` into `aria-describedby`. */
  describedBy?: string;
  /** Rendered inside the field, before the text. Decorative. */
  prefix?: ReactNode;
  suffix?: ReactNode;
  className?: string;
}

/** Compose `aria-describedby` from every id that actually exists. */
export function describedByOf(...ids: Array<string | undefined>): string | undefined {
  const present = ids.filter((id): id is string => Boolean(id));
  return present.length > 0 ? present.join(' ') : undefined;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { id, invalid = false, errorId, describedBy, prefix, suffix, disabled, className, style, ...rest },
  ref,
) {
  const borderColor = invalid ? color.danger : color.borderStrong;

  const field = (
    <input
      {...rest}
      id={id}
      ref={ref}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      aria-describedby={describedByOf(describedBy, invalid ? errorId : undefined)}
      className={cn(pz('input'), invalid && pz('input', undefined, 'invalid'), className)}
      style={{
        flex: 1,
        minWidth: 0,
        height: '36px',
        padding: `0 ${space[3]}`,
        fontFamily: font.family,
        fontSize: font.size.md,
        color: color.textPrimary,
        background: disabled ? color.surfaceMuted : color.surface,
        border: prefix || suffix ? 'none' : `1px solid ${borderColor}`,
        borderRadius: radius.md,
        ...style,
      }}
    />
  );

  if (!prefix && !suffix) return field;

  return (
    <div
      className={pz('input', 'wrapper')}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: space[2],
        padding: `0 ${space[3]}`,
        background: disabled ? color.surfaceMuted : color.surface,
        border: `1px solid ${borderColor}`,
        borderRadius: radius.md,
      }}
    >
      {prefix ? (
        <span aria-hidden="true" style={{ color: color.textMuted, fontSize: font.size.sm }}>
          {prefix}
        </span>
      ) : null}
      {field}
      {suffix ? (
        <span aria-hidden="true" style={{ color: color.textMuted, fontSize: font.size.sm }}>
          {suffix}
        </span>
      ) : null}
    </div>
  );
});
