/**
 * `LivemodeToggle` — locked in test mode for a merchant that cannot go live yet, and says why.
 */
import { describe, expect, it, vi } from 'vitest';

import { DEFAULT_LIVEMODE_LOCKED_REASON, LivemodeToggle } from '@components/layout/LivemodeToggle';
import { renderWithProviders, screen } from '@/test/render';

describe('LivemodeToggle', () => {
  it('is a working switch for a merchant that can go live', () => {
    renderWithProviders(<LivemodeToggle livemode={false} onChange={vi.fn()} />);

    expect(screen.getByRole('switch', { name: 'Live mode' })).toBeEnabled();
    expect(screen.queryByText(DEFAULT_LIVEMODE_LOCKED_REASON)).not.toBeInTheDocument();
  });

  it('is disabled in test mode, and describes why, when the merchant cannot go live', () => {
    renderWithProviders(<LivemodeToggle livemode={false} onChange={vi.fn()} canGoLive={false} />);

    const toggle = screen.getByRole('switch', { name: 'Live mode' });
    expect(toggle).toBeDisabled();
    expect(toggle).toHaveAccessibleDescription(DEFAULT_LIVEMODE_LOCKED_REASON);
  });
});
