/**
 * Modal dialog.
 *
 * Radix gives us the focus trap, the scroll lock and the escape handling. What this wrapper
 * adds is the parts teams get wrong:
 *  - `title` is required and is wired to `aria-labelledby`;
 *  - `description` is wired to `aria-describedby` — Radix warns loudly when it is missing;
 *  - a destructive dialog cannot be dismissed by clicking the overlay, because "I clicked next
 *    to the refund dialog and it cancelled" is fine but "…and it submitted" is not.
 */
import * as RadixDialog from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';

import { cn, pz } from '@lib/cn';

import { IconButton } from './IconButton';
import { color, font, radius, shadow, space, zIndex } from './tokens';

export type DialogSize = 'sm' | 'md' | 'lg';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Footer buttons. Primary action last, matching platform convention. */
  footer?: ReactNode;
  size?: DialogSize;
  /** Set for anything that moves money. Disables overlay dismissal. */
  destructive?: boolean;
  className?: string;
}

