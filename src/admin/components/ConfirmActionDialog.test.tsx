import { screen } from '@testing-library/react';

import { renderBare } from '@/test/render';

import { ConfirmActionDialog } from './ConfirmActionDialog';

function renderDialog(overrides: Partial<Parameters<typeof ConfirmActionDialog>[0]> = {}) {
  const onConfirm = vi.fn();
  const onOpenChange = vi.fn();
  const view = renderBare(
    <ConfirmActionDialog
      open
      onOpenChange={onOpenChange}
      title="Restrict Northwind?"
      description="Live payments stop."
      confirmLabel="Restrict merchant"
      confirmVariant="danger"
      note={{ id: 'reason', label: 'Reason', required: true, requiredMessage: 'Give a reason.', minLength: 3 }}
      onConfirm={onConfirm}
      isPending={false}
      {...overrides}
    />,
  );
  return { ...view, onConfirm, onOpenChange };
}

describe('ConfirmActionDialog', () => {
  it('is a labelled dialog that says what will happen', () => {
    renderDialog();
    const dialog = screen.getByRole('dialog', { name: 'Restrict Northwind?' });
    expect(dialog).toHaveAccessibleDescription('Live payments stop.');
  });

  it('will not confirm with a required note left blank, and wires the error to the field', async () => {
    const { user, onConfirm } = renderDialog();

    await user.click(screen.getByRole('button', { name: 'Restrict merchant' }));

    expect(onConfirm).not.toHaveBeenCalled();
    const field = screen.getByLabelText(/^Reason/);
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveAccessibleDescription(/Give a reason\./);
  });

  it('enforces the api minimum length before sending', async () => {
    const { user, onConfirm } = renderDialog();

    await user.type(screen.getByLabelText(/^Reason/), 'ok');
    await user.click(screen.getByRole('button', { name: 'Restrict merchant' }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByText('Write at least 3 characters.')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/^Reason/), ' then');
    await user.click(screen.getByRole('button', { name: 'Restrict merchant' }));
    expect(onConfirm).toHaveBeenCalledWith('ok then');
  });

  it('shows the last failure and blocks a second click while pending', () => {
    renderDialog({ isPending: true, errorMessage: 'Payzeno refused this: needs the risk role.' });

    expect(screen.getByRole('alert')).toHaveTextContent('Payzeno refused this: needs the risk role.');
    expect(screen.getByRole('button', { name: 'Restrict merchant' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });

  it('confirms without a note when there is no note field', async () => {
    const { user, onConfirm } = renderDialog({ note: undefined, confirmLabel: 'Approve onboarding' });
    await user.click(screen.getByRole('button', { name: 'Approve onboarding' }));
    expect(onConfirm).toHaveBeenCalledWith('');
  });
});
