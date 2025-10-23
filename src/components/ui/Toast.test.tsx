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

  function renderToast(overrides: Partial<ToastSpec> = {}) {
    const onDismiss = vi.fn();
    const result = renderBare(
      <Toaster toasts={[spec(overrides)]} onDismiss={onDismiss} />,
    );
    return { ...result, onDismiss };
  }

  it('offers a labelled dismiss control', () => {
    renderToast();

    expect(screen.getByRole('button', { name: 'Dismiss notification' })).toBeInTheDocument();
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

});
