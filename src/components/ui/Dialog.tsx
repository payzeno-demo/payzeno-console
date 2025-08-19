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

const WIDTHS: Record<DialogSize, string> = { sm: '400px', md: '520px', lg: '760px' };

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
  destructive = false,
  className,
}: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay
          style={{
            position: 'fixed',
            inset: 0,
            background: color.overlay,
            zIndex: zIndex.dialog,
          }}
        />
        <RadixDialog.Content
          className={cn(pz('dialog'), className)}
          onInteractOutside={(event) => {
            if (destructive) event.preventDefault();
          }}
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: `min(${WIDTHS[size]}, calc(100vw - ${space[8]}))`,
            maxHeight: `calc(100vh - ${space[16]})`,
            display: 'flex',
            flexDirection: 'column',
            background: color.surface,
            borderRadius: radius.lg,
            boxShadow: shadow.lg,
            zIndex: zIndex.dialog,
          }}
        >
          <header
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: space[4],
              padding: `${space[5]} ${space[5]} ${space[3]}`,
            }}
          >
            <div>
              <RadixDialog.Title
                style={{
                  margin: 0,
                  fontFamily: font.family,
                  fontSize: font.size.xl,
                  fontWeight: font.weight.semibold,
                  color: color.textPrimary,
                }}
              >
                {title}
              </RadixDialog.Title>
              {description ? (
                <RadixDialog.Description
                  style={{
                    margin: `${space[2]} 0 0`,
                    fontSize: font.size.md,
                    color: color.textSecondary,
                  }}
                >
                  {description}
                </RadixDialog.Description>
              ) : null}
            </div>
            <RadixDialog.Close asChild>
              <IconButton label="Close dialog" icon="✕" size="sm" />
            </RadixDialog.Close>
          </header>

          <div style={{ padding: `0 ${space[5]}`, overflowY: 'auto', flex: 1 }}>{children}</div>

          {footer ? (
            <footer
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: space[2],
                padding: space[5],
                borderTop: `1px solid ${color.border}`,
                marginTop: space[4],
              }}
            >
              {footer}
            </footer>
          ) : null}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

/** Cancel/confirm footer, since eleven dialogs render exactly this. */
export function DialogActions({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
