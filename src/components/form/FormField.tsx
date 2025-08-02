/**
 * Label + control + hint + error, wired together.
 *
 * The whole point is that the wiring cannot be got wrong: this component owns the ids, so
 * `aria-describedby` always points at the hint and the error that are actually rendered, and
 * `aria-invalid` is always in sync with whether an error is showing.
 *
 * Children receive the wiring through a render prop rather than `cloneElement`, because
 * `cloneElement` silently does nothing when the child is wrapped in a fragment or a memo, and
 * that failure is invisible until someone runs a screen reader (PAY-1698 again).
 */
import type { ReactNode } from 'react';

