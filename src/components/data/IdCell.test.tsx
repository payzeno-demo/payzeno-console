/**
 * `IdCell`. Half the console's job is helping someone paste an id into a support ticket, so
 * the truncation must be reversible (the full value stays in `title`) and the copy control
 * must announce itself.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { IdCell, idExportValue } from '@components/data/IdCell';
import { truncateId } from '@lib/format';
import { renderBare, screen, waitFor } from '@/test/render';

const CHARGE_ID = 'ch_01HW0RTCHARGE00000001';

let writeText: ReturnType<typeof vi.fn>;

beforeEach(() => {
  writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('rendering', () => {
  it('truncates a long id in the middle, keeping both ends recognisable', () => {
    renderBare(<IdCell value={CHARGE_ID} />);

    expect(screen.getByText(truncateId(CHARGE_ID))).toBeInTheDocument();
    expect(screen.getByText(/^ch_01HW0/)).toBeInTheDocument();
    expect(screen.getByText(/0001$/)).toBeInTheDocument();
  });

  it('keeps the full value in `title`, so truncation loses nothing', () => {
    renderBare(<IdCell value={CHARGE_ID} />);

    expect(screen.getByTitle(CHARGE_ID)).toBeInTheDocument();
  });

  it('honours custom head and tail lengths', () => {
    renderBare(<IdCell value={CHARGE_ID} head={4} tail={2} />);

    expect(screen.getByText(truncateId(CHARGE_ID, 4, 2))).toBeInTheDocument();
  });

  it('does not truncate an id short enough to fit', () => {
    renderBare(<IdCell value="ch_1" />);

    expect(screen.getByText('ch_1')).toBeInTheDocument();
    expect(screen.queryByText(/…/)).not.toBeInTheDocument();
  });

  it('renders a monospace code element, so ids line up in a column', () => {
    const { container } = renderBare(<IdCell value={CHARGE_ID} />);

    expect(container.querySelector('code')).toBeInTheDocument();
  });

  it('renders an em dash and no copy button when there is no id', () => {
    renderBare(<IdCell value={null} />);

    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('the copy control', () => {
  it('names the button after the resource and the whole id', () => {
    renderBare(<IdCell value={CHARGE_ID} resourceLabel="charge" />);

    expect(
      screen.getByRole('button', { name: `Copy charge ${CHARGE_ID}` }),
    ).toBeInTheDocument();
  });

  it('copies the untruncated value, not what is on screen', async () => {
    const { user } = renderBare(<IdCell value={CHARGE_ID} resourceLabel="charge" />);

    await user.click(screen.getByRole('button', { name: /^Copy charge/ }));

    expect(writeText).toHaveBeenCalledWith(CHARGE_ID);
  });

  it('announces the copy in a live region — the tick alone is not enough', async () => {
    const { user } = renderBare(<IdCell value={CHARGE_ID} resourceLabel="charge" />);

    await user.click(screen.getByRole('button', { name: /^Copy charge/ }));

    await waitFor(() => {
      expect(screen.getByText('charge copied to clipboard')).toBeInTheDocument();
    });
  });

  it('announces a failure rather than pretending it worked', async () => {
    writeText.mockRejectedValueOnce(new Error('denied'));
    const { user } = renderBare(<IdCell value={CHARGE_ID} resourceLabel="charge" />);

    await user.click(screen.getByRole('button', { name: /^Copy charge/ }));

    await waitFor(() => {
      expect(screen.getByText('Could not copy charge')).toBeInTheDocument();
    });
  });

  it('can be turned off for a cell that is already inside a link', () => {
    renderBare(<IdCell value={CHARGE_ID} copyable={false} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByTitle(CHARGE_ID)).toBeInTheDocument();
  });
});

describe('idExportValue', () => {
  it('exports the full id, never the truncated one', () => {
    expect(idExportValue(CHARGE_ID)).toBe(CHARGE_ID);
  });

  it('exports an empty cell for a missing id', () => {
    expect(idExportValue(null)).toBe('');
    expect(idExportValue(undefined)).toBe('');
  });
});
