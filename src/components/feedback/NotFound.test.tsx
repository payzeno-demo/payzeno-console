/**
 * `NotFound` — the 404 screen, used both as the router's catch-all and as a detail-page state
 * when a resource id belongs to someone else.
 *
 * The default body mentions live-versus-test mode on purpose. Roughly half the 404s a
 * developer hits in the console are a test-mode id pasted into a live-mode session, and saying
 * so on the page is cheaper than saying it in the docs.
 */
import { describe, expect, it } from 'vitest';

import { NotFound } from '@components/feedback/NotFound';
import { ROUTES } from '@/routes';
import { renderWithRouter, screen } from '@/test/render';

describe('defaults', () => {
  it('renders a main landmark with a heading', () => {
    renderWithRouter(<NotFound />);

    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'We could not find that' }),
    ).toBeInTheDocument();
  });

  it('shows a decorative 404 that is hidden from assistive technology', () => {
    renderWithRouter(<NotFound />);

    const marker = screen.getByText('404');
    expect(marker).toHaveAttribute('aria-hidden', 'true');
  });

  it('mentions the live/test-mode trap in the default copy', () => {
    renderWithRouter(<NotFound />);

    expect(screen.getByText(/live or test mode/)).toBeInTheDocument();
  });

  it('links home', () => {
    renderWithRouter(<NotFound />);

    expect(screen.getByRole('link', { name: 'Back to the dashboard' })).toHaveAttribute(
      'href',
      '/',
    );
  });
});

describe('customisation', () => {
  it('accepts a title and body', () => {
    renderWithRouter(
      <NotFound title="No such settlement batch" body="You have no items in this batch." />,
    );

    expect(
      screen.getByRole('heading', { name: 'No such settlement batch' }),
    ).toBeInTheDocument();
    expect(screen.getByText('You have no items in this batch.')).toBeInTheDocument();
  });

  it('points its home link wherever the caller says', () => {
    renderWithRouter(<NotFound homeTo={ROUTES.payouts.index} />);

    expect(screen.getByRole('link', { name: 'Back to the dashboard' })).toHaveAttribute(
      'href',
      '/payouts',
    );
  });

  it('renders a reference when one is supplied', () => {
    renderWithRouter(<NotFound reference="req_404_abc" />);

    expect(screen.getByText('req_404_abc')).toBeInTheDocument();
  });

  it('omits the reference block when there is nothing to quote', () => {
    renderWithRouter(<NotFound />);

    expect(screen.queryByText(/^req_/)).not.toBeInTheDocument();
  });
});

describe('as the settlements-flag fallback', () => {
  it('renders the flag-off copy the router hands it and links to payouts instead', () => {
    renderWithRouter(
      <NotFound
        title="Settlements are not available"
        body="The settlement explorer is turned off for this account. Your payouts page still shows when money arrived."
        homeTo={ROUTES.payouts.index}
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'Settlements are not available' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/turned off for this account/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to the dashboard' })).toHaveAttribute(
      'href',
      '/payouts',
    );
  });
});
