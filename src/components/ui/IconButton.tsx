/**
 * Icon-only button.
 *
 * Separate from `<Button>` for one reason: `label` is **required**. An icon button without an
 * accessible name is announced as "button" and nothing else, and this repo had eleven of them
 * before this component existed (PAY-1655).
 *
 * The label is applied as `aria-label` and, unless `hideTooltip` is set, is also the tooltip —
 * sighted users get the same information as screen-reader users, which is the whole point.
 */
import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn, pz } from '@lib/cn';

import { Tooltip } from './Tooltip';
import { color, radius, space } from './tokens';

export type IconButtonSize = 'sm' | 'md';
export type IconButtonVariant = 'ghost' | 'outline' | 'danger';

/**
 * Built-in glyphs, so a caller that just wants "the bell" does not have to import an icon.
 * Deliberately text glyphs: this repo ships no icon font and no SVG sprite (PAY-1655).
 */
export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  /**
   * The accessible name. Required in practice — when it is omitted the caller must pass
   * `aria-label` instead, and one of the two always wins.
   */
  label?: string;
  icon?: ReactNode;
  /** Built-in glyph, used when `icon` and `children` are both absent. */
  name?: IconName;
  size?: IconButtonSize;
  variant?: IconButtonVariant;
  /** For toggle buttons: renders `aria-pressed`. */
  pressed?: boolean;
  hideTooltip?: boolean;
  className?: string;
}

const SIZE_PX: Record<IconButtonSize, string> = { sm: '28px', md: '34px' };

function variantStyle(variant: IconButtonVariant): React.CSSProperties {
  switch (variant) {
    case 'ghost':
      return { background: 'transparent', border: '1px solid transparent', color: color.textSecondary };
    case 'outline':
      return { background: color.surface, border: `1px solid ${color.border}`, color: color.textPrimary };
    case 'danger':
      return { background: 'transparent', border: '1px solid transparent', color: color.danger };
  }
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    label,
    icon,
    name,
    size = 'md',
    variant = 'ghost',
    pressed,
    hideTooltip = false,
    disabled,
    type = 'button',
    className,
    style,
    children,
    ...rest
  },
  ref,
) {
  // One of `label` / `aria-label` must be present. `<IconButton>` exists precisely so that
  // this cannot be forgotten silently, so an unnamed one is named after its glyph rather than
  // announced as "button".
  const accessibleName = label ?? rest['aria-label'] ?? name ?? 'button';
  const glyph = icon ?? children ?? (name ? ICON_GLYPHS[name] : null);

  const button = (
    <button
      {...rest}
      ref={ref}
      type={type}
      disabled={disabled}
      aria-label={accessibleName}
      aria-pressed={pressed}
      className={cn(pz('icon-button'), pz('icon-button', undefined, variant), className)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: SIZE_PX[size],
        height: SIZE_PX[size],
        padding: space[1],
        borderRadius: radius.md,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        ...variantStyle(variant),
        ...style,
      }}
    >
      <span aria-hidden="true" style={{ display: 'inline-flex' }}>
        {glyph}
      </span>
    </button>
  );

  if (hideTooltip) return button;

  return <Tooltip content={accessibleName}>{button}</Tooltip>;
});
