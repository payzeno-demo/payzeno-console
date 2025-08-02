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

