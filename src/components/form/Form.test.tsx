/**
 * `Form` and `FormSection`.
 *
 * The error-summary behaviour is the reason this component exists at all. A 422 that only
 * highlights fields in red is invisible to a screen-reader user and to anyone with the form
 * scrolled past; the summary is `role="alert"`, focusable, and takes focus when it appears.
 */
import { describe, expect, it, vi } from 'vitest';

import { Form, FormSection } from '@components/form/Form';
import { FormField } from '@components/form/FormField';
import { NO_ERRORS, hasErrors } from '@components/form/field-errors';
import type { FormErrors } from '@components/form/field-errors';
import { Input } from '@components/ui/Input';
import { renderBare, screen } from '@/test/render';

function errors(overrides: Partial<FormErrors> = {}): FormErrors {
  return { ...NO_ERRORS, ...overrides };
}

describe('the form element', () => {
  it('is named by its label', () => {
    renderBare(
      <Form id="refund" label="Issue a refund" onSubmit={vi.fn()}>
        <p>fields</p>
      </Form>,
    );

    expect(screen.getByRole('form', { name: 'Issue a refund' })).toBeInTheDocument();
  });

  it('uses a visible heading as the name when asked, rather than an aria-label', () => {
    renderBare(
      <Form id="refund" label="Issue a refund" onSubmit={vi.fn()} heading>
        <p>fields</p>
      </Form>,
    );

    expect(screen.getByRole('heading', { name: 'Issue a refund' })).toBeInTheDocument();
    expect(screen.getByRole('form', { name: 'Issue a refund' })).not.toHaveAttribute(
      'aria-label',
    );
  });

  it('disables native validation, so our messages are the only ones shown', () => {
    const { container } = renderBare(
      <Form id="refund" label="Issue a refund" onSubmit={vi.fn()}>
        <p>fields</p>
      </Form>,
    );

    expect(container.querySelector('form')).toHaveAttribute('novalidate');
  });

  it('renders its children and its actions', () => {
    renderBare(
      <Form
        id="refund"
        label="Issue a refund"
        onSubmit={vi.fn()}
        actions={<button type="submit">Refund</button>}
      >
        <p>Amount goes here</p>
      </Form>,
    );

    expect(screen.getByText('Amount goes here')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refund' })).toBeInTheDocument();
  });
});

describe('submitting', () => {
  it('calls onSubmit and prevents the browser navigation', async () => {
    const onSubmit = vi.fn();
    const { user } = renderBare(
      <Form
        id="refund"
        label="Issue a refund"
        onSubmit={onSubmit}
        actions={<button type="submit">Refund</button>}
      >
        <p>fields</p>
      </Form>,
    );

    await user.click(screen.getByRole('button', { name: 'Refund' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('submits on Enter from inside a field', async () => {
    const onSubmit = vi.fn();
    const { user } = renderBare(
      <Form
        id="refund"
        label="Issue a refund"
        onSubmit={onSubmit}
        actions={<button type="submit">Refund</button>}
      >
        <Input id="reference" />
      </Form>,
    );

    await user.type(screen.getByRole('textbox'), 'ch_1{Enter}');

    expect(onSubmit).toHaveBeenCalled();
  });

  it('accepts an async onSubmit without unhandled rejections', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { user } = renderBare(
      <Form
        id="refund"
        label="Issue a refund"
        onSubmit={onSubmit}
        actions={<button type="submit">Refund</button>}
      >
        <p>fields</p>
      </Form>,
    );

    await user.click(screen.getByRole('button', { name: 'Refund' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

describe('the error summary', () => {
  it('stays hidden while there is nothing form-level to say', () => {
    renderBare(
      <Form id="refund" label="Issue a refund" onSubmit={vi.fn()} errors={errors()}>
        <p>fields</p>
      </Form>,
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('stays hidden when only field-level errors exist — those render at the field', () => {
    renderBare(
      <Form
        id="refund"
        label="Issue a refund"
        onSubmit={vi.fn()}
        errors={errors({ fields: { amountMinor: 'Too large.' }, firstField: 'amountMinor' })}
      >
        <p>fields</p>
      </Form>,
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('appears as an alert listing every form-level message', () => {
    renderBare(
      <Form
        id="refund"
        label="Issue a refund"
        onSubmit={vi.fn()}
        errors={errors({
          formLevel: ['This charge is past the refund window.', 'The balance is negative.'],
        })}
      >
        <p>fields</p>
      </Form>,
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('This charge is past the refund window.');
    expect(alert).toHaveTextContent('The balance is negative.');
  });

  it('takes focus when it appears, so it is not missed', () => {
    const { rerender } = renderBare(
      <Form id="refund" label="Issue a refund" onSubmit={vi.fn()} errors={errors()}>
        <p>fields</p>
      </Form>,
    );

    rerender(
      <Form
        id="refund"
        label="Issue a refund"
        onSubmit={vi.fn()}
        errors={errors({ formLevel: ['Payouts are blocked.'] })}
      >
        <p>fields</p>
      </Form>,
    );

    expect(screen.getByRole('alert')).toHaveFocus();
  });

  it('disappears again once the errors clear', () => {
    const { rerender } = renderBare(
      <Form
        id="refund"
        label="Issue a refund"
        onSubmit={vi.fn()}
        errors={errors({ formLevel: ['Payouts are blocked.'] })}
      >
        <p>fields</p>
      </Form>,
    );

    rerender(
      <Form id="refund" label="Issue a refund" onSubmit={vi.fn()} errors={errors()}>
        <p>fields</p>
      </Form>,
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('re-exported hasErrors', () => {
  it('is false for the empty state', () => {
    expect(hasErrors(NO_ERRORS)).toBe(false);
  });

  it('is true for either kind of error', () => {
    expect(hasErrors(errors({ formLevel: ['x'] }))).toBe(true);
    expect(hasErrors(errors({ fields: { a: 'x' } }))).toBe(true);
  });
});

describe('FormSection', () => {
  it('renders a fieldset with a legend', () => {
    renderBare(
      <FormSection legend="Bank details">
        <p>fields</p>
      </FormSection>,
    );

    expect(screen.getByRole('group', { name: 'Bank details' })).toBeInTheDocument();
  });

  it('renders an optional description', () => {
    renderBare(
      <FormSection legend="Bank details" description="Where your payouts land.">
        <p>fields</p>
      </FormSection>,
    );

    expect(screen.getByText('Where your payouts land.')).toBeInTheDocument();
  });

  it('composes with FormField without breaking the label association', () => {
    renderBare(
      <FormSection legend="Bank details">
        <FormField id="bank-name" label="Bank name">
          {(wiring) => <Input {...wiring} />}
        </FormField>
      </FormSection>,
    );

    expect(screen.getByLabelText(/Bank name/)).toHaveAttribute('id', 'bank-name');
  });
});
