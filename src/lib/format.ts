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
