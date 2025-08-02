/**
 * Inline failure state for a region of a page — the table failed, the summary cards failed —
 * where blowing the whole route away would be disproportionate.
 *
 * It is deliberately *thinner* than `<ErrorFallback>`: the full subclass ladder lives in
 * `ErrorBoundary.tsx` and this only distinguishes the three things a merchant can act on
 * (permission, upstream, everything else). Anything richer belongs in the boundary.
 *
 * a11y: `role="status"` rather than `role="alert"`, because a failed section is not an
