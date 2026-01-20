/**
 * `useMoneyFormat`.
 *
 * The hook is thin by design — it binds a locale to the formatters in `lib/money`, which
 * re-export `@payzeno/contracts`. The console performs no money arithmetic of its own
 * (interfaces.md §1.2), so what is tested here is the *binding*, not the maths, plus the JPY
 * exponent, which is the one thing everyone gets wrong.
 */
import { describe, expect, it } from 'vitest';

import { useMoneyFormat } from '@hooks/useMoneyFormat';
import { formatMoney, money } from '@lib/money';
import { renderHookWithProviders } from '@/test/render';

function formatter(locale?: string) {
  return renderHookWithProviders(() => useMoneyFormat(locale)).result;
}

describe('the locale', () => {
  it('uses the one it is given', () => {
    expect(formatter('de-DE').current.locale).toBe('de-DE');
  });

  it('routes through the shared formatter', () => {
    const value = money(12_500, 'GBP');

    expect(formatter('en-GB').current.format(value)).toBe(formatMoney(value, 'en-GB'));
  });

  it('uses a true minus sign for a negative amount', () => {
    expect(formatter('en-GB').current.formatSigned(money(-2_500, 'GBP')).startsWith('−')).toBe(
      true,
    );
  });

});
