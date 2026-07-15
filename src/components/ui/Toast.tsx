/**
 * Toast — the single notification's presentation.
 *
 * `<Toaster>` owns the viewport and the queue; this file owns one toast and the shape of the
 * data behind it.
 *
 * a11y: error toasts get `role="alert"` (assertive) and never auto-dismiss; everything else is
 * polite and times out. An error that vanishes after five seconds is an error the user did not
 * read.
 */
import * as RadixToast from '@radix-ui/react-toast';
import type { ReactNode } from 'react';

import { cn, pz } from '@lib/cn';

import { color, font, radius, shadow, space, toneStyle } from './tokens';
import type { Tone } from './tokens';

export type ToastTone = Extract<Tone, 'success' | 'danger' | 'info' | 'warning'>;

export interface ToastSpec {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
  /** Milliseconds. `null` means it stays until dismissed — the default for `danger`. */
  durationMs: number | null;
  /** Optional single action, e.g. "View settlement". */
  action?: { label: string; onSelect: () => void };
}

export interface ToastProps {
  spec: ToastSpec;
  onOpenChange: (open: boolean) => void;
  className?: string;
}

export function Toast({ spec, onOpenChange, className }: ToastProps) {
  const palette = toneStyle(spec.tone);
  const assertive = spec.tone === 'danger';

  return (
    <RadixToast.Root
      open
      onOpenChange={onOpenChange}
      duration={spec.durationMs ?? Number.POSITIVE_INFINITY}
      type={assertive ? 'foreground' : 'background'}
      className={cn(pz('toast'), pz('toast', undefined, spec.tone), className)}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        alignItems: 'start',
        gap: space[3],
        width: '360px',
        padding: space[4],
        fontFamily: font.family,
        background: color.surface,
        // The tone is carried by a 3px left rule, not by the whole background: a fully
        // tinted toast fails contrast against its own body text at these tints.
        borderLeft: `3px solid ${palette.fg}`,
        border: `1px solid ${color.border}`,
        borderRadius: radius.md,
        boxShadow: shadow.md,
      }}
    >
      <div>
        <RadixToast.Title
          style={{
            margin: 0,
            fontSize: font.size.md,
            fontWeight: font.weight.semibold,
            color: color.textPrimary,
          }}
        >
          {spec.title}
        </RadixToast.Title>
        {spec.description ? (
          <RadixToast.Description
            style={{ margin: `${space[1]} 0 0`, fontSize: font.size.sm, color: color.textSecondary }}
          >
