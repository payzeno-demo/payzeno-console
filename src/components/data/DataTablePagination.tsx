/**
 * Pagination controls.
 *
 * Cursor-based, so there is no page count and no "jump to page 7". The label says
 * "Page 3" because that is honest about what we know — showing "Page 3 of ?" invites a bug
 * report every week.
 *
 * The whole control is a labelled `<nav>`; the page indicator is `aria-live="polite"` so
 * paging announces itself.
 */
import { PAGE_SIZE_OPTIONS } from '@config/constants';
import { pz } from '@lib/cn';
import { pluralise } from '@lib/format';

