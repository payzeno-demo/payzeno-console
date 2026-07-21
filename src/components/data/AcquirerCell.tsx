/**
 * Which acquirer authorised or settled a row.
 *
 * There are exactly two (`ACQUIRERS` in contracts) and merchants care, because when one of
 * them has a bad afternoon the settlement page fills up with `retryable` items from that
 * acquirer only. Colour-coding them makes that visible at a glance — with a text label as
 * well, because colour is never the only signal (ADR 0005).
 */
import { ACQUIRERS } from '@payzeno/contracts';
import type { Acquirer } from '@payzeno/contracts';

import { pz } from '@lib/cn';

import { Badge } from '../ui/Badge';
import type { Tone } from '../ui/tokens';

export interface AcquirerCellProps {
  acquirer: Acquirer | null | undefined;
  /** Render just the text, no badge. Used inside already-dense settlement item rows. */
  plain?: boolean;
}

const ACQUIRER_LABELS: Readonly<Record<Acquirer, string>> = {
  worldflow: 'Worldflow',
  nordpay: 'Nordpay',
};

/**
 * Two different neutral-ish tones. Neither is `danger` — an acquirer is not an error state,
 * however much the on-call rota disagrees.
 */
const ACQUIRER_TONES: Readonly<Record<Acquirer, Tone>> = {
  worldflow: 'info',
  nordpay: 'brand',
};

export function acquirerLabel(acquirer: Acquirer): string {
  return ACQUIRER_LABELS[acquirer];
}

export function isAcquirer(value: string): value is Acquirer {
  return (ACQUIRERS as ReadonlyArray<string>).includes(value);
}
