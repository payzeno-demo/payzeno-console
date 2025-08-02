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
