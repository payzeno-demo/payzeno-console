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

export function Tooltip({
  children,
  content,
  side = 'top',
  disabled = false,
  delayMs = 300,
  className,
}: TooltipProps) {
  if (disabled || content === '' || content === null || content === undefined) {
    return <>{children}</>;
  }

  return (
    <RadixTooltip.Root delayDuration={delayMs}>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={6}
          className={cn(pz('tooltip'), className)}
          style={{
            maxWidth: '260px',
            padding: `${space[2]} ${space[3]}`,
            fontFamily: font.family,
            fontSize: font.size.sm,
            lineHeight: font.lineHeight.normal,
            color: color.textInverse,
            background: color.surfaceInverse,
            borderRadius: radius.md,
            boxShadow: shadow.md,
            zIndex: zIndex.popover,
          }}
        >
          {content}
          <RadixTooltip.Arrow style={{ fill: color.surfaceInverse }} />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}

/**
 * The single provider mount. `<AppProviders>` renders this; nothing else should.
 * `skipDelayDuration` keeps a row of icon buttons from re-delaying on every hop.
 */
