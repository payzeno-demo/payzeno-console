/**
 * Label + control + hint + error, wired together.
 *
 * The whole point is that the wiring cannot be got wrong: this component owns the ids, so
 * `aria-describedby` always points at the hint and the error that are actually rendered, and
 * `aria-invalid` is always in sync with whether an error is showing.
 *
 * Children receive the wiring through a render prop rather than `cloneElement`, because
 * `cloneElement` silently does nothing when the child is wrapped in a fragment or a memo, and
 * that failure is invisible until someone runs a screen reader (PAY-1698 again).
 */
import type { ReactNode } from 'react';

import { pz } from '@lib/cn';

import { InlineError } from '../feedback/InlineError';
import { Label } from '../ui/Label';
import { color, font, space } from '../ui/tokens';
// One `errorIdFor` for the whole form layer. `useZodForm` derives `aria-describedby` from the
// same function, so a field wired by hand and a field wired by the hook agree on the id —
// they did not for two releases, and the error text was announced by neither (PAY-1698).
import { errorIdFor } from './field-errors';

export interface FieldWiring {
  id: string;
  'aria-describedby': string | undefined;
