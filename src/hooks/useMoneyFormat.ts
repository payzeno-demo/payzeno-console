/**
 * Money formatting, bound to the session's locale.
 *
 * Every amount on screen goes through here so that a currency-exponent bug can only ever exist
 * in one place — and it does not, because the arithmetic lives in `@payzeno/contracts`.
 * `lib/format.ts::formatAmount` is the counter-example and it is on its way out.
 */
import { useCallback, useMemo } from 'react';

import type { CurrencyCode, Money, MinorUnits } from '@payzeno/contracts';

import { formatCompact, formatMoney, formatSigned, money } from '@lib/money';

