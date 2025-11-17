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
}

export function LivemodeToggle({ livemode, onChange, canGoLive = true }: LivemodeToggleProps) {
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
        disabled={!canGoLive && !livemode}
        label="Live mode"
