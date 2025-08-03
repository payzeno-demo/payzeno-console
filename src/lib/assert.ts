/**
 * Invariants.
 *
 * These are for programmer errors, not for user-facing failures — an assertion that fires is a
 * bug in the console, and it should reach the error boundary and Sentry, not a toast.
 */
import { runtimeConfig } from '@config/runtime';

/** Thrown by every helper in this module. Distinct class so telemetry can bucket it. */
export class InvariantViolation extends Error {
  constructor(message: string) {
    super(`Invariant violation: ${message}`);
    this.name = 'InvariantViolation';
  }
}

/** Narrow a condition. `assert(x !== null, '…')` makes `x` non-null afterwards. */
export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new InvariantViolation(message);
  }
}

/** Unwrap a value that must be present — a route param, a cached query, a context value. */
export function assertDefined<T>(value: T | null | undefined, message: string): T {
  if (value === null || value === undefined) {
    throw new InvariantViolation(message);
  }
  return value;
}

/**
 * Exhaustiveness check for discriminated unions.
 *
 * Every `switch` over a contracts enum ends with `default: return assertNever(status)`, so
 * adding a value to `CHARGE_STATUSES` upstream fails the console's typecheck instead of
 * rendering a blank cell.
 */
export function assertNever(value: never, context = 'value'): never {
  throw new InvariantViolation(`Unhandled ${context}: ${JSON.stringify(value)}`);
}

/**
 * Assert a required context is mounted.
 *
 * Every `use*Context()` in `src/app/` calls this, which is why the failure mode of forgetting a
 * provider is a named error rather than `Cannot read properties of null`.
 */
export function assertProvider<T>(value: T | null, providerName: string): T {
  if (value === null) {
    throw new InvariantViolation(
      `${providerName} is missing. Mount it inside <AppProviders /> before rendering this tree.`,
    );
  }
  return value;
}

/**
 * Dev-only soft assertion. Warns rather than throwing, for things that are wrong but not
 * fatal — a `<DataTable>` with duplicate column ids, a status we have no colour mapping for.
 */
export function warnUnless(condition: unknown, message: string): void {
  if (!condition && runtimeConfig.environment !== 'production') {
    // eslint-disable-next-line no-console -- dev-only diagnostic, stripped from prod builds
    console.warn(`[payzeno-console] ${message}`);
  }
}
