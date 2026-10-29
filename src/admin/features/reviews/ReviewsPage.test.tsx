import { screen, waitFor, within } from '@testing-library/react';

import { AdminApp } from '../../AdminApp';
import { renderAdmin } from '../../test/renderAdmin';

import { countryMismatch, describeCountries, scoreBand } from './review-format';

describe('ReviewsPage', () => {
  it('opens on the open queue, oldest first, with the signals in the row', async () => {
    renderAdmin(<AdminApp />, { route: '/reviews', role: 'risk' });

    const queue = await screen.findByRole('table', { name: 'Open risk reviews, oldest first' });
    await waitFor(() => expect(within(queue).getAllByRole('row')).toHaveLength(4));

    const rows = within(queue).getAllByRole('row').slice(1);
    expect(rows[0]).toHaveTextContent('rv_01HZADMREVIEW0000000001');
    expect(rows[0]).toHaveTextContent('Card country ≠ shopper country');
    expect(rows[0]).toHaveTextContent('NG / GB');
    expect(rows[0]).toHaveTextContent('Mismatch');
    expect(rows[2]).toHaveTextContent('Location unknown');
    expect(queue).not.toHaveTextContent('rv_01HZADMREVIEW0000000004');
  });

  it('shows decided reviews when the filter says so', async () => {
    renderAdmin(<AdminApp />, { route: '/reviews?status=all', role: 'risk' });

    const table = await screen.findByRole('table', { name: 'Risk reviews' });
    await waitFor(() => expect(within(table).getAllByRole('row')).toHaveLength(5));
  });
});

describe('review signals', () => {
  it('bands the acquirer score', () => {
    expect(scoreBand(91).label).toBe('Very high');
    expect(scoreBand(78).label).toBe('High');
    expect(scoreBand(50).label).toBe('Elevated');
    expect(scoreBand(10).label).toBe('Low');
  });

  it('treats an unknown shopper country as unknown, not as a match', () => {
    expect(countryMismatch({ ip_country: 'gb', card_country: 'GB' })).toBe(false);
    expect(countryMismatch({ ip_country: 'NG', card_country: 'GB' })).toBe(true);
    expect(countryMismatch({ ip_country: null, card_country: 'GB' })).toBeNull();
    expect(describeCountries({ ip_country: null, card_country: 'IE' })).toContain('shopper location unknown');
  });
});
