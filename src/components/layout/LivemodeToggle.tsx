/**
 * Live / test mode switch.
 *
 * `livemode` is a property of the data, not of the console: every resource carries a
 * `livemode` boolean and every list route is scoped by the session's current mode. Flipping
 * this changes what the API returns, so it must invalidate **everything** — a cached live
 * charge list rendered under a test-mode header is the single most dangerous stale read in
 * the product.
 *
 * a11y: it is a `<Switch>` with a real label, not a styled checkbox with a `div` label, and
 * the mode change is announced. The "TEST" tint is reinforced with text, never colour alone.
 */
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { pz } from '@lib/cn';
import { trackEvent } from '@lib/telemetry';

import { Switch } from '../ui/Switch';
import { color, font, radius, space, visuallyHidden } from '../ui/tokens';

export interface LivemodeToggleProps {
  livemode: boolean;
  onChange: (next: boolean) => void;
  /** Merchants that have never taken a live payment cannot leave test mode. */
  canGoLive?: boolean;
  /**
   * Why live mode is locked, announced with the switch and shown as a hover hint. Defaults to
   * the RFC platform-v2 §3 reason: payzeno-api refuses live payments with
   * `merchant_not_activated` until the business is verified.
   */
  lockedReason?: string;
}

export const DEFAULT_LIVEMODE_LOCKED_REASON =
  'Live mode unlocks once Payzeno has verified your business. Test mode works now.';

export function LivemodeToggle({
  livemode,
  onChange,
  canGoLive = true,
  lockedReason = DEFAULT_LIVEMODE_LOCKED_REASON,
}: LivemodeToggleProps) {
  const locked = !canGoLive && !livemode;
  const queryClient = useQueryClient();

  const flip = useCallback(
    (next: boolean) => {
      onChange(next);
      trackEvent('livemode.toggle', { livemode: next });
      // Everything the API scoped by mode is now wrong. Not a refetch — a reset, so no stale
      // rows are shown while the new ones load.
      void queryClient.resetQueries();
    },
    [onChange, queryClient],
  );

  return (
    <div
      className={pz('livemode-toggle')}
      title={locked ? lockedReason : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: space[2],
        padding: `${space[1]} ${space[3]}`,
        borderRadius: radius.pill,
        border: `1px solid ${livemode ? color.border : color.warning}`,
        background: livemode ? color.surface : color.warningSubtle,
        fontFamily: font.family,
      }}
    >
      <Switch
        id="livemode"
        checked={livemode}
        onCheckedChange={flip}
        disabled={locked}
        label="Live mode"
        hideLabel
        description={locked ? lockedReason : undefined}
      />

      {/* `Switch` renders its description only with a visible label; this is its target. */}
      {locked ? (
        <span id="livemode-description" style={visuallyHidden as React.CSSProperties}>
          {lockedReason}
        </span>
      ) : null}

      <span
        aria-hidden="true"
        style={{
          fontSize: font.size.sm,
          fontWeight: font.weight.semibold,
          color: livemode ? color.textPrimary : color.warning,
          letterSpacing: '0.04em',
        }}
      >
        {livemode ? 'LIVE' : 'TEST'}
      </span>

      <span aria-live="polite" style={visuallyHidden as React.CSSProperties}>
        {livemode ? 'Showing live data' : 'Showing test data'}
      </span>
    </div>
  );
}
