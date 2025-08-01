/**
 * Tooltip.
 *
 * Hard rule: a tooltip may **repeat** information, never carry it exclusively. Touch users and
 * keyboard users on some platforms will never see it. If the only place a rule is stated is a
 * tooltip, it is not stated.
 *
 * The provider is mounted once by `<AppProviders>`; this component assumes it exists.
 */
import * as RadixTooltip from '@radix-ui/react-tooltip';
import type { ReactNode } from 'react';

import { cn, pz } from '@lib/cn';

import { color, font, radius, shadow, space, zIndex } from './tokens';

export interface TooltipProps {
  /** The trigger. Must be a single element that can hold a ref and receive focus. */
  children: ReactNode;
  content: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Suppress rendering entirely (a disabled control that has no explanation). */
  disabled?: boolean;
  delayMs?: number;
  className?: string;
}

