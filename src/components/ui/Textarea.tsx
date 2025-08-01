/**
 * Multi-line text input.
 *
 * Used by dispute evidence (`uncategorized_text`) and the payout statement descriptor note.
 * Same a11y contract as `<Input>`: required `id`, composed `aria-describedby`, `aria-invalid`
 * on error.
 *
 * When `maxLength` is set it renders a live character counter in an `aria-live="polite"`
 * region — silently truncating a merchant's 4,000-character evidence narrative is not an
 * option.
 */
import { forwardRef, useId } from 'react';
import type { TextareaHTMLAttributes } from 'react';

import { cn, pz } from '@lib/cn';

import { describedByOf } from './Input';
import { color, font, radius, space } from './tokens';

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  id: string;
  invalid?: boolean;
  errorId?: string;
  describedBy?: string;
  /** Show "1,204 / 4,000". Requires `maxLength`. */
  showCounter?: boolean;
  className?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    id,
    invalid = false,
    errorId,
    describedBy,
    showCounter = false,
    maxLength,
    rows = 4,
    value,
    disabled,
    className,
    style,
    ...rest
  },
  ref,
) {
  const counterId = useId();
  const length = typeof value === 'string' ? value.length : 0;
  const withCounter = showCounter && typeof maxLength === 'number';
  const nearLimit = withCounter && maxLength - length <= 50;

  return (
    <div className={pz('textarea', 'wrapper')}>
      <textarea
        {...rest}
        id={id}
        ref={ref}
        rows={rows}
        value={value}
        maxLength={maxLength}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-describedby={describedByOf(
          describedBy,
          withCounter ? counterId : undefined,
          invalid ? errorId : undefined,
        )}
        className={cn(pz('textarea'), className)}
        style={{
          width: '100%',
          padding: space[3],
          fontFamily: font.family,
          fontSize: font.size.md,
          lineHeight: font.lineHeight.normal,
          color: color.textPrimary,
          background: disabled ? color.surfaceMuted : color.surface,
          border: `1px solid ${invalid ? color.danger : color.borderStrong}`,
          borderRadius: radius.md,
          resize: 'vertical',
          ...style,
        }}
      />
      {withCounter ? (
        <p
          id={counterId}
          aria-live="polite"
          style={{
            margin: `${space[1]} 0 0`,
            textAlign: 'right',
            fontSize: font.size.xs,
            color: nearLimit ? color.warning : color.textMuted,
          }}
        >
          {length.toLocaleString()} / {maxLength.toLocaleString()}
        </p>
      ) : null}
    </div>
  );
});
