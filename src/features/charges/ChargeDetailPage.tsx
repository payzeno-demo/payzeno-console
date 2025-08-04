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
