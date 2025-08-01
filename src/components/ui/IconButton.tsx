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

