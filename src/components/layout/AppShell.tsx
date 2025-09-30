/**
 * The application chrome: environment banner, top bar, side nav, content column.
 *
 * This is the file that mounts `<NotificationBell />`, which is the **one** declared
 * `components → features` import in the repo (interfaces.md §4.1 puts the bell in the shell,
 * and `features/notifications` has no page of its own to put it on). The eslint-disable below
 * is the whole exception; there is exactly one other, in `components/data/ExportCsvButton.tsx`,
 * and it has a ticket.
 *
 * Accessibility contract, asserted by `AppShell.test.tsx`:
 *  - a skip link is the first focusable element on the page and targets `#main-content`;
 *  - exactly one `role="banner"`, one `role="navigation"` named "Primary", one `<main>`;
 *  - the route-change announcement lives in one polite live region here, not per page;
 *  - the design tokens are written to `:root` once, from `cssVariables()`.
 *
 * Session data comes from props when the caller has it and from `SessionContext` otherwise, so
 * the shell can be rendered in a test without standing up every provider.
 */
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

import type { Merchant, User } from '@payzeno/contracts';

import { useSessionContext } from '@app/SessionContext';
// eslint-disable-next-line no-restricted-imports -- interfaces.md §4.1: the bell lives in the shell
import { NotificationBell } from '@features/notifications/NotificationBell';
import { pz } from '@lib/cn';
