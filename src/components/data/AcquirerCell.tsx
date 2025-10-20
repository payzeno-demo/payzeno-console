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

