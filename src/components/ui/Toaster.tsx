/**
 * Toast viewport.
 *
 * Mounted exactly once, by `<ToastProvider>`. It owns the queue and renders each `ToastSpec`
 * through `<Toast>`.
 *
 * The queue is capped: a failing settlement sweep can produce a dozen errors in a second, and a
 * wall of toasts is a denial of service against the page underneath. Oldest non-error toasts
 * are dropped first.
 */
import * as RadixToast from '@radix-ui/react-toast';

import { pz } from '@lib/cn';

import { Toast } from './Toast';
import type { ToastSpec } from './Toast';
import { space, zIndex } from './tokens';

/** Beyond this many visible toasts we start dropping the oldest dismissible one. */
export const MAX_VISIBLE_TOASTS = 4;

export interface ToasterProps {
  toasts: ReadonlyArray<ToastSpec>;
  onDismiss: (id: string) => void;
}

/**
 * Trim the queue to `MAX_VISIBLE_TOASTS`, preferring to keep errors.
 * Exported so `ToastProvider` can apply it at push time and the test can assert it directly.
 */
export function trimToasts(
  toasts: ReadonlyArray<ToastSpec>,
  max: number = MAX_VISIBLE_TOASTS,
): ToastSpec[] {
  if (toasts.length <= max) return [...toasts];

  const errors = toasts.filter((toast) => toast.tone === 'danger');
  const others = toasts.filter((toast) => toast.tone !== 'danger');

  const keptOthers = others.slice(Math.max(0, others.length - Math.max(0, max - errors.length)));
  const kept = [...errors.slice(Math.max(0, errors.length - max)), ...keptOthers];
