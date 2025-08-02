/**
 * "You are on staging" strip.
 *
 * Rendered on every environment except production. It exists because staging and production
 * look identical, the merchant switcher works on both, and someone once refunded a real charge
 * from what they thought was staging (PAY-1721 — the postmortem is short and unhappy).
 *
 * The build sha is in the banner so that a bug report from QA carries it without anyone having
 * to ask.
 *
 * a11y: `role="status"` and *not* focusable. It is ambient information, and putting it in the
 * tab order in front of the skip link would be actively hostile.
 */
import { pz } from '@lib/cn';

import { runtimeConfig } from '@config/runtime';
