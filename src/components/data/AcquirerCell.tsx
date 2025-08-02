/**
 * Which acquirer authorised or settled a row.
 *
 * There are exactly two (`ACQUIRERS` in contracts) and merchants care, because when one of
 * them has a bad afternoon the settlement page fills up with `retryable` items from that
