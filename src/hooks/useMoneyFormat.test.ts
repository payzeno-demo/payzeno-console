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

  it('falls back to the browser locale when given none', () => {
    expect(formatter().current.locale).toBeTruthy();
  });

  it('produces different output for different locales', () => {
    const en = formatter('en-GB').current.format(money(123_456, 'GBP'));
    const de = formatter('de-DE').current.format(money(123_456, 'GBP'));

    expect(en).not.toBe(de);
  });
});

describe('format', () => {
  it('routes through the shared formatter', () => {
    const value = money(12_500, 'GBP');

    expect(formatter('en-GB').current.format(value)).toBe(formatMoney(value, 'en-GB'));
  });

  it('formats zero without falling back to an em dash', () => {
    expect(formatter('en-GB').current.format(money(0, 'GBP'))).toContain('0');
  });
});

describe('formatMinor', () => {
  it('takes minor units and a currency', () => {
    const result = formatter('en-GB').current;

    expect(result.formatMinor(12_500, 'GBP')).toBe(result.format(money(12_500, 'GBP')));
  });

  it('does not divide JPY by a hundred', () => {
    const rendered = formatter('en-GB').current.formatMinor(1_200, 'JPY');

    expect(rendered).toContain('1,200');
    expect(rendered).not.toContain('12.00');
  });

  it('keeps a two-decimal currency at two decimals', () => {
    expect(formatter('en-GB').current.formatMinor(1_200, 'GBP')).toContain('12.00');
  });

  it('prefixes a positive amount with a plus', () => {
    expect(formatter('en-GB').current.formatSigned(money(2_500, 'GBP')).startsWith('+')).toBe(
      true,
    );
  });

  it('uses a true minus sign for a negative amount', () => {
    expect(formatter('en-GB').current.formatSigned(money(-2_500, 'GBP')).startsWith('−')).toBe(
      true,
    );
  });

  it('signs zero as positive rather than leaving it bare', () => {
    expect(formatter('en-GB').current.formatSigned(money(0, 'GBP')).startsWith('+')).toBe(true);
  });
});

describe('formatCompact', () => {
  it('returns the same object across renders, so a memoised cell does not re-render', () => {
    const { result, rerender } = renderHookWithProviders(() => useMoneyFormat('en-GB'));
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });
});
