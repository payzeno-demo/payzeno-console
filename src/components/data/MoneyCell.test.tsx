/**
 * `MoneyCell` sits at the bottom of the read chain
 * (`<F>Page → Table → DataTable → columns → MoneyCell → useMoneyFormat → lib/money →
 * @payzeno/contracts::formatMoney`) and it is the one place a currency exponent can go wrong
 * in front of a merchant.
 *
 * The expectations are computed with `formatMoney` rather than hardcoded, deliberately: the
 * thing under test is that the cell *routes through* the shared formatter, not that ICU
 * renders a pound sign the way this file guesses it does.
 */
import { describe, expect, it } from 'vitest';

import { MoneyCell, moneyExportValue } from '@components/data/MoneyCell';
import { CURRENCY_EXPONENT, formatMoney, money } from '@lib/money';
import { renderBare, screen } from '@/test/render';

describe('rendering an amount', () => {
  it('formats from minor units and a currency', () => {
    renderBare(<MoneyCell amountMinor={12_500} currency="GBP" />);

    expect(screen.getByText(formatMoney(money(12_500, 'GBP')))).toBeInTheDocument();
  });

  it('accepts a whole Money object as well', () => {
    renderBare(<MoneyCell value={money(4_299, 'EUR')} />);

    expect(screen.getByText(formatMoney(money(4_299, 'EUR')))).toBeInTheDocument();
  });

  it('prefers `value` when both forms are supplied', () => {
    renderBare(<MoneyCell value={money(100, 'USD')} amountMinor={999_999} currency="GBP" />);

    expect(screen.getByText(formatMoney(money(100, 'USD')))).toBeInTheDocument();
  });
});

describe('JPY — the exponent that catches everyone', () => {
  it('has a zero exponent in the shared table', () => {
    expect(CURRENCY_EXPONENT.JPY).toBe(0);
    expect(CURRENCY_EXPONENT.GBP).toBe(2);
  });

  it('uses a real minus sign for a negative amount, not a hyphen', () => {
    renderBare(<MoneyCell amountMinor={-2_500} currency="GBP" signed />);

    // U+2212 MINUS SIGN. A hyphen renders narrower than the plus and the column jitters.
    expect(screen.getByText(/^−/)).toBeInTheDocument();
  });

  it('never wraps an amount across two lines', () => {
    const { container } = renderBare(<MoneyCell amountMinor={123_456_789} currency="GBP" />);

    expect(container.querySelector('span')).toHaveStyle({ whiteSpace: 'nowrap' });
  });
});

describe('moneyExportValue', () => {
  it('does not scale JPY on the way out either', () => {
    expect(moneyExportValue(1_200, 'JPY')).toBe('1200 JPY');
  });

  it('keeps a negative amount negative', () => {
    expect(moneyExportValue(-500, 'USD')).toBe('-500 USD');
  });
});
