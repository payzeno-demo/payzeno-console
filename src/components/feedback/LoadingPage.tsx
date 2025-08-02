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
