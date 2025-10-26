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
