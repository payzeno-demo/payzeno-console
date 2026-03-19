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

