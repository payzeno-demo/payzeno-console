/**
 * A field-level or form-level error message.
 *
 * The `id` is **required**, because the only correct way to use this is to point the control's
 * `aria-describedby` at it. An error message that is visually next to an input but not
 * programmatically associated with it does not exist for a screen-reader user, and this repo
 * shipped seventeen of those before the rule went into the ESLint config (PAY-1698).
