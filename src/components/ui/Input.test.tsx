/**
 * `Input`.
 *
 * `id` is required on this component rather than optional, which is unusual for a primitive
 * and entirely deliberate: an input with no id cannot be associated with a label, and a
 * console full of unlabelled boxes is unusable with a screen reader. Everything below is
 * really testing that the wiring survives the `prefix`/`suffix` wrapper.
 */
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Input, describedByOf } from '@components/ui/Input';
import { Label } from '@components/ui/Label';
import { renderBare, screen } from '@/test/render';

describe('describedByOf', () => {
  it('joins the ids it is given with spaces', () => {
    expect(describedByOf('a-hint', 'a-error')).toBe('a-hint a-error');
  });

  it('drops the absent ones', () => {
    expect(describedByOf(undefined, 'a-error')).toBe('a-error');
    expect(describedByOf('a-hint', undefined)).toBe('a-hint');
  });

  it('returns undefined rather than an empty string, so the attribute is omitted', () => {
    expect(describedByOf(undefined, undefined)).toBeUndefined();
  });
});

describe('label association', () => {
  it('is reachable by its label text', () => {
    renderBare(
      <>
        <Label htmlFor="charge-reference">Charge reference</Label>
        <Input id="charge-reference" />
      </>,
    );

    expect(screen.getByLabelText('Charge reference')).toHaveAttribute('id', 'charge-reference');
  });

  it('stays reachable when wrapped for a prefix', () => {
    renderBare(
      <>
        <Label htmlFor="amount">Amount</Label>
        <Input id="amount" prefix="£" />
      </>,
    );

    expect(screen.getByLabelText('Amount')).toBeInTheDocument();
  });
});

describe('typing', () => {
  it('reports each keystroke to onChange', async () => {
    const onChange = vi.fn();
    const { user } = renderBare(<Input id="q" onChange={onChange} />);

    await user.type(screen.getByRole('textbox'), 'abc');

    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it('is controllable', async () => {
    function Controlled() {
      return <Input id="q" value="ch_123" onChange={() => undefined} />;
    }
    renderBare(<Controlled />);

    expect(screen.getByRole('textbox')).toHaveValue('ch_123');
  });

  it('does not accept input while disabled', async () => {
    const onChange = vi.fn();
    const { user } = renderBare(<Input id="q" disabled onChange={onChange} />);

    await user.type(screen.getByRole('textbox'), 'abc');

    expect(onChange).not.toHaveBeenCalled();
  });

  it('forwards its ref for focus management', () => {
    const ref = createRef<HTMLInputElement>();
    renderBare(<Input id="q" ref={ref} />);

    ref.current?.focus();
    expect(screen.getByRole('textbox')).toHaveFocus();
  });
});

describe('the invalid state', () => {
  it('sets aria-invalid', () => {
    renderBare(<Input id="q" invalid />);

    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('omits aria-invalid entirely when valid, rather than setting it to "false"', () => {
    renderBare(<Input id="q" />);

    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid');
  });

  it('points aria-describedby at the error only while invalid', () => {
    const { rerender } = renderBare(<Input id="q" errorId="q-error" />);
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-describedby');

    rerender(<Input id="q" errorId="q-error" invalid />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-describedby', 'q-error');
  });

  it('keeps a hint id alongside the error id when both apply', () => {
    renderBare(<Input id="q" describedBy="q-hint" errorId="q-error" invalid />);

    expect(screen.getByRole('textbox')).toHaveAttribute('aria-describedby', 'q-hint q-error');
  });

  it('adds a modifier class so the styling is not only a colour', () => {
    const { container } = renderBare(<Input id="q" invalid />);

    expect(container.querySelector('input')?.className).toContain('invalid');
  });
});

describe('prefix and suffix', () => {
  it('renders the prefix', () => {
    renderBare(<Input id="amount" prefix="£" />);

    expect(screen.getByText('£')).toBeInTheDocument();
  });

  it('renders the suffix', () => {
    renderBare(<Input id="amount" suffix="GBP" />);

    expect(screen.getByText('GBP')).toBeInTheDocument();
  });

  it('marks both as decorative — the currency belongs in the label', () => {
    const { container } = renderBare(<Input id="amount" prefix="£" suffix="GBP" />);

    const decorations = container.querySelectorAll('[aria-hidden="true"]');
    expect(decorations).toHaveLength(2);
  });

  it('renders a bare input with no wrapper when neither is given', () => {
    const { container } = renderBare(<Input id="q" />);

    expect(container.querySelector('.pz-input__wrapper')).not.toBeInTheDocument();
    expect(container.firstElementChild?.tagName).toBe('INPUT');
  });
});
