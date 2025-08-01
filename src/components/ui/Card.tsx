/**
 * Card.
 *
 * A surface with a heading. The heading level is a **required** prop rather than a hardcoded
 * `<h3>`: a page whose heading levels skip from h1 to h3 is a documented WCAG failure, and
 * cards get nested in enough places that we cannot guess.
 */
import type { ReactNode } from 'react';

import { cn, pz } from '@lib/cn';

import { color, font, radius, shadow, space } from './tokens';

export type HeadingLevel = 2 | 3 | 4;

/**
 * The element the card renders as. `section` needs an accessible name (`aria-label` or
 * `aria-labelledby`); `article` is for a self-contained tile in a grid of tiles.
 */
