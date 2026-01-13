/**
 * `MoneyInput` — where a merchant types an amount that becomes a real transfer.
 *
 * Two things this file exists to hold:
 *  1. **JPY.** `CURRENCY_EXPONENT.JPY` is 0. `¥1200` must parse to 1200 minor units, not
 *     120 000. Every "divide by 100" bug in a payments console is this one.
 *  2. **The draft.** The box keeps its own string while the user types, so `12.` survives
 *     the keystroke before the decimals arrive. A naïve controlled input rewrites it to `12`
 *     and the caret jumps.
 */
import { describe, expect, it, vi } from 'vitest';

import {
  MoneyInput,
  formatForInput,
  normaliseInput,
  parseAmount,
} from '@components/form/MoneyInput';
import { renderBare, screen } from '@/test/render';

describe('normaliseInput', () => {
  it('strips currency symbols and spaces', () => {
    expect(normaliseInput('£ 1,234.50')).toBe('1234.50');
  });

  it('removes thousands separators', () => {
    expect(normaliseInput('1,000,000')).toBe('1000000');
  });

  it('keeps a leading minus, for a negative adjustment', () => {
    expect(normaliseInput('-42.00')).toBe('-42.00');
  });

  it('drops letters someone pasted in', () => {
    expect(normaliseInput('12.50 GBP')).toBe('12.50');
  });
});

describe('parseAmount', () => {
  it('parses a two-decimal currency into minor units', () => {
    expect(parseAmount('125.00', 'GBP')).toBe(12_500);
    expect(parseAmount('0.99', 'EUR')).toBe(99);
  });

  it('parses a zero-decimal currency without inventing two decimal places', () => {
    expect(parseAmount('1200', 'JPY')).toBe(1_200);
    expect(parseAmount('1,200', 'JPY')).toBe(1_200);
  });

  it('ignores decimals typed into a zero-exponent currency', () => {
    expect(parseAmount('1200.75', 'JPY')).toBe(1_200);
  });

  it('trims excess precision rather than rejecting a mid-keystroke value', () => {
    expect(parseAmount('12.5678', 'GBP')).toBe(1_256);
  });

  it('returns null for the states that are not a number yet', () => {
    expect(parseAmount('', 'GBP')).toBeNull();
    expect(parseAmount('-', 'GBP')).toBeNull();
    expect(parseAmount('.', 'GBP')).toBeNull();
  });

  it('returns null for something that cannot be a number at all', () => {
    expect(parseAmount('abc', 'GBP')).toBeNull();
  });
});

describe('formatForInput', () => {
  it('renders minor units back as a major-unit string', () => {
    expect(formatForInput(12_500, 'GBP')).toBe('125.00');
  });

  it('does not add decimals to a zero-exponent currency', () => {
    expect(formatForInput(1_200, 'JPY')).toBe('1200');
  });

  it('renders zero as an empty box, so a placeholder can show through', () => {
    expect(formatForInput(0, 'GBP')).toBe('');
    expect(formatForInput(0, 'JPY')).toBe('');
  });

  it('round-trips through parseAmount', () => {
    expect(parseAmount(formatForInput(98_765, 'GBP'), 'GBP')).toBe(98_765);
    expect(parseAmount(formatForInput(4_321, 'JPY'), 'JPY')).toBe(4_321);
  });
});

describe('the control', () => {
  it('labels itself with the field name and the currency', () => {
    renderBare(
      <MoneyInput
        id="refund-amount"
        label="Refund amount"
        currency="GBP"
        valueMinor={0}
        onValueChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Refund amount (GBP)')).toBeInTheDocument();
  });

  it('shows the controlled value on first render', () => {
    renderBare(
      <MoneyInput
        id="refund-amount"
        label="Refund amount"
        currency="GBP"
        valueMinor={12_500}
        onValueChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Refund amount (GBP)')).toHaveValue('125.00');
  });

  it('uses a decimal input mode, so a phone shows the right keypad', () => {
    renderBare(
      <MoneyInput
        id="refund-amount"
        label="Refund amount"
        currency="GBP"
        valueMinor={0}
        onValueChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Refund amount (GBP)')).toHaveAttribute(
      'inputmode',
      'decimal',
    );
  });

  it('renders a hint and associates it with the field', () => {
    renderBare(
      <MoneyInput
        id="refund-amount"
        label="Refund amount"
        currency="GBP"
        valueMinor={0}
        onValueChange={vi.fn()}
        hint="Up to £125.00 is refundable."
      />,
    );

    const field = screen.getByLabelText('Refund amount (GBP)');
    expect(field.getAttribute('aria-describedby')).toContain('refund-amount-hint');
    expect(screen.getByText('Up to £125.00 is refundable.')).toBeInTheDocument();
  });

  it('points at the error id when invalid', () => {
    renderBare(
      <MoneyInput
        id="refund-amount"
        label="Refund amount"
        currency="GBP"
        valueMinor={0}
        onValueChange={vi.fn()}
        invalid
        errorId="refund-amount-error"
      />,
    );

    const field = screen.getByLabelText('Refund amount (GBP)');
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field.getAttribute('aria-describedby')).toContain('refund-amount-error');
  });
});

describe('typing', () => {
  it('reports minor units, not the typed string', async () => {
    const onValueChange = vi.fn();
    const { user } = renderBare(
      <MoneyInput
        id="amount"
        label="Amount"
        currency="GBP"
        valueMinor={0}
        onValueChange={onValueChange}
      />,
    );

    await user.type(screen.getByLabelText('Amount (GBP)'), '12.50');

    expect(onValueChange).toHaveBeenLastCalledWith(1_250);
  });

  it('reports JPY without multiplying by a hundred', async () => {
    const onValueChange = vi.fn();
    const { user } = renderBare(
      <MoneyInput
        id="amount"
        label="Amount"
        currency="JPY"
        valueMinor={0}
        onValueChange={onValueChange}
      />,
    );

    await user.type(screen.getByLabelText('Amount (JPY)'), '1200');

    expect(onValueChange).toHaveBeenLastCalledWith(1_200);
  });

  it('keeps a half-typed decimal on screen instead of rewriting it', async () => {
    const { user } = renderBare(
      <MoneyInput
        id="amount"
        label="Amount"
        currency="GBP"
        valueMinor={0}
        onValueChange={vi.fn()}
      />,
    );

    const field = screen.getByLabelText('Amount (GBP)');
    await user.type(field, '12.');

    expect(field).toHaveValue('12.');
  });

  it('reports zero when the box is cleared, rather than NaN', async () => {
    const onValueChange = vi.fn();
    const { user } = renderBare(
      <MoneyInput
        id="amount"
        label="Amount"
        currency="GBP"
        valueMinor={1_250}
        onValueChange={onValueChange}
      />,
    );

    await user.clear(screen.getByLabelText('Amount (GBP)'));

    expect(onValueChange).toHaveBeenLastCalledWith(0);
  });

  it('tidies the draft back to the canonical form on blur', async () => {
    const { user } = renderBare(
      <MoneyInput
        id="amount"
        label="Amount"
        currency="GBP"
        valueMinor={12_500}
        onValueChange={vi.fn()}
      />,
    );

    const field = screen.getByLabelText('Amount (GBP)');
    await user.clear(field);
    await user.type(field, '125');
    await user.tab();

    expect(field).toHaveValue('125.00');
  });
});
