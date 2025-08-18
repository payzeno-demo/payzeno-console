/**
 * Side drawer.
 *
 * Same primitive as `<Dialog>` (Radix dialog) with a different presentation: it slides from the
 * right and it does not block the page behind it visually. Used for the settlement item detail
 * peek and the webhook payload viewer, where the user wants to keep the list in view.
 *
 * It is still a modal — focus is trapped and the background is inert. A non-modal drawer needs
 * a different component and a different keyboard contract; do not "just remove the overlay".
 */
import * as RadixDialog from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';

import { cn, pz } from '@lib/cn';

import { IconButton } from './IconButton';
import { color, duration, font, shadow, space, zIndex } from './tokens';

export interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Drawer width. Anything wider than 640px should be a page. */
  width?: string;
  className?: string;
}

export function Drawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  width = '480px',
  className,
}: DrawerProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay
          style={{
            position: 'fixed',
            inset: 0,
            background: color.overlay,
            zIndex: zIndex.drawer,
          }}
        />
        <RadixDialog.Content
          className={cn(pz('drawer'), className)}
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: `min(${width}, 100vw)`,
            display: 'flex',
            flexDirection: 'column',
            background: color.surface,
            borderLeft: `1px solid ${color.border}`,
            boxShadow: shadow.lg,
            zIndex: zIndex.drawer,
            transition: `transform ${duration.normal} ease-out`,
          }}
        >
          <header
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: space[3],
              padding: space[5],
              borderBottom: `1px solid ${color.border}`,
            }}
          >
            <div>
              <RadixDialog.Title
                style={{
                  margin: 0,
