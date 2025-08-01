/**
 * Toast — the single notification's presentation.
 *
 * `<Toaster>` owns the viewport and the queue; this file owns one toast and the shape of the
 * data behind it.
 *
 * a11y: error toasts get `role="alert"` (assertive) and never auto-dismiss; everything else is
 * polite and times out. An error that vanishes after five seconds is an error the user did not
 * read.
 */
import * as RadixToast from '@radix-ui/react-toast';
