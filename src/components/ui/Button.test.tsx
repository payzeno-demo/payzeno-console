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

  it('defaults to type="button", so it cannot submit a form by accident', () => {
    renderBare(<Button>Cancel</Button>);

    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveAttribute('type', 'button');
  });

  it('accepts type="submit" when a form genuinely wants it', () => {
    renderBare(<Button type="submit">Sign in</Button>);

    expect(screen.getByRole('button', { name: 'Sign in' })).toHaveAttribute('type', 'submit');
  });

  it('forwards its ref, so a form can focus it after a validation failure', () => {
    const ref = createRef<HTMLButtonElement>();
    renderBare(<Button ref={ref}>Retry</Button>);

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current?.textContent).toContain('Retry');
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
  it('calls onClick', async () => {
    const onClick = vi.fn();
    const { user } = renderBare(<Button onClick={onClick}>Refund</Button>);

    await user.click(screen.getByRole('button', { name: 'Refund' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

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
  it('marks itself busy for assistive technology', () => {
    renderBare(<Button isLoading>Capture</Button>);

    expect(screen.getByRole('button', { name: /Capture/ })).toHaveAttribute('aria-busy', 'true');
  });

  it('disables itself, so a second click cannot fire a second POST', () => {
    renderBare(<Button isLoading>Capture</Button>);

    expect(screen.getByRole('button', { name: /Capture/ })).toBeDisabled();
  });

  it('swallows a click that somehow arrives anyway', async () => {
    const onClick = vi.fn();
    const { user } = renderBare(
      <Button onClick={onClick} isLoading>
        Capture
      </Button>,
    );

    await user.click(screen.getByRole('button', { name: /Capture/ }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it('keeps its label visible while loading — the text is not replaced by a spinner', () => {
    renderBare(<Button isLoading>Capture</Button>);

    expect(screen.getByText('Capture')).toBeVisible();
  });

  it('hides the leading icon while the spinner occupies that slot', () => {
    const { container } = renderBare(
      <Button isLoading leadingIcon={<span data-testid="icon">↻</span>}>
        Capture
      </Button>,
    );

    expect(container.querySelector('[data-testid="icon"]')).not.toBeInTheDocument();
  });

  it('is no longer busy once loading finishes', () => {
    const { rerender } = renderBare(<Button isLoading>Capture</Button>);
    rerender(<Button>Capture</Button>);

    const button = screen.getByRole('button', { name: 'Capture' });
    expect(button).not.toHaveAttribute('aria-busy');
    expect(button).toBeEnabled();
  });
});

describe('variants and sizes', () => {
  it.each(['primary', 'secondary', 'ghost', 'danger'] as const)(
    'renders the %s variant with a modifier class',
    (variant) => {
      const { container } = renderBare(<Button variant={variant}>Go</Button>);

      expect(container.querySelector('button')?.className).toContain(variant);
    },
  );

  it.each([
    ['sm', '28px'],
    ['md', '36px'],
    ['lg', '44px'],
  ] as const)('gives the %s size a %s target height', (size, height) => {
    renderBare(<Button size={size}>Go</Button>);

    expect(screen.getByRole('button', { name: 'Go' })).toHaveStyle({ height });
  });

  it('stretches to the full width when asked', () => {
    renderBare(<Button fullWidth>Sign in</Button>);

    expect(screen.getByRole('button', { name: 'Sign in' })).toHaveStyle({ width: '100%' });
  });

  it('marks decorative icons aria-hidden so they are not announced', () => {
    const { container } = renderBare(
      <Button trailingIcon={<span>↗</span>}>Open</Button>,
    );

    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument();
  });
});
