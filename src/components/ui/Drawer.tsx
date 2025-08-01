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
