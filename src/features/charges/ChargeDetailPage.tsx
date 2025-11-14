/**
 * `ChargeDetailPage` — child route of `ChargesPage`.
 *
 * The charge is the money object support and finance actually argue about, so this page is
 * deliberately dense: authorisation identifiers, the 3DS result (which decides who eats a
 * fraudulent chargeback), the settlement batch, and the double-entry postings.
 *
 * Refunding is the one mutation reachable from here, and it opens the refunds feature's
 * dialog rather than reimplementing it — there is exactly one refund form in this repo.
 */
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { ErrorState } from '@components/feedback/ErrorState';
import { LoadingPage } from '@components/feedback/LoadingPage';
import { NotFound } from '@components/feedback/NotFound';
import { PageContainer } from '@components/layout/PageContainer';
import { PageHeader } from '@components/layout/PageHeader';
import { Alert } from '@components/ui/Alert';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { CardBrandCell } from '@components/data/CardBrandCell';
import { DateCell } from '@components/data/DateCell';
import { IdCell } from '@components/data/IdCell';
