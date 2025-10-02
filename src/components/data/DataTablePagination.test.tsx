/**
 * `DataTablePagination`.
 *
 * This component has two prop vocabularies, which is a wart worth being explicit about: the
 * cursor-page features (`usePagination`) pass `canGoBack` / `canGoForward` / `onPrevious`,
 * while the three older call sites pass `hasMore` / `onReset` / `isBusy`. Both are supported
 * and both are tested, because deleting the legacy pair without checking is how three pages
 * lose their Next button at once.
 */
import { describe, expect, it, vi } from 'vitest';

import { DataTablePagination } from '@components/data/DataTablePagination';
import { PAGE_SIZE_OPTIONS } from '@config/constants';
import { renderBare, screen } from '@/test/render';

const noop = () => undefined;

describe('the region', () => {
  it('is a navigation landmark named after the resource', () => {
    renderBare(<DataTablePagination onNext={noop} resourceLabel="payouts" />);

    expect(screen.getByRole('navigation', { name: 'payouts pagination' })).toBeInTheDocument();
  });

  it('falls back to a generic label when the caller does not name the resource', () => {
    renderBare(<DataTablePagination onNext={noop} />);

    expect(screen.getByRole('navigation', { name: 'rows pagination' })).toBeInTheDocument();
  });
});

describe('the status line', () => {
  it('shows the page number', () => {
    renderBare(<DataTablePagination onNext={noop} pageNumber={3} />);

    expect(screen.getByText(/Page 3/)).toBeInTheDocument();
  });

  it('shows the row count on the page, singularised properly', () => {
    renderBare(<DataTablePagination onNext={noop} rowsOnPage={1} resourceLabel="disputes" />);

    expect(screen.getByText(/showing 1 dispute\b/)).toBeInTheDocument();
  });

  it('pluralises past one', () => {
    renderBare(<DataTablePagination onNext={noop} rowsOnPage={24} resourceLabel="disputes" />);

    expect(screen.getByText(/showing 24 disputes/)).toBeInTheDocument();
  });

  it('omits the row count when the page is empty rather than saying "showing 0"', () => {
    renderBare(<DataTablePagination onNext={noop} rowsOnPage={0} />);

    expect(screen.queryByText(/showing/)).not.toBeInTheDocument();
  });

  it('is a polite live region, so a page change is announced', () => {
    renderBare(<DataTablePagination onNext={noop} pageNumber={2} />);

    expect(screen.getByText(/Page 2/)).toHaveAttribute('aria-live', 'polite');
  });

  it('says so while a fetch is in flight', () => {
    renderBare(<DataTablePagination onNext={noop} isFetching />);

    expect(screen.getByText(/updating…/)).toBeInTheDocument();
  });
});

describe('the cursor-page vocabulary', () => {
  it('enables Next only when the caller says there is a next page', () => {
    const { rerender } = renderBare(<DataTablePagination onNext={noop} canGoForward={false} />);
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();

    rerender(<DataTablePagination onNext={noop} canGoForward />);
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
  });

  it('enables Previous only when there is history behind the cursor', () => {
    const { rerender } = renderBare(
      <DataTablePagination onNext={noop} canGoBack={false} onPrevious={noop} />,
    );
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();

    rerender(<DataTablePagination onNext={noop} canGoBack onPrevious={noop} />);
    expect(screen.getByRole('button', { name: 'Previous' })).toBeEnabled();
  });

  it('calls onNext', async () => {
    const onNext = vi.fn();
    const { user } = renderBare(<DataTablePagination onNext={onNext} canGoForward />);

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('calls onPrevious', async () => {
    const onPrevious = vi.fn();
    const { user } = renderBare(
      <DataTablePagination onNext={noop} onPrevious={onPrevious} canGoBack />,
    );

    await user.click(screen.getByRole('button', { name: 'Previous' }));

    expect(onPrevious).toHaveBeenCalledTimes(1);
  });
});

describe('the legacy vocabulary', () => {
  it('accepts `hasMore` in place of `canGoForward`', () => {
    renderBare(<DataTablePagination onNext={noop} hasMore />);

    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
  });

  it('accepts `onReset` as the back action once past page one', async () => {
    const onReset = vi.fn();
    const { user } = renderBare(
      <DataTablePagination onNext={noop} onReset={onReset} pageNumber={2} />,
    );

    await user.click(screen.getByRole('button', { name: 'Previous' }));

    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('keeps Previous disabled on page one even with onReset supplied', () => {
    renderBare(<DataTablePagination onNext={noop} onReset={noop} pageNumber={1} />);

    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
  });

  it('accepts `isBusy` in place of `isFetching`', () => {
    renderBare(<DataTablePagination onNext={noop} isBusy />);

    expect(screen.getByText(/updating…/)).toBeInTheDocument();
  });
});

describe('page size', () => {
  it('offers the control only when the feature can act on it', () => {
    renderBare(<DataTablePagination onNext={noop} />);

    expect(screen.queryByLabelText('Rows per page')).not.toBeInTheDocument();
  });

  it('renders a labelled select showing the current size', () => {
    renderBare(
      <DataTablePagination onNext={noop} pageSize={50} onPageSizeChange={vi.fn()} />,
    );

    const control = screen.getByLabelText('Rows per page');
    expect(control).toBeInTheDocument();
    expect(control).toHaveTextContent('50');
  });

  it('defaults to the first configured page size', () => {
    renderBare(<DataTablePagination onNext={noop} onPageSizeChange={vi.fn()} />);

    expect(screen.getByLabelText('Rows per page')).toHaveTextContent(
      String(PAGE_SIZE_OPTIONS[0]),
    );
  });
});
