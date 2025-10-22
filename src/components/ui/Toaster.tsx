/**
 * Toast viewport.
 *
 * Mounted exactly once, by `<ToastProvider>`. It owns the queue and renders each `ToastSpec`
 * through `<Toast>`.
 *
 * The queue is capped: a failing settlement sweep can produce a dozen errors in a second, and a
 * wall of toasts is a denial of service against the page underneath. Oldest non-error toasts
 * are dropped first.
 */
