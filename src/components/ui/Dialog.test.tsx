/**
 * `Dialog` — the wrapper behind `CaptureDialog`, `RefundDialog`, `CreatePayoutDialog` and
 * `AddBankAccountDialog`.
 *
 * The `destructive` prop is the interesting one: a dialog that is about to move money must not
 * close because the merchant clicked slightly outside it. That is a real support ticket, not a
 * hypothetical.
 */
import { describe, expect, it, vi } from 'vitest';

import { Button } from '@components/ui/Button';
import { Dialog, DialogActions } from '@components/ui/Dialog';
import { renderBare, screen, waitFor } from '@/test/render';

function renderDialog(props: Partial<Parameters<typeof Dialog>[0]> = {}) {
  const onOpenChange = vi.fn();
  const result = renderBare(
    <Dialog
      open
      onOpenChange={onOpenChange}
      title="Capture payment"
      description="Capturing takes the authorised funds."
      {...props}
    >
      <p>Body content</p>
    </Dialog>,
  );
  return { ...result, onOpenChange };
}

describe('when open', () => {
  it('renders a dialog named by its title', () => {
    renderDialog();

    expect(screen.getByRole('dialog', { name: 'Capture payment' })).toBeInTheDocument();
  });

  it('associates the description with the dialog', () => {
    renderDialog();

    const dialog = screen.getByRole('dialog');
    const describedBy = dialog.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)).toHaveTextContent(
      'Capturing takes the authorised funds.',
    );
  });

  it('renders its children', () => {
    renderDialog();

    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('renders a footer when one is supplied', () => {
    renderDialog({
      footer: (
        <DialogActions>
          <Button variant="primary">Capture</Button>
        </DialogActions>
      ),
    });

    expect(screen.getByRole('button', { name: 'Capture' })).toBeInTheDocument();
  });

  it('offers a labelled close control', () => {
    renderDialog();

    expect(screen.getByRole('button', { name: 'Close dialog' })).toBeInTheDocument();
  });
});

describe('when closed', () => {
  it('renders nothing at all', () => {
    renderBare(
      <Dialog open={false} onOpenChange={vi.fn()} title="Capture payment">
        <p>Body content</p>
      </Dialog>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Body content')).not.toBeInTheDocument();
  });
});

describe('closing', () => {
  it('reports a close when the close button is pressed', async () => {
    const { user, onOpenChange } = renderDialog();

    await user.click(screen.getByRole('button', { name: 'Close dialog' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('reports a close on Escape', async () => {
    const { user, onOpenChange } = renderDialog();

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('still closes on Escape when destructive — the keyboard route is never trapped', async () => {
    const { user, onOpenChange } = renderDialog({ destructive: true });

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});

describe('sizes', () => {
  it.each([
    ['sm', '400px'],
    ['md', '520px'],
    ['lg', '760px'],
  ] as const)('caps the %s dialog at %s', (size, width) => {
    renderDialog({ size });

    expect(screen.getByRole('dialog').style.width).toContain(width);
  });

  it('never exceeds the viewport, whatever the size', () => {
    renderDialog({ size: 'lg' });

    expect(screen.getByRole('dialog').style.width).toContain('min(');
  });
});

describe('focus', () => {
  it('moves focus inside the dialog when it opens', async () => {
    renderDialog({
      footer: <Button variant="primary">Capture</Button>,
    });

    await waitFor(() => {
      expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true);
    });
  });
});
