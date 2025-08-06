import { Link } from 'react-router-dom';

import type { ChargeStatus, DeclineCode } from '@payzeno/contracts';

import type { ColumnDef } from '@components/data/DataTable';
import { AcquirerCell } from '@components/data/AcquirerCell';
import { CardBrandCell } from '@components/data/CardBrandCell';
import { DateCell } from '@components/data/DateCell';
import { IdCell } from '@components/data/IdCell';
import { MoneyCell } from '@components/data/MoneyCell';
import { StatusPill } from '@components/data/StatusPill';
import { ROUTES } from '@/routes';
import type { ChargeRow } from '@types/view-models';

/** Plain-English decline reasons. Merchants forward these to their customers verbatim. */
export function explainDecline(code: DeclineCode): string {
  switch (code) {
    case 'do_not_honor':
      return 'The issuer declined without a reason.';
    case 'insufficient_funds':
      return 'Not enough funds on the card.';
    case 'lost_card':
    case 'stolen_card':
      return 'The card was reported lost or stolen.';
    case 'expired_card':
      return 'The card has expired.';
    case 'incorrect_cvc':
      return 'The security code did not match.';
    case 'processing_error':
      return 'The card network had a processing error.';
    case 'issuer_unavailable':
      return 'The issuing bank could not be reached.';
    case 'velocity_exceeded':
      return 'Too many attempts on this card.';
