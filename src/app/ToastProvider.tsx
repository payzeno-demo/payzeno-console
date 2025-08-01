/**
 * Toasts.
 *
 * Owns the queue and mounts `<Toaster />` exactly once. `useToast()` is what every mutation
 * hook calls on success or failure.
 *
 * Rules the API shape enforces, learned the hard way:
 *  - `error()` toasts never auto-dismiss. A five-second error is an error nobody read.
 *  - Success toasts are short and do not stack: `success()` replaces the previous success
