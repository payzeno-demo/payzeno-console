/**
 * `Tabs`. Controlled, always — the developers page keeps the active tab in the URL, so an
 * internally-stateful tab set would fight the router.
 */
import { describe, expect, it, vi } from 'vitest';

import { Tabs, defaultTabId } from '@components/ui/Tabs';
import type { TabSpec } from '@components/ui/Tabs';
import { renderBare, screen } from '@/test/render';

const tabs: ReadonlyArray<TabSpec> = [
  { id: 'keys', label: 'API keys', content: <p>Key list</p> },
  { id: 'events', label: 'Webhook events', content: <p>Event list</p> },
  { id: 'logs', label: 'Request logs', content: <p>Log list</p>, disabled: true },
];

describe('defaultTabId', () => {
  it('picks the first enabled tab', () => {
    expect(defaultTabId(tabs)).toBe('keys');
  });

  it('skips leading disabled tabs', () => {
    expect(defaultTabId([tabs[2]!, tabs[1]!])).toBe('events');
  });

  it('falls back to the first tab when every one is disabled', () => {
    expect(defaultTabId([{ ...tabs[2]!, id: 'only' }])).toBe('only');
  });

  it('returns an empty string for an empty set rather than throwing', () => {
    expect(defaultTabId([])).toBe('');
  });
});

describe('the tab list', () => {
  it('is a labelled tablist', () => {
    renderBare(<Tabs tabs={tabs} value="keys" onValueChange={vi.fn()} label="Developer sections" />);

    expect(screen.getByRole('tablist', { name: 'Developer sections' })).toBeInTheDocument();
  });

  it('renders one tab per spec', () => {
    renderBare(<Tabs tabs={tabs} value="keys" onValueChange={vi.fn()} label="Sections" />);

    expect(screen.getAllByRole('tab')).toHaveLength(3);
  });

  it('marks the controlled tab as selected and the others as not', () => {
    renderBare(<Tabs tabs={tabs} value="events" onValueChange={vi.fn()} label="Sections" />);

    expect(screen.getByRole('tab', { name: 'Webhook events' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: 'API keys' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('disables the tabs that say they are disabled', () => {
    renderBare(<Tabs tabs={tabs} value="keys" onValueChange={vi.fn()} label="Sections" />);

    expect(screen.getByRole('tab', { name: 'Request logs' })).toBeDisabled();
  });

  it('renders a tab adornment beside its label', () => {
    const withBadge: ReadonlyArray<TabSpec> = [
      { ...tabs[0]!, adornment: <span data-testid="count">3</span> },
    ];
    renderBare(<Tabs tabs={withBadge} value="keys" onValueChange={vi.fn()} label="Sections" />);

    expect(screen.getByTestId('count')).toBeInTheDocument();
  });
});

describe('the panels', () => {
  it('shows only the active panel', () => {
    renderBare(<Tabs tabs={tabs} value="keys" onValueChange={vi.fn()} label="Sections" />);

    expect(screen.getByText('Key list')).toBeInTheDocument();
    expect(screen.queryByText('Event list')).not.toBeInTheDocument();
  });

  it('swaps the panel when the controlled value changes', () => {
    const { rerender } = renderBare(
      <Tabs tabs={tabs} value="keys" onValueChange={vi.fn()} label="Sections" />,
    );

    rerender(<Tabs tabs={tabs} value="events" onValueChange={vi.fn()} label="Sections" />);

    expect(screen.getByText('Event list')).toBeInTheDocument();
    expect(screen.queryByText('Key list')).not.toBeInTheDocument();
  });

  it('associates each panel with its tab', () => {
    renderBare(<Tabs tabs={tabs} value="keys" onValueChange={vi.fn()} label="Sections" />);

    const panel = screen.getByRole('tabpanel');
    const tab = screen.getByRole('tab', { name: 'API keys' });

    expect(panel).toHaveAttribute('aria-labelledby', tab.id);
  });
});

describe('switching', () => {
  it('reports the new tab id rather than switching itself', async () => {
    const onValueChange = vi.fn();
    const { user } = renderBare(
      <Tabs tabs={tabs} value="keys" onValueChange={onValueChange} label="Sections" />,
    );

    await user.click(screen.getByRole('tab', { name: 'Webhook events' }));

    expect(onValueChange).toHaveBeenCalledWith('events');
    // Still on the old panel: the parent owns the state.
    expect(screen.getByText('Key list')).toBeInTheDocument();
  });

  it('does not report a switch to a disabled tab', async () => {
    const onValueChange = vi.fn();
    const { user } = renderBare(
      <Tabs tabs={tabs} value="keys" onValueChange={onValueChange} label="Sections" />,
    );

    await user.click(screen.getByRole('tab', { name: 'Request logs' }));

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('moves between tabs with the arrow keys', async () => {
    const onValueChange = vi.fn();
    const { user } = renderBare(
      <Tabs tabs={tabs} value="keys" onValueChange={onValueChange} label="Sections" />,
    );

    screen.getByRole('tab', { name: 'API keys' }).focus();
    await user.keyboard('{ArrowRight}');

    expect(onValueChange).toHaveBeenCalledWith('events');
  });
});
