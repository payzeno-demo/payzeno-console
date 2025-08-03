/**
 * Copy to clipboard, with the "Copied" state the `<IdCell />` and `<SecretRevealOnce />`
 * components render.
 *
 * a11y (tflexbox): the visual tick is not enough. Callers must also render the status into an
 * `aria-live="polite"` region — `announcement` below is exactly that string.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { trackEvent } from '@lib/telemetry';

export type CopyStatus = 'idle' | 'copied' | 'error';

export interface Clipboard {
  status: CopyStatus;
  /** Copy `text`. Resolves to whether it worked; never throws. */
  copy: (text: string, label?: string) => Promise<boolean>;
  /** Screen-reader announcement for the current status. Empty when idle. */
  announcement: string;
}

/** Fallback for insecure contexts (http staging), where `navigator.clipboard` is undefined. */
function legacyCopy(text: string): boolean {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();

  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  } finally {
    document.body.removeChild(textarea);
  }
  return ok;
}

export function useCopyToClipboard(resetAfterMs = 2_000): Clipboard {
  const [status, setStatus] = useState<CopyStatus>('idle');
  const [label, setLabel] = useState('Value');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = useCallback(
    async (text: string, what = 'Value'): Promise<boolean> => {
      setLabel(what);
      let ok: boolean;

      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
          ok = true;
        } else {
          ok = legacyCopy(text);
        }
      } catch {
        ok = false;
      }

      setStatus(ok ? 'copied' : 'error');
      // Deliberately does not log the value. Some of the things copied here are API key
      // secrets (arc PCI).
      trackEvent('clipboard.copy', { label: what, ok });

      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setStatus('idle'), resetAfterMs);

      return ok;
    },
    [resetAfterMs],
  );

  const announcement =
    status === 'copied' ? `${label} copied to clipboard` : status === 'error' ? `Could not copy ${label}` : '';

  return { status, copy, announcement };
}
