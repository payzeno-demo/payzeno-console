/**
 * Checkbox.
 *
 * Supports the indeterminate state, which the data table's "select all on page" header needs
 * and which a plain `<input type=checkbox>` cannot express declaratively in React without an
 * effect that pokes the DOM node.
 */
import * as RadixCheckbox from '@radix-ui/react-checkbox';

import { cn, pz } from '@lib/cn';

import { color, font, radius, space } from './tokens';

export type CheckedState = boolean | 'indeterminate';

