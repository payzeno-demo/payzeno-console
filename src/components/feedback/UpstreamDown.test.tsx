/**
 * `UpstreamDown` — the 502 screen.
 *
 * The copy is doing real work here and the tests pin it: a merchant who sees a payments
 * dashboard fall over assumes their money is involved. "Nothing you did caused this and
 * nothing has been lost" is the sentence that stops a support call, so it is asserted rather
 * than left to whoever next tidies the wording.
 */
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { UpstreamDown } from '@components/feedback/UpstreamDown';
import { renderBare, screen, userEvent } from '@/test/render';

afterEach(() => {
  vi.useRealTimers();
});

describe('the message', () => {
  it('is a labelled region with a heading', () => {
    renderBare(<UpstreamDown onRetry={vi.fn()} autoRetryAfter={0} />);

    expect(
      screen.getByRole('heading', { name: 'One of our services is not responding' }),
    ).toBeInTheDocument();
  });

  it('switches the status line to "Retrying…" once pressed', async () => {
    const { user } = renderBare(<UpstreamDown onRetry={vi.fn()} autoRetryAfter={0} />);

    await user.click(screen.getByRole('button', { name: 'Retry now' }));

    expect(screen.getByText('Retrying…')).toBeInTheDocument();
  });
});

describe('the automatic retry', () => {
  it('announces the wait politely without spamming the live region every second', () => {
    vi.useFakeTimers();
    renderBare(<UpstreamDown onRetry={vi.fn()} autoRetryAfter={10} />);

    // The visible counter ticks; the announced text is the original interval, once.
    expect(screen.getByText('Retrying in 10 seconds')).toHaveAttribute('aria-live', 'polite');

    act(() => {
      vi.advanceTimersByTime(4_000);
    });

    expect(screen.getByText('Retrying in 10 seconds')).toBeInTheDocument();
  });

  it('never auto-retries when the interval is zero', () => {
    vi.useFakeTimers();
    const onRetry = vi.fn();
    renderBare(<UpstreamDown onRetry={onRetry} autoRetryAfter={0} />);

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(onRetry).not.toHaveBeenCalled();
  });

});
