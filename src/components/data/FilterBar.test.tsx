/**
 * `FilterBar` and `FilterField`.
 *
 * Small component, one real requirement: a filter region is a landmark a keyboard user can
 * jump to, and the "n filters active" line has to be live or someone who cannot see the
 * highlighted controls never learns why the table is empty.
 */
import { describe, expect, it, vi } from 'vitest';

import { FilterBar, FilterField } from '@components/data/FilterBar';
import { Input } from '@components/ui/Input';
import { renderBare, screen } from '@/test/render';

describe('the region', () => {
  it('is a labelled search landmark', () => {
    renderBare(
      <FilterBar label="Settlement filters">
        <span>controls</span>
      </FilterBar>,
    );

    expect(screen.getByRole('search', { name: 'Settlement filters' })).toBeInTheDocument();
  });

  it('says nothing when no filter is applied', () => {
    renderBare(
      <FilterBar label="Charge filters" activeCount={0}>
        <span>controls</span>
      </FilterBar>,
    );

    expect(screen.queryByText(/filter/i)).not.toBeInTheDocument();
  });

  it('offers "Clear all" only when there is something to clear', () => {
    const onClear = vi.fn();
    const { rerender } = renderBare(
      <FilterBar label="Charge filters" activeCount={0} onClear={onClear}>
        <span>controls</span>
      </FilterBar>,
    );

    expect(screen.queryByRole('button', { name: 'Clear all' })).not.toBeInTheDocument();

    rerender(
      <FilterBar label="Charge filters" activeCount={2} onClear={onClear}>
        <span>controls</span>
      </FilterBar>,
    );

    expect(screen.getByRole('button', { name: 'Clear all' })).toBeInTheDocument();
  });

  it('is typeable through its label, which is the point of the association', async () => {
    const { user } = renderBare(
      <FilterField id="charge-reference" label="Reference">
        <Input id="charge-reference" />
      </FilterField>,
    );

    await user.type(screen.getByLabelText('Reference'), 'ch_123');

    expect(screen.getByLabelText('Reference')).toHaveValue('ch_123');
  });
});
