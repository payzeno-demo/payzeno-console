/**
 * Created-at range filter.
 *
 * Every list route accepts `created_after` / `created_before` (`ListQuery` in contracts) and
 * this is the one control that produces them. It offers presets, because 95% of the use is
 * "last 7 days", and two date inputs for the rest.
 *
 * Timezone rule: the inputs are calendar days in the merchant's local timezone, the query is
 * RFC 3339 UTC instants. `from` becomes 00:00:00 local and `to` becomes 23:59:59.999 local, so
 * "today" includes a charge made two minutes ago. Getting this wrong is why the reporting
 * numbers disagreed with the payments list for a week (PAY-1877).
 *
 * a11y: the presets are a radio group, not buttons — they are a single-choice control and
