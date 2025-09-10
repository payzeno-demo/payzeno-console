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

});
