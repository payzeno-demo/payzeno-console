/**
 * `Select` — the Radix wrapper every filter bar drives.
 *
 * Two design-system rules are pinned here. First, a visible `label` wins over `ariaLabel`:
 * two accessible names on one control is a conflict and the browsers do not agree on which
 * wins. Second, the placeholder is not a label — a select with only a placeholder must still
 * be reachable by an accessible name.
 */
import { describe, expect, it, vi } from 'vitest';

import { Select, optionsFrom } from '@components/ui/Select';
import { renderBare, screen, waitFor } from '@/test/render';

const STATUSES = ['open', 'closed', 'funded'] as const;

const options = optionsFrom(STATUSES, (value) => value.replace(/^./, (c) => c.toUpperCase()));

describe('optionsFrom', () => {
  it('maps a union of values into option objects', () => {
    expect(options).toEqual([
      { value: 'open', label: 'Open' },
      { value: 'closed', label: 'Closed' },
      { value: 'funded', label: 'Funded' },
    ]);
  });

  it('keeps the value and the label separate — the wire value is never the display text', () => {
    const mapped = optionsFrom(['needs_response'] as const, () => 'Needs response');

    expect(mapped[0]?.value).toBe('needs_response');
    expect(mapped[0]?.label).toBe('Needs response');
  });
});

describe('naming', () => {
  it('renders a visible label associated with the trigger', () => {
    renderBare(
      <Select
        id="batch-status"
        label="Status"
        value="open"
        onValueChange={vi.fn()}
        options={options}
      />,
    );

    expect(screen.getByLabelText('Status')).toHaveAttribute('id', 'batch-status');
  });

  it('uses ariaLabel when there is no visible label', () => {
    renderBare(
      <Select
        id="page-size"
        ariaLabel="Rows per page"
        value="25"
        onValueChange={vi.fn()}
        options={[{ value: '25', label: '25' }]}
      />,
    );

    expect(screen.getByRole('combobox', { name: 'Rows per page' })).toBeInTheDocument();
  });

  it('does not render a visible label element when only ariaLabel is given', () => {
    const { container } = renderBare(
      <Select
        id="page-size"
        ariaLabel="Rows per page"
        value="25"
        onValueChange={vi.fn()}
        options={[{ value: '25', label: '25' }]}
      />,
    );

    expect(container.querySelector('label')).not.toBeInTheDocument();
  });
});

describe('the closed trigger', () => {
  it('shows the label of the selected option, not its wire value', () => {
    renderBare(
      <Select id="s" label="Status" value="funded" onValueChange={vi.fn()} options={options} />,
    );

    expect(screen.getByLabelText('Status')).toHaveTextContent('Funded');
  });

  it('shows the placeholder when nothing is selected', () => {
    renderBare(
      <Select
        id="s"
        label="Status"
        value={null}
        onValueChange={vi.fn()}
        options={options}
        placeholder="Any status"
      />,
    );

    expect(screen.getByLabelText('Status')).toHaveTextContent('Any status');
  });

  it('is disabled when asked', () => {
    renderBare(
      <Select id="s" label="Status" value="open" onValueChange={vi.fn()} options={options} disabled />,
    );

    expect(screen.getByLabelText('Status')).toBeDisabled();
  });

  it('marks itself invalid and points at the error id', () => {
    renderBare(
      <Select
        id="s"
        label="Status"
        value={null}
        onValueChange={vi.fn()}
        options={options}
        invalid
        errorId="s-error"
      />,
    );

    const trigger = screen.getByLabelText('Status');
    expect(trigger).toHaveAttribute('aria-invalid', 'true');
    expect(trigger).toHaveAttribute('aria-describedby', 's-error');
  });

  it('omits aria-invalid when valid', () => {
    renderBare(
      <Select id="s" label="Status" value="open" onValueChange={vi.fn()} options={options} />,
    );

    expect(screen.getByLabelText('Status')).not.toHaveAttribute('aria-invalid');
  });
});

describe('choosing an option', () => {
  it('opens on click and lists every option', async () => {
    const { user } = renderBare(
      <Select id="s" label="Status" value="open" onValueChange={vi.fn()} options={options} />,
    );

    await user.click(screen.getByLabelText('Status'));

    await waitFor(() => {
      expect(screen.getAllByRole('option')).toHaveLength(options.length);
    });
  });

  it('reports the chosen value, not the label', async () => {
    const onValueChange = vi.fn();
    const { user } = renderBare(
      <Select id="s" label="Status" value="open" onValueChange={onValueChange} options={options} />,
    );

    await user.click(screen.getByLabelText('Status'));
    await user.click(await screen.findByRole('option', { name: /Funded/ }));

    expect(onValueChange).toHaveBeenCalledWith('funded');
  });

  it('renders an option description underneath its label when one is given', async () => {
    const { user } = renderBare(
      <Select
        id="s"
        label="Method"
        value="standard"
        onValueChange={vi.fn()}
        options={[
          { value: 'standard', label: 'Standard', description: 'Arrives in two days' },
          { value: 'instant', label: 'Instant', description: 'Arrives in minutes, costs more' },
        ]}
      />,
    );

    await user.click(screen.getByLabelText('Method'));

    expect(await screen.findByText('Arrives in two days')).toBeInTheDocument();
  });
});
