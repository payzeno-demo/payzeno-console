# ADR 0003 — No card data in the console

- **Status:** Accepted
- **Date:** month 5
- **Author:** Dudi Hotfix (CTO)
- **Reviewers:** Tal Flexbox
- **Owner of this file:** `@dhotfix` (see `CODEOWNERS`)

## Context

Until month 5 the console had `src/components/form/CardNumberInput.tsx`. It collected a PAN,
CVV and expiry, and POSTed them to payzeno-api, which forwarded them to the acquirer.

That single component put the browser bundle, the CDN that serves it, payzeno-api, every
payzeno-api log sink, the Sentry project and the request-tracing pipeline inside PCI DSS scope.
The assessment that followed cost more than the feature was worth, and the finding that ended
the argument was not about the card field at all: it was a `console.debug` of the raw response
body in `src/api/http/response-parser.ts`, added while debugging a 502, which meant PANs were
reaching the browser console and — via a Sentry breadcrumb — Sentry.

Scope is not a property of the field. It is a property of everything the field's bytes touch.

## Consequences

- The console cannot re-render a saved card. It has a `CardSummary` (brand, last four, expiry)
  and that is all the API will give it. `components/data/CardBrandCell.tsx` renders from that.
- A vault outage breaks card entry and nothing else. `VaultTokenisationError`
  (`src/lib/errors.ts`) is a client-side error branch, not an HTTP one, because there is no
  Payzeno response involved.
- Two failure paths for one form: the vault call can fail before the payzeno-api call is ever
  made. `TokenizedCardInput` owns the first and reports it inline; the page owns the second.
- Sentry issues from card-entry code are less useful than they would otherwise be, because the
  redaction is aggressive and false-positives on things like a long numeric reference. That is
  the trade and it is not up for renegotiation.

## Alternatives considered

**Keep collecting the PAN, redact it server-side.** This is what we were doing. Redaction is a
control that fails open: it protects the paths someone remembered.

**An iframe-based vault field.** Genuinely stronger — the PAN would never enter our origin at
all, so even a compromised bundle could not read it. Rejected only on cost and a11y: the
acquirer's hosted field could not be labelled or error-described the way the rest of our forms
are. Revisit if the vendor ships an accessible one.
