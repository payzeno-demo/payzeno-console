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
