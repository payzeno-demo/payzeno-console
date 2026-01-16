/**
 * Inline alert.
 *
 * For state that belongs on the page rather than in a toast: a negative balance, a legacy
 * invoice notice, an upstream that is degraded. Persistent, not transient.
 *
 * `role` follows severity: `alert` for danger (assertive, interrupts), `status` for warning and
 * info (polite). Getting this wrong either shouts routine information at a screen-reader user
 * or silently swallows an urgent one.
 */
import type { ReactNode } from 'react';

import { cn, pz } from '@lib/cn';

import { color, font, radius, space, toneStyle } from './tokens';
import type { Tone } from './tokens';

/** `critical` is an alias for `danger`, same as on `<Badge>`. */
export type AlertTone = Extract<Tone, 'info' | 'warning' | 'danger' | 'success'> | 'critical';

function resolveAlertTone(tone: AlertTone): Extract<Tone, 'info' | 'warning' | 'danger' | 'success'> {
  return tone === 'critical' ? 'danger' : tone;
}

export interface AlertProps {
  tone: AlertTone;
  /** Override the severity-derived role. Only ever to soften, never to shout. */
  role?: 'alert' | 'status';
  title: string;
  children?: ReactNode;
  /** A single call to action — "Add a bank account", "Retry". */
  action?: ReactNode;
  /** Renders a dismiss button. Omit for alerts describing a persistent condition. */
  onDismiss?: () => void;
  className?: string;
}

const ICONS: Record<Extract<Tone, 'info' | 'warning' | 'danger' | 'success'>, string> = {
  info: 'ℹ',
  warning: '⚠',
  danger: '⨯',
  success: '✓',
};

export function Alert({ tone, role, title, children, action, onDismiss, className }: AlertProps) {
  const resolved = resolveAlertTone(tone);
  const palette = toneStyle(resolved);

  return (
    <div
      role={role ?? (resolved === 'danger' ? 'alert' : 'status')}
      className={cn(pz('alert'), pz('alert', undefined, resolved), className)}
