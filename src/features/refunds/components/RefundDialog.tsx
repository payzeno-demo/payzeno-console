/**
 * The one refund form in this repo. Opened from `ChargeDetailPage` and from the charges
 * table's row action.
 *
 * Everything is in minor units. There is no `* 100` here — `MoneyInput` speaks minor units
 * and `lib/money.ts` owns the exponent, which is the whole reason `formatAmount` in
 * `lib/format.ts` is a bug and this is not.
 *
 * a11y: the amount error is wired with `aria-describedby`, and the confirmation summary is a
 * live region so a screen reader hears the amount change as the user types.
