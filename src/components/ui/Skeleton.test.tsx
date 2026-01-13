/**
 * `Skeleton` and `SkeletonText`.
 *
 * A skeleton is decoration for a state a screen reader is already told about via
 * `aria-busy` on the table. If it were exposed, a loading list would be announced as a dozen
 * empty items, which is worse than silence — hence the `aria-hidden` assertions below.
 */
import { describe, expect, it } from 'vitest';

import { SKELETON_KEYFRAMES, Skeleton, SkeletonText } from '@components/ui/Skeleton';
import { renderBare } from '@/test/render';

describe('Skeleton', () => {
  it('is hidden from assistive technology', () => {
    const { container } = renderBare(<Skeleton />);

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('exposes no accessible content at all', () => {
    const { container } = renderBare(<Skeleton />);

    expect(container.textContent).toBe('');
  });

  it('fills its container by default', () => {
    const { container } = renderBare(<Skeleton />);

    expect(container.firstElementChild).toHaveStyle({ width: '100%', height: '14px' });
  });

  it('accepts an explicit width and height', () => {
    const { container } = renderBare(<Skeleton width="45%" height="12px" />);

    expect(container.firstElementChild).toHaveStyle({ width: '45%', height: '12px' });
  });

  it('renders a circle for an avatar placeholder', () => {
    const { container: round } = renderBare(<Skeleton circle width="24px" height="24px" />);
    const { container: square } = renderBare(<Skeleton width="24px" height="24px" />);

    expect((round.firstElementChild as HTMLElement).style.borderRadius).not.toBe(
      (square.firstElementChild as HTMLElement).style.borderRadius,
    );
  });

  it('carries the shared pulse animation, so every skeleton on the page beats together', () => {
    const { container } = renderBare(<Skeleton />);

    expect((container.firstElementChild as HTMLElement).style.animation).toContain('pz-pulse');
  });

  it('accepts an extra class name', () => {
    const { container } = renderBare(<Skeleton className="mine" />);

    expect(container.firstElementChild?.className).toContain('mine');
    expect(container.firstElementChild?.className).toContain('pz-skeleton');
  });
});

describe('SkeletonText', () => {
  it('renders three lines by default', () => {
    const { container } = renderBare(<SkeletonText />);

    expect(container.querySelectorAll('.pz-skeleton')).toHaveLength(3);
  });

  it('renders the number of lines asked for', () => {
    const { container } = renderBare(<SkeletonText lines={6} />);

    expect(container.querySelectorAll('.pz-skeleton')).toHaveLength(6);
  });

  it('varies the line widths, so it reads as text rather than as a bar chart', () => {
    const { container } = renderBare(<SkeletonText lines={4} />);
    const widths = [...container.querySelectorAll('.pz-skeleton')].map(
      (node) => (node as HTMLElement).style.width,
    );

    expect(new Set(widths).size).toBeGreaterThan(1);
  });

  it('hides the whole block from assistive technology', () => {
    const { container } = renderBare(<SkeletonText />);

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders nothing when asked for zero lines', () => {
    const { container } = renderBare(<SkeletonText lines={0} />);

    expect(container.querySelectorAll('.pz-skeleton')).toHaveLength(0);
  });
});

describe('SKELETON_KEYFRAMES', () => {
  it('defines the animation the component references', () => {
    expect(SKELETON_KEYFRAMES).toContain('@keyframes pz-pulse');
  });

  it('turns the animation off under prefers-reduced-motion', () => {
    expect(SKELETON_KEYFRAMES).toContain('prefers-reduced-motion');
    expect(SKELETON_KEYFRAMES).toContain('animation: none');
  });
});
