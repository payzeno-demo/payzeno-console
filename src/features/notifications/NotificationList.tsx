/**
 * The list inside the bell's popover. Presentational: it takes entries and two callbacks and
 * never fetches anything.
 *
 * `payout.failed` is styled as critical and links straight to the payout detail page —
 * domain-model.md §9 makes it the one event the console surfaces directly, because a failed
 * payout means the merchant's money did not arrive and the alternative is that they find out
 * from their bank.
