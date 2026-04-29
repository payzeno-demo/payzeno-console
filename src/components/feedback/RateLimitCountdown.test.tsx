/**
 * `RateLimitCountdown` — the 429 screen.
 *
 * `formatCountdown` gets its own block because the mm:ss form is the difference between
 * "wait 154 seconds" (which nobody parses) and "2:34".
 */
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RateLimitCountdown, formatCountdown } from '@components/feedback/RateLimitCountdown';
import { renderBare, screen } from '@/test/render';

afterEach(() => {
  vi.useRealTimers();
});

describe('formatCountdown', () => {
  it('renders under a minute as bare seconds', () => {
    expect(formatCountdown(0)).toBe('0s');
    expect(formatCountdown(9)).toBe('9s');
    expect(formatCountdown(59)).toBe('59s');
  });

  it('switches to mm:ss at a minute', () => {
    expect(formatCountdown(60)).toBe('1:00');
    expect(formatCountdown(61)).toBe('1:01');
  });

  it('zero-pads the seconds', () => {
    expect(formatCountdown(125)).toBe('2:05');
  });

  it('handles a long ban without spilling into hours', () => {
    expect(formatCountdown(3_600)).toBe('60:00');
  });
});

describe('the message', () => {
  it('is a labelled region with a heading', () => {
    renderBare(<RateLimitCountdown seconds={30} onExpire={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Too many requests' })).toBeInTheDocument();
  });

  it('accepts a custom title', () => {
    renderBare(<RateLimitCountdown seconds={30} onExpire={vi.fn()} title="Slow down a moment" />);

    expect(screen.getByRole('heading', { name: 'Slow down a moment' })).toBeInTheDocument();
  });

  it('says explicitly that submitted work is safe', () => {
    renderBare(<RateLimitCountdown seconds={30} onExpire={vi.fn()} />);

    expect(screen.getByText(/Everything you have already submitted is\s+safe/)).toBeInTheDocument();
  });
});

describe('the countdown', () => {
  it('starts at the seconds it was given', () => {
    vi.useFakeTimers();
    renderBare(<RateLimitCountdown seconds={45} onExpire={vi.fn()} />);

    expect(screen.getByText('45s')).toBeInTheDocument();
  });

  it('rounds a fractional retry-after up rather than down', () => {
    vi.useFakeTimers();
    renderBare(<RateLimitCountdown seconds={12.2} onExpire={vi.fn()} />);

    expect(screen.getByText('13s')).toBeInTheDocument();
  });

  it('ticks down once a second', () => {
    vi.useFakeTimers();
    renderBare(<RateLimitCountdown seconds={10} onExpire={vi.fn()} />);

    act(() => {
      vi.advanceTimersByTime(4_000);
    });

    expect(screen.getByText('6s')).toBeInTheDocument();
  });

  it('shows "Ready" rather than "0s" at the end', () => {
    vi.useFakeTimers();
    renderBare(<RateLimitCountdown seconds={2} onExpire={vi.fn()} />);

    act(() => {
      vi.advanceTimersByTime(5_000);
    });

    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('announces the wait politely', () => {
    vi.useFakeTimers();
    renderBare(<RateLimitCountdown seconds={90} onExpire={vi.fn()} />);

    expect(screen.getByText('Please wait 1:30')).toHaveAttribute('aria-live', 'polite');
  });

  it('announces readiness when the window closes', () => {
    vi.useFakeTimers();
    renderBare(<RateLimitCountdown seconds={1} onExpire={vi.fn()} />);

    act(() => {
      vi.advanceTimersByTime(2_000);
    });

    expect(screen.getByText('You can retry now')).toBeInTheDocument();
  });
});

describe('expiry', () => {
  it('calls onExpire once the countdown finishes', () => {
    vi.useFakeTimers();
    const onExpire = vi.fn();
    renderBare(<RateLimitCountdown seconds={3} onExpire={onExpire} />);

    act(() => {
      vi.advanceTimersByTime(5_000);
    });

    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('calls onExpire exactly once, however long the page sits there', () => {
    vi.useFakeTimers();
    const onExpire = vi.fn();
    renderBare(<RateLimitCountdown seconds={2} onExpire={onExpire} />);

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('fires immediately when the server sent a zero retry-after', () => {
    vi.useFakeTimers();
    const onExpire = vi.fn();
    renderBare(<RateLimitCountdown seconds={0} onExpire={onExpire} />);

    expect(onExpire).toHaveBeenCalledTimes(1);
  });
});

describe('the manual retry button', () => {
  it('is disabled while the bucket is still refilling', () => {
    vi.useFakeTimers();
    renderBare(<RateLimitCountdown seconds={30} onExpire={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Retry' })).toBeDisabled();
  });

  it('becomes available once the countdown is done', () => {
    vi.useFakeTimers();
    renderBare(<RateLimitCountdown seconds={2} onExpire={vi.fn()} />);

    act(() => {
      vi.advanceTimersByTime(3_000);
    });

    expect(screen.getByRole('button', { name: 'Retry' })).toBeEnabled();
  });
});
