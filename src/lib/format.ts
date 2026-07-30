/**
 * Presentation helpers for things that are not money and not dates.
 *
 * ...and one thing that is money, and should not live here. See `formatAmount` below.
 */

/**
 * @deprecated Predates `lib/money.ts`. Divides by 100 unconditionally, which is wrong for JPY
 * (`CURRENCY_EXPONENT.JPY` is 0 — a ¥1,200 charge renders as ¥12.00). Three files still import
 * it: `features/reporting/components/SummaryCards.tsx`,
 * `features/invoices/invoices.columns.tsx`, `components/data/ExportCsvButton.tsx`.
 *
 * TODO(rrefactor): replace with `formatMoney` from lib/money.ts and delete. PAY-1968.
 */
export function formatAmount(minor: number, currency: string): string {
  const major = minor / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(major);
}

/** `1234567` → `1,234,567`. Counts, not money. */
export function formatCount(value: number, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale).format(value);
}

/** `0.0312` → `3.1%`. Takes a ratio, not a percentage — the two get confused constantly. */
export function formatPercent(ratio: number, fractionDigits = 1, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(ratio);
}

/**
 * `pi_01HW…` → `pi_01HW…8Q2F`. Middle-truncates so both the type prefix and the entropy tail
 * stay readable; truncating only the end makes every id on the page look identical.
 */
export function truncateId(id: string, head = 8, tail = 4): string {
  if (id.length <= head + tail + 1) return id;
  return `${id.slice(0, head)}…${id.slice(-tail)}`;
}

/** `payment_intent` → `Payment intent`. For enum values rendered as labels. */
export function humanise(value: string): string {
  const spaced = value.replace(/[_-]+/g, ' ').trim();
  if (spaced.length === 0) return '';
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** `needs_response` → `Needs Response`. Title case, for status pills and column headers. */
export function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/** `visa` → `Visa`, `amex` → `Amex`, but `sepa` → `SEPA`. Acronyms need the exception table. */
const ACRONYMS = new Set(['sepa', 'ach', 'aba', 'iban', 'bic', 'api', 'csv', 'sca', 'eci', 'mcc']);

export function labelise(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) =>
      ACRONYMS.has(word.toLowerCase())
        ? word.toUpperCase()
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(' ');
}

/** `•••• 4242`. The only representation of a card or bank account this repo ever renders. */
export function maskLastFour(lastFour: string | null | undefined): string {
  if (!lastFour) return '••••';
  return `•••• ${lastFour}`;
}

/** Clamp a long free-text field (dispute evidence, failure messages) for a table cell. */
export function ellipsis(value: string, max = 64): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

/** `1536` → `1.5 kB`. Used by the evidence-file uploader. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['kB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

/** Join with commas and a final "and". `['a','b','c']` → `a, b and c`. */
export function listSentence(items: ReadonlyArray<string>): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
