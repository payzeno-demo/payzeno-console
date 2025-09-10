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
