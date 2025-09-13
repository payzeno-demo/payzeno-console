/**
 * A field-level or form-level error message.
 *
 * The `id` is **required**, because the only correct way to use this is to point the control's
 * `aria-describedby` at it. An error message that is visually next to an input but not
 * programmatically associated with it does not exist for a screen-reader user, and this repo
 * shipped seventeen of those before the rule went into the ESLint config (PAY-1698).
 *
 *     <Input id="amount" aria-describedby={err ? 'amount-error' : undefined} />
 *     {err ? <InlineError id="amount-error">{err}</InlineError> : null}
 *
 * `role` defaults to `alert` for form-level errors (something just failed) and can be dropped
 * to `status` for validation that appears as you type, which should not interrupt.
 */
import type { ReactNode } from 'react';

import { pz } from '@lib/cn';

import { color, font, space } from '../ui/tokens';

