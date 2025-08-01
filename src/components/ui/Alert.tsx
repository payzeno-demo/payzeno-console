/**
 * Inline alert.
 *
 * For state that belongs on the page rather than in a toast: a negative balance, a legacy
 * invoice notice, an upstream that is degraded. Persistent, not transient.
 *
 * `role` follows severity: `alert` for danger (assertive, interrupts), `status` for warning and
 * info (polite). Getting this wrong either shouts routine information at a screen-reader user
 * or silently swallows an urgent one.
