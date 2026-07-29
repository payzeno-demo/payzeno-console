/**
 * `Toast`, `toastSpec` and the `Toaster` stack that hosts them.
 *
 * The rule that matters: an error toast never auto-dismisses. A merchant who looked away for
 * four seconds and came back to a vanished "Refund failed" has no idea anything went wrong,
 * and the console has no other place that message appears.
 */
import { describe, expect, it, vi } from 'vitest';

// `<Toast>` is always rendered through `<Toaster>`: a Radix toast root outside its provider
// throws, and mounting a bare provider here would test a stack the app never builds.
import { toastSpec } from '@components/ui/Toast';
import type { ToastSpec } from '@components/ui/Toast';
import { MAX_VISIBLE_TOASTS, Toaster, trimToasts } from '@components/ui/Toaster';
import { renderBare, screen } from '@/test/render';

function spec(overrides: Partial<ToastSpec> = {}): ToastSpec {
  return {
    id: 'toast_1',
    title: 'Refund submitted',
    tone: 'success',
    durationMs: 5_000,
    ...overrides,
  };
}

describe('toastSpec', () => {
  it('gives a success toast a finite duration', () => {
    expect(toastSpec('t1', 'success', 'Saved').durationMs).toBe(5_000);
  });

  it('gives a danger toast no duration at all — errors are sticky', () => {
    expect(toastSpec('t1', 'danger', 'Refund failed').durationMs).toBeNull();
  });

  it('honours an explicit duration for a non-error tone', () => {
    expect(toastSpec('t1', 'info', 'Draft saved', { durationMs: 1_500 }).durationMs).toBe(1_500);
  });

  it('does not let an explicit duration make an error toast disappear', () => {
    expect(toastSpec('t1', 'danger', 'Boom', { durationMs: 100 }).durationMs).toBeNull();
  });

  it('omits optional keys rather than setting them undefined', () => {
    const bare = toastSpec('t1', 'info', 'Hello');

    expect(Object.hasOwn(bare, 'description')).toBe(false);
    expect(Object.hasOwn(bare, 'action')).toBe(false);
  });

  it('carries a description and an action when given', () => {
    const onSelect = vi.fn();
    const full = toastSpec('t1', 'warning', 'Payout delayed', {
      description: 'The bank rejected it.',
      action: { label: 'View payout', onSelect },
    });

    expect(full.description).toBe('The bank rejected it.');
    expect(full.action?.label).toBe('View payout');
  });
});

describe('rendering one toast', () => {
  function renderToast(overrides: Partial<ToastSpec> = {}) {
    const onDismiss = vi.fn();
    const result = renderBare(
      <Toaster toasts={[spec(overrides)]} onDismiss={onDismiss} />,
    );
    return { ...result, onDismiss };
  }

  it('shows the title', () => {
    renderToast();

    expect(screen.getByText('Refund submitted')).toBeInTheDocument();
  });

  it('shows the description underneath', () => {
    renderToast({ description: 'It will reach the customer in 5 days.' });

    expect(screen.getByText('It will reach the customer in 5 days.')).toBeInTheDocument();
  });

  it('offers a labelled dismiss control', () => {
    renderToast();

    expect(screen.getByRole('button', { name: 'Dismiss notification' })).toBeInTheDocument();
  });

  it('reports a dismissal to the host', async () => {
    const { user, onDismiss } = renderToast();

    await user.click(screen.getByRole('button', { name: 'Dismiss notification' }));

    expect(onDismiss).toHaveBeenCalledWith('toast_1');
  });

  it('renders an action and calls it', async () => {
    const onSelect = vi.fn();
    const { user } = renderToast({
      action: { label: 'View payout', onSelect },
    });

    await user.click(screen.getByRole('button', { name: 'View payout' }));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('carries the tone as a modifier class rather than only as a colour', () => {
    const { container } = renderBare(
      <Toaster toasts={[spec({ tone: 'danger', durationMs: null })]} onDismiss={vi.fn()} />,
    );

    expect(container.innerHTML).toContain('pz-toast--danger');
  });
});

describe('the Toaster viewport', () => {
  it('is a labelled region a keyboard user can reach', () => {
    renderBare(<Toaster toasts={[]} onDismiss={vi.fn()} />);

    expect(screen.getByRole('region', { name: /Notifications/ })).toBeInTheDocument();
  });

  it('renders every toast it is given, up to the cap', () => {
    const toasts = Array.from({ length: 3 }, (_, index) =>
      spec({ id: `t${index}`, title: `Toast ${index}` }),
    );

    renderBare(<Toaster toasts={toasts} onDismiss={vi.fn()} />);

    expect(screen.getByText('Toast 0')).toBeInTheDocument();
    expect(screen.getByText('Toast 2')).toBeInTheDocument();
  });
});

describe('trimToasts', () => {
  it('leaves a short stack alone', () => {
    const toasts = [spec({ id: 'a' }), spec({ id: 'b' })];

    expect(trimToasts(toasts)).toHaveLength(2);
  });

  it('caps a long stack at the maximum', () => {
    const toasts = Array.from({ length: 9 }, (_, index) => spec({ id: `t${index}` }));

    expect(trimToasts(toasts)).toHaveLength(MAX_VISIBLE_TOASTS);
  });

  it('keeps the errors when it has to drop something', () => {
    const toasts = [
      spec({ id: 'err', tone: 'danger', durationMs: null, title: 'Refund failed' }),
      ...Array.from({ length: 6 }, (_, index) => spec({ id: `ok${index}` })),
    ];

    const kept = trimToasts(toasts);

    expect(kept.map((toast) => toast.id)).toContain('err');
    expect(kept).toHaveLength(MAX_VISIBLE_TOASTS);
  });

  it('keeps the newest of the non-errors', () => {
    const toasts = Array.from({ length: 6 }, (_, index) => spec({ id: `t${index}` }));

    const kept = trimToasts(toasts, 2);

    expect(kept.map((toast) => toast.id)).toEqual(['t4', 't5']);
  });

  it('preserves the original order, so the newest is still last', () => {
    const toasts = [
      spec({ id: 'a' }),
      spec({ id: 'b', tone: 'danger', durationMs: null }),
      spec({ id: 'c' }),
    ];

    expect(trimToasts(toasts, 3).map((toast) => toast.id)).toEqual(['a', 'b', 'c']);
  });
});
