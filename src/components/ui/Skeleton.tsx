/**
 * Skeleton placeholder.
 *
 * Always `aria-hidden`. A skeleton is a visual promise, not content — the announcement comes
 * from the surrounding `role="status"` (see `<RowSkeleton>` and `<LoadingPage>`). Screen
 * readers reading out fourteen "loading" placeholders is worse than silence.
 */
import { cn, pz } from '@lib/cn';

import { color, radius, space } from './tokens';

export interface SkeletonProps {
  /** CSS width. Vary it across a group — identical bars read as a rendering bug. */
  width?: string;
  height?: string;
  /** Pill shape, for avatar and badge placeholders. */
  circle?: boolean;
  className?: string;
}

export function Skeleton({ width = '100%', height = '14px', circle = false, className }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(pz('skeleton'), className)}
      style={{
        display: 'block',
        width,
        height,
        background: color.surfaceSunken,
        borderRadius: circle ? radius.pill : radius.sm,
        animation: 'pz-pulse 1600ms ease-in-out infinite',
      }}
    />
  );
}

/**
 * A block of skeleton lines with varied widths, for card bodies and detail panels.
 */
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  const widths = ['92%', '78%', '85%', '64%'];

  return (
    <div aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', gap: space[2] }}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} width={widths[index % widths.length]} />
      ))}
    </div>
  );
}

export const SKELETON_KEYFRAMES = `
@keyframes pz-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.55; } }
@media (prefers-reduced-motion: reduce) {
  .pz-skeleton { animation: none; }
}
`;
