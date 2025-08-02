/**
 * The application header.
 *
 * Left to right: the mobile nav trigger, the wordmark, the merchant switcher; then, pushed
 * right, the livemode toggle, the notification bell and the user menu.
 *
 * The bell itself is passed in as a prop rather than imported here — `AppShell` owns the one
 * declared `components → features` import (see the eslint-disable there), and duplicating it
 * in a second file would make the exception look like a pattern.
 *
 * a11y: `<header role="banner">` with the nav trigger first in the tab order, because a
 * keyboard user reaching for navigation should not have to tab past six controls.
 */
import type { ReactNode } from 'react';

import type { Merchant, User } from '@payzeno/contracts';

import { pz } from '@lib/cn';

import { IconButton } from '../ui/IconButton';
import { color, font, layout, space } from '../ui/tokens';

