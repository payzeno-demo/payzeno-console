/**
 * A Payzeno resource id, in a table cell.
 *
 * Ids are long (`pi_01HX9K3M7QW2R4T5Y6U7V8W9X0`) and every finance person we watched using the
 * console did the same two things with them: squinted at the last few characters to tell two
 * rows apart, then copied the whole thing into a support ticket. So: truncate in the middle,
 * keep the full value in `title` and in the clipboard.
 *
 * a11y notes (tflexbox):
 *  - the visible text is truncated, so the full id is exposed through the copy button's
 *    accessible name — a screen reader reading "p i underscore ellipsis" is useless;
 *  - the copy result is announced through a polite live region, not a toast, because a toast
 *    for every copy is noise;
 *  - `<code>` carries the mono font from tokens, not a hardcoded family.
 */
import { useCopyToClipboard } from '@hooks/useCopyToClipboard';
import { pz } from '@lib/cn';
import { truncateId } from '@lib/format';

import { IconButton } from '../ui/IconButton';
import { color, font, space, visuallyHidden } from '../ui/tokens';

