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

  it('renders a screen-reader prefix before the content', () => {
    renderBare(<Badge srPrefix="Status">Captured</Badge>);

    expect(screen.getByText('Status:')).toBeInTheDocument();
    expect(screen.getByText('Captured')).toBeInTheDocument();
  });

  it('renders a decorative dot only when asked, and marks it hidden', () => {
    const { container: without } = renderBare(<Badge>Plain</Badge>);
    expect(without.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument();

    const { container: withDot } = renderBare(<Badge withDot>Dotted</Badge>);
    expect(withDot.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('never wraps — a badge that breaks across two lines destroys a table row', () => {
    const { container } = renderBare(<Badge>A rather long badge label</Badge>);

    expect(container.querySelector('span')).toHaveStyle({ whiteSpace: 'nowrap' });
  });

  it('renders nothing for a negative count either', () => {
    const { container } = renderBare(<CountBadge count={-3} label="Disputes" />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the count with its label as a screen-reader prefix', () => {
    renderBare(<CountBadge count={7} label="Disputes needing a response" />);

    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('Disputes needing a response:')).toBeInTheDocument();
  });

  it('caps the displayed number at 99+ so the pill keeps its shape', () => {
    renderBare(<CountBadge count={412} label="Disputes" />);

    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('uses the danger tone, because a count badge always means "act on this"', () => {
    const { container } = renderBare(<CountBadge count={2} label="Disputes" />);

    expect(container.querySelector('span')?.className).toContain('danger');
  });
});
