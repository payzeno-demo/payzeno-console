/**
 * Whole-route loading state.
 *
 * Used by detail pages, which have nothing useful to show until their one query resolves. List
 * pages do **not** use this — they render `<DataTable isLoading>` so the header, filters and
 * column layout stay put, and the page does not jump when rows arrive.
 *
 * a11y (tflexbox): one `role="status"` for the whole page, announced once. Skeleton bars are
 * `aria-hidden`. The 200ms delay before anything renders is deliberate — a flash of skeleton
 * for a 40ms cached response is worse than nothing at all.
 */
import { useEffect, useState } from 'react';

import { pz } from '@lib/cn';

import { Skeleton } from '../ui/Skeleton';
import { Spinner } from '../ui/Spinner';
import { color, font, space, visuallyHidden } from '../ui/tokens';

export interface LoadingPageProps {
  /** Announced to assistive technology: "Loading settlement batch". */
  label: string;
  /** `skeleton` mimics a detail page; `spinner` is for anything with no predictable shape. */
  variant?: 'skeleton' | 'spinner';
  /** Milliseconds before anything is painted. Stops the sub-100ms flash. */
  delayMs?: number;
}

export function LoadingPage({ label, variant = 'skeleton', delayMs = 200 }: LoadingPageProps) {
  const [visible, setVisible] = useState(delayMs === 0);

  useEffect(() => {
    if (delayMs === 0) return undefined;
    const timer = setTimeout(() => setVisible(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  return (
    <div role="status" aria-busy="true" className={pz('loading-page')} style={{ padding: space[6] }}>
      <span style={visuallyHidden as React.CSSProperties}>{label}</span>

      {!visible ? null : variant === 'spinner' ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: space[3],
            fontFamily: font.family,
            fontSize: font.size.md,
            color: color.textSecondary,
          }}
        >
          <Spinner size="md" label="" />
          <span aria-hidden="true">{label}…</span>
        </div>
      ) : (
        <div aria-hidden="true" style={{ display: 'grid', gap: space[4], maxWidth: '900px' }}>
          {/* page title */}
          <Skeleton width="320px" height="28px" />
          {/* subtitle */}
          <Skeleton width="480px" height="14px" />

          {/* the card grid a detail page usually opens with */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: space[4] }}>
            <Skeleton height="88px" />
            <Skeleton height="88px" />
            <Skeleton height="88px" />
          </div>

          {/* the detail list underneath it */}
          <div style={{ display: 'grid', gap: space[2] }}>
            <Skeleton width="70%" height="14px" />
            <Skeleton width="55%" height="14px" />
            <Skeleton width="85%" height="14px" />
            <Skeleton width="40%" height="14px" />
          </div>
        </div>
      )}
    </div>
  );
}
