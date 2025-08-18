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

export function Popover({
  trigger,
  children,
  open,
  onOpenChange,
  align = 'start',
  side = 'bottom',
  label,
  width = '280px',
  className,
}: PopoverProps) {
  return (
    <RadixPopover.Root open={open} onOpenChange={onOpenChange}>
      <RadixPopover.Trigger asChild>{trigger}</RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content
          align={align}
          side={side}
          sideOffset={6}
          aria-label={label}
          className={cn(pz('popover'), className)}
          style={{
            width,
            maxHeight: '70vh',
            overflowY: 'auto',
            padding: space[3],
            fontFamily: font.family,
            fontSize: font.size.md,
            color: color.textPrimary,
            background: color.surface,
            border: `1px solid ${color.border}`,
            borderRadius: radius.md,
            boxShadow: shadow.md,
            zIndex: zIndex.popover,
          }}
        >
          {children}
          <RadixPopover.Arrow style={{ fill: color.surface }} />
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}

/** Close button for use inside popover content. */
export function PopoverClose({ children }: { children: ReactNode }) {
  return <RadixPopover.Close asChild>{children}</RadixPopover.Close>;
}
