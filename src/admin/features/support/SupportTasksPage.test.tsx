import { screen, waitFor, within } from '@testing-library/react';

import { AdminApp } from '../../AdminApp';
import { renderAdmin } from '../../test/renderAdmin';

const TASK = 'sup_01HZADMTASK00000000001';
const TITLE = 'Possible double capture on a capture-at-settlement charge';

describe('SupportTasksPage', () => {
  it('opens on the open tasks', async () => {
    renderAdmin(<AdminApp />, { route: '/support', role: 'support' });

    const table = await screen.findByRole('table', { name: 'Open support tasks' });
    await waitFor(() => expect(within(table).getAllByRole('row')).toHaveLength(3));
    expect(table).toHaveTextContent(TITLE);
    expect(table).not.toHaveTextContent('Trial balance off by 1 minor unit');
  });

  it('resolves a task with a required note', async () => {
    const { user, db } = renderAdmin(<AdminApp />, { route: '/support', role: 'support' });

    await user.click(await screen.findByRole('button', { name: `Resolve task: ${TITLE}` }));
    const dialog = await screen.findByRole('dialog', { name: `Resolve “${TITLE}”?` });

    await user.click(within(dialog).getByRole('button', { name: 'Resolve task' }));
    expect(await within(dialog).findByText('Write what you did before closing the task.')).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText(/^Resolution note/), 'Acquirer confirmed a single capture.');
    await user.click(within(dialog).getByRole('button', { name: 'Resolve task' }));

    expect(await screen.findByTestId('action-outcome')).toHaveTextContent(`Task resolved: ${TITLE}`);
    expect(db.supportTasks.find((task) => task.id === TASK)).toMatchObject({
      status: 'resolved',
      resolution_note: 'Acquirer confirmed a single capture.',
    });
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: `Resolve task: ${TITLE}` })).not.toBeInTheDocument(),
    );
  });
});
