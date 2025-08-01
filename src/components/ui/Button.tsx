/**
 * Button.
 *
 * Rules this component enforces so call sites cannot get them wrong:
 *  - `type` defaults to `button`, never `submit` (a stray submit inside a form is the single
 *    most common bug this design system has shipped);
 *  - a loading button stays focusable and announces itself via `aria-busy`, rather than
 *    disappearing under a spinner;
 *  - an icon-only button is not this component — use `<IconButton />`, which requires a label.
 */
import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn, pz } from '@lib/cn';

import { Spinner } from './Spinner';
import { color, font, radius, shadow, space } from './tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner, sets `aria-busy`, and blocks the click. Does not unmount the label. */
  isLoading?: boolean;
  /** Decorative only — it gets `aria-hidden`. Meaning belongs in the label. */
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
  className?: string;
}

const SIZE_STYLES: Record<ButtonSize, { padding: string; fontSize: string; height: string }> = {
  sm: { padding: `0 ${space[3]}`, fontSize: font.size.sm, height: '28px' },
  md: { padding: `0 ${space[4]}`, fontSize: font.size.md, height: '36px' },
  lg: { padding: `0 ${space[5]}`, fontSize: font.size.lg, height: '44px' },
};

function variantStyle(variant: ButtonVariant): React.CSSProperties {
  switch (variant) {
    case 'primary':
      return { background: color.brand, color: color.textInverse, border: '1px solid transparent' };
    case 'secondary':
      return {
        background: color.surface,
        color: color.textPrimary,
        border: `1px solid ${color.borderStrong}`,
      };
    case 'ghost':
      return { background: 'transparent', color: color.textSecondary, border: '1px solid transparent' };
    case 'danger':
      return { background: color.danger, color: color.textInverse, border: '1px solid transparent' };
  }
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    isLoading = false,
    leadingIcon,
    trailingIcon,
    fullWidth = false,
    disabled,
    type = 'button',
    children,
    className,
    style,
    onClick,
    ...rest
  },
  ref,
) {
  const sizing = SIZE_STYLES[size];
  const isDisabled = disabled === true || isLoading;

  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={isLoading || undefined}
      className={cn(pz('button'), pz('button', undefined, variant), className)}
      onClick={(event) => {
        if (isLoading) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: space[2],
        width: fullWidth ? '100%' : undefined,
        height: sizing.height,
        padding: sizing.padding,
        fontFamily: font.family,
        fontSize: sizing.fontSize,
        fontWeight: font.weight.medium,
        borderRadius: radius.md,
        boxShadow: variant === 'ghost' ? shadow.none : shadow.sm,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
        ...variantStyle(variant),
        ...style,
      }}
    >
      {isLoading ? <Spinner size="sm" label="" /> : null}
      {leadingIcon && !isLoading ? <span aria-hidden="true">{leadingIcon}</span> : null}
      <span>{children}</span>
      {trailingIcon ? <span aria-hidden="true">{trailingIcon}</span> : null}
    </button>
  );
});
