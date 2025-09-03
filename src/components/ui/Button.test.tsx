/**
 * `Button` — the primitive every mutation in the console is fired from.
 *
 * The loading behaviour gets the most attention here because it is the one that costs money:
 * a Capture button that stays clickable while its POST is in flight is a merchant clicking it
 * twice, and only the idempotency key downstream saves them.
 */
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Button } from '@components/ui/Button';
import { renderBare, screen } from '@/test/render';

describe('defaults', () => {
  it('renders a button with the given label', () => {
    renderBare(<Button>Capture</Button>);

    expect(screen.getByRole('button', { name: 'Capture' })).toBeInTheDocument();
  });

  it('passes arbitrary button attributes through', () => {
    renderBare(
      <Button aria-describedby="hint" data-testid="pay">
        Pay
      </Button>,
    );

    const button = screen.getByTestId('pay');
    expect(button).toHaveAttribute('aria-describedby', 'hint');
  });
});

describe('clicking', () => {
  it('does not call onClick while disabled', async () => {
    const onClick = vi.fn();
    const { user } = renderBare(
      <Button onClick={onClick} disabled>
        Refund
      </Button>,
    );

    await user.click(screen.getByRole('button', { name: 'Refund' }));

    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('the loading state', () => {
  it('hides the leading icon while the spinner occupies that slot', () => {
    const { container } = renderBare(
      <Button isLoading leadingIcon={<span data-testid="icon">↻</span>}>
        Capture
      </Button>,
    );

    expect(container.querySelector('[data-testid="icon"]')).not.toBeInTheDocument();
  });

  it('stretches to the full width when asked', () => {
    renderBare(<Button fullWidth>Sign in</Button>);

    expect(screen.getByRole('button', { name: 'Sign in' })).toHaveStyle({ width: '100%' });
  });

});
