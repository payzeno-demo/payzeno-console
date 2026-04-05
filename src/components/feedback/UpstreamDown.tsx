/**
 * 502 — one of our upstreams (the ledger, the legacy biller, an acquirer) is not answering.
 *
 * This is the one error state with an automatic retry, because 502s here are almost always
 * seconds long: the ledger redeploys, the circuit breaker on Worldflow trips and resets. The
 * countdown is visible so the user is not left guessing whether anything is happening.
 *
 * a11y: the countdown is *not* an `aria-live` region ticking once a second — that reads the
 * number out loud every second and is unusable. It announces once when it starts and once when
 * the retry fires.
 */
import { useEffect, useState } from 'react';

import { pz } from '@lib/cn';

import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { color, font, radius, space, visuallyHidden } from '../ui/tokens';

export interface UpstreamDownProps {
  onRetry: () => void;
  /** Seconds before the automatic retry. Set to 0 to disable it. */
  autoRetryAfter?: number;
  requestId?: string;
  /** Which upstream, when we know: "the ledger", "Worldflow". */
  upstream?: string;
}

export function UpstreamDown({
  onRetry,
  autoRetryAfter = 10,
  requestId,
  upstream,
}: UpstreamDownProps) {
  const [remaining, setRemaining] = useState(autoRetryAfter);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (autoRetryAfter <= 0) return undefined;

    const timer = setInterval(() => {
      setRemaining((current) => (current <= 1 ? 0 : current - 1));
    }, 1_000);

    return () => clearInterval(timer);
  }, [autoRetryAfter]);

  useEffect(() => {
    if (autoRetryAfter <= 0 || remaining > 0 || retrying) return;
    setRetrying(true);
    onRetry();
  }, [autoRetryAfter, remaining, retrying, onRetry]);

  return (
    <section
      aria-labelledby="upstream-down-heading"
      className={pz('upstream-down')}
      style={{
        display: 'grid',
        gap: space[3],
        maxWidth: '60ch',
        padding: space[6],
        fontFamily: font.family,
        color: color.textPrimary,
        background: color.infoSubtle,
        border: `1px solid ${color.info}`,
        borderRadius: radius.lg,
      }}
    >
      <h2
        id="upstream-down-heading"
        style={{ margin: 0, fontSize: font.size.lg, fontWeight: font.weight.semibold }}
      >
        {upstream ? `${upstream} is not responding` : 'One of our services is not responding'}
      </h2>

      <p style={{ margin: 0, fontSize: font.size.md, color: color.textSecondary }}>
        Nothing you did caused this and nothing has been lost. We are retrying automatically.
      </p>

      <p aria-hidden="true" style={{ margin: 0, fontSize: font.size.sm, color: color.textMuted }}>
        {retrying ? 'Retrying…' : `Retrying in ${remaining}s`}
      </p>

      <span aria-live="polite" style={visuallyHidden as React.CSSProperties}>
        {retrying ? 'Retrying now' : `Retrying in ${autoRetryAfter} seconds`}
      </span>

      {requestId ? (
        <p
          style={{
            margin: 0,
            fontFamily: font.familyMono,
            fontSize: font.size.sm,
