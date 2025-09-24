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

});
