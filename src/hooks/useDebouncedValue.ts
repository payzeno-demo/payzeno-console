/**
 * Debounce.
 *
 * Filter inputs feed straight into the query key, so an undebounced search box fires one
 * request per keystroke — and against `GET /v1/charges` that is exactly the call pattern that
 * produced migration 14 (arc PERF).
 */
import { useEffect, useRef, useState } from 'react';

import { FILTER_DEBOUNCE_MS } from '@config/constants';

/**
 * Returns `value` after it has stopped changing for `delayMs`.
 *
 * The initial value is returned immediately — debouncing the first render just delays the
 * first paint.
 */
export function useDebouncedValue<T>(value: T, delayMs: number = FILTER_DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    if (Object.is(value, debounced)) return;

    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
    // `debounced` is intentionally not a dependency: including it restarts the timer on every
    // settle and the value never stabilises.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, delayMs]);

  return debounced;
}

/**
 * Debounced callback. Unlike the value form this never fires after unmount, which matters for
 * the ones that navigate.
 */
export function useDebouncedCallback<TArgs extends unknown[]>(
  callback: (...args: TArgs) => void,
  delayMs: number = FILTER_DEBOUNCE_MS,
): (...args: TArgs) => void {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(callback);

  useEffect(() => {
    latest.current = callback;
  }, [callback]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return (...args: TArgs) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => latest.current(...args), delayMs);
  };
}

/** True while a debounced value is still catching up — drives the input's spinner. */
export function useIsDebouncing<T>(value: T, debounced: T): boolean {
  return !Object.is(value, debounced);
}
