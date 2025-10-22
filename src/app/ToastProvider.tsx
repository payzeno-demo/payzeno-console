/**
 * Toasts.
 *
 * Owns the queue and mounts `<Toaster />` exactly once. `useToast()` is what every mutation
 * hook calls on success or failure.
 *
 * Rules the API shape enforces, learned the hard way:
 *  - `error()` toasts never auto-dismiss. A five-second error is an error nobody read.
 *  - Success toasts are short and do not stack: `success()` replaces the previous success
 *    rather than queueing behind it, because a bulk retry of forty settlement items should not
 *    produce forty toasts (that happened, during the incident — the-incident.md §5).
 *  - There is no `toast(component)`. A toast carries a title, a description and at most one
 *    action, so it cannot grow into a second dialog system.
 */
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { TOAST_DURATION_MS } from '@config/constants';
import { newRequestId } from '@lib/ids';
