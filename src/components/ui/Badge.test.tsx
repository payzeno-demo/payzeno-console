/**
 * `Badge` and `CountBadge`.
 *
 * A badge is the console's smallest carrier of meaning and the easiest place to accidentally
 * make colour the only signal. `srPrefix` exists so "12" in the nav is announced as
 * "Needing attention: 12" rather than as a bare number floating next to a link.
 */
import { describe, expect, it } from 'vitest';

import { Badge, CountBadge } from '@components/ui/Badge';
import { renderBare, screen } from '@/test/render';

describe('Badge', () => {
  it('renders its children', () => {
    renderBare(<Badge>Live</Badge>);

    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  it('never wraps — a badge that breaks across two lines destroys a table row', () => {
    const { container } = renderBare(<Badge>A rather long badge label</Badge>);

    expect(container.querySelector('span')).toHaveStyle({ whiteSpace: 'nowrap' });
  });

});
