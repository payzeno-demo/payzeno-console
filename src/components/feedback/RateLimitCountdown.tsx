/**
 * 429 — the merchant hit the dashboard rate limit.
 *
 * `RateLimitedApiError.retryAfter` comes from the `Retry-After` header, defaulted to 30s when
 * the header is missing. We wait it out rather than hammering: retrying inside the window is
 * what produced the limit in the first place, and payzeno-api counts rejected requests too.
 *
 * a11y: the number ticks in an `aria-hidden` span; the live region only fires at the start and
 * at zero. A per-second live update is unusable with a screen reader on.
 */
import { useEffect, useRef, useState } from 'react';

import { pz } from '@lib/cn';

import { Button } from '../ui/Button';
import { color, font, radius, space, visuallyHidden } from '../ui/tokens';

export interface RateLimitCountdownProps {
  /** Seconds to wait. From `RateLimitedApiError.retryAfter`. */
  seconds: number;
  /** Fired once, when the countdown reaches zero. */
  onExpire: () => void;
  /** Shown above the countdown — "Too many settlement retries". */
  title?: string;
}

/** `95` → `1:35`. Under a minute stays as plain seconds, which reads better. */
export function formatCountdown(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

export function RateLimitCountdown({
  seconds,
  onExpire,
  title = 'Too many requests',
}: RateLimitCountdownProps) {
  const [remaining, setRemaining] = useState(Math.max(0, Math.ceil(seconds)));
  const fired = useRef(false);

  useEffect(() => {
    if (remaining <= 0) return undefined;
    const timer = setTimeout(() => setRemaining((current) => current - 1), 1_000);
    return () => clearTimeout(timer);
  }, [remaining]);

  useEffect(() => {
    if (remaining > 0 || fired.current) return;
    fired.current = true;
    onExpire();
  }, [remaining, onExpire]);

  const done = remaining <= 0;

  return (
    <section
      aria-labelledby="rate-limit-heading"
      className={pz('rate-limit')}
      style={{
        display: 'grid',
        gap: space[3],
        maxWidth: '60ch',
        padding: space[6],
        fontFamily: font.family,
        color: color.textPrimary,
        background: color.warningSubtle,
        border: `1px solid ${color.warning}`,
        borderRadius: radius.lg,
      }}
    >
