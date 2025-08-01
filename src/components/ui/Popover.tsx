/**
 * Popover.
 *
 * For interactive content anchored to a trigger — the date range picker, the column chooser,
 * the merchant switcher's search box. If the content is purely informational use `<Tooltip>`;
 * if it needs the rest of the page to go away use `<Dialog>`.
 */
import * as RadixPopover from '@radix-ui/react-popover';
import type { ReactNode } from 'react';

import { cn, pz } from '@lib/cn';

import { color, font, radius, shadow, space, zIndex } from './tokens';

export interface PopoverProps {
  trigger: ReactNode;
  children: ReactNode;
  /** Controlled open state. Omit for uncontrolled. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  /**
   * Accessible name for the popover surface. Omit **only** when the content itself is already
   * a labelled region (`<div role="group" aria-label="…">`) — otherwise the surface is an
   * anonymous dialog and a screen-reader user lands nowhere.
   */
  label?: string;
  width?: string;
  className?: string;
}

/** Close button for use inside popover content. */
export function PopoverClose({ children }: { children: ReactNode }) {
  return <RadixPopover.Close asChild>{children}</RadixPopover.Close>;
}
