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

import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { color, font, space } from '../ui/tokens';

/**
 * Full shape drives everything (page size selector, "previous", the row count). The reduced
 * shape — `hasMore` / `onNext` / `onReset` / `isBusy` — is what the feature tables that still
 * hold their own cursor in URL state pass. TODO(rrefactor): move them all onto
 * `usePagination()` and delete the aliases. PAY-1968.
 */
export interface DataTablePaginationProps {
  pageNumber?: number;
  pageSize?: number;
  /** Rows on the current page, for the "showing N" label. */
  rowsOnPage?: number;
  canGoBack?: boolean;
  canGoForward?: boolean;
  isFetching?: boolean;
  onPrevious?: () => void;
  onNext: () => void;
  onPageSizeChange?: (size: number) => void;
  /** Resource name for the label — "charges", "settlement items". */
  resourceLabel?: string;

  /** Reduced shape: the API said there is another cursor. */
  hasMore?: boolean;
  /** Reduced shape: back to page one (the only "previous" a raw cursor can express). */
  onReset?: () => void;
  /** Reduced shape alias for `isFetching`. */
  isBusy?: boolean;
}

export function DataTablePagination({
  pageNumber = 1,
  pageSize = PAGE_SIZE_OPTIONS[0] ?? 25,
  rowsOnPage = 0,
  canGoBack,
  canGoForward,
  isFetching,
  onPrevious,
  onNext,
  onPageSizeChange,
  resourceLabel = 'rows',
  hasMore,
  onReset,
  isBusy,
}: DataTablePaginationProps) {
  const forward = canGoForward ?? hasMore ?? false;
  const back = canGoBack ?? (onReset !== undefined && pageNumber > 1);
  const busy = isFetching ?? isBusy ?? false;
  const goBack = onPrevious ?? onReset ?? (() => undefined);
  const changePageSize = onPageSizeChange ?? (() => undefined);

  return (
    <nav
      aria-label={`${resourceLabel} pagination`}
      className={pz('pagination')}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: space[4],
        padding: `${space[3]} ${space[1]}`,
        fontFamily: font.family,
        fontSize: font.size.sm,
        color: color.textSecondary,
      }}
    >
      {onPageSizeChange ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: space[2] }}>
          <label htmlFor="page-size" style={{ color: color.textSecondary }}>
            Rows per page
          </label>
          <Select
            id="page-size"
            ariaLabel="Rows per page"
            value={String(pageSize)}
            onValueChange={(next) => changePageSize(Number.parseInt(next, 10))}
            options={PAGE_SIZE_OPTIONS.map((size) => ({ value: String(size), label: String(size) }))}
          />
        </div>
      ) : (
        <span />
      )}

      <p aria-live="polite" style={{ margin: 0 }}>
        Page {pageNumber}
        {rowsOnPage > 0 ? ` — showing ${pluralise(rowsOnPage, resourceLabel.replace(/s$/, ''))}` : ''}
