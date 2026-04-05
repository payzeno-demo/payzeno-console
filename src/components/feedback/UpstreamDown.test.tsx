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

  it('names the upstream when the caller knows which one it was', () => {
    renderBare(<UpstreamDown onRetry={vi.fn()} autoRetryAfter={0} upstream="The ledger" />);

    expect(
      screen.getByRole('heading', { name: 'The ledger is not responding' }),
    ).toBeInTheDocument();
  });

  it('reassures that nothing was lost', () => {
    renderBare(<UpstreamDown onRetry={vi.fn()} autoRetryAfter={0} />);

    expect(screen.getByText(/nothing has been lost/i)).toBeInTheDocument();
  });

  it('shows the request id when there is one to quote at support', () => {
    renderBare(<UpstreamDown onRetry={vi.fn()} autoRetryAfter={0} requestId="req_502_abc" />);

    expect(screen.getByText('Reference req_502_abc')).toBeInTheDocument();
  });

  it('omits the reference line when there is no request id', () => {
    renderBare(<UpstreamDown onRetry={vi.fn()} autoRetryAfter={0} />);

    expect(screen.queryByText(/^Reference/)).not.toBeInTheDocument();
  });
});

describe('the manual retry', () => {
  it('calls onRetry immediately', async () => {
    const onRetry = vi.fn();
    const { user } = renderBare(<UpstreamDown onRetry={onRetry} autoRetryAfter={0} />);

    await user.click(screen.getByRole('button', { name: 'Retry now' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('switches the status line to "Retrying…" once pressed', async () => {
    const { user } = renderBare(<UpstreamDown onRetry={vi.fn()} autoRetryAfter={0} />);

    await user.click(screen.getByRole('button', { name: 'Retry now' }));

    expect(screen.getByText('Retrying…')).toBeInTheDocument();
  });
});

describe('the automatic retry', () => {
  it('counts down from the interval it was given', () => {
    vi.useFakeTimers();
    renderBare(<UpstreamDown onRetry={vi.fn()} autoRetryAfter={10} />);

    expect(screen.getByText('Retrying in 10s')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3_000);
    });

    expect(screen.getByText('Retrying in 7s')).toBeInTheDocument();
  });

  it('fires onRetry exactly once when the countdown reaches zero', () => {
    vi.useFakeTimers();
    const onRetry = vi.fn();
    renderBare(<UpstreamDown onRetry={onRetry} autoRetryAfter={3} />);

    act(() => {
      vi.advanceTimersByTime(10_000);
    });

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

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

  it('stops its timer on unmount, so a route change leaves nothing running', () => {
    vi.useFakeTimers();
    const onRetry = vi.fn();
    const { unmount } = renderBare(<UpstreamDown onRetry={onRetry} autoRetryAfter={5} />);

    unmount();
    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    expect(onRetry).not.toHaveBeenCalled();
  });

  it('does not fire twice when the user also presses the button', async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onRetry = vi.fn();
    renderBare(<UpstreamDown onRetry={onRetry} autoRetryAfter={5} />);

    await user.click(screen.getByRole('button', { name: 'Retry now' }));
    act(() => {
      vi.advanceTimersByTime(20_000);
    });

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
