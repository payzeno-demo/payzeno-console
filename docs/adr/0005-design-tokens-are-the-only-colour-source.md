# ADR 0005 — Design tokens are the only colour source

- **Status:** Accepted
- **Date:** month 3
- **Author:** Tal Flexbox (Web)
- **Reviewers:** Roni Refactor

## Context

A search for hex literals in month 3 found 61 of them across 34 files, spelling eleven
different greys and four different "our blue"s. Three of the greys were within one step of each
other and had been introduced by three separate PRs that each thought they were matching an
existing colour.

The specific bug that forced the issue: the settlement status pill used `#d94141` for `failed`,
the payout status pill used `#d64545`, and the disputes badge used `#dc3545` because someone
pasted it from Bootstrap. On a 200-row settlement page next to a payouts page, they read as
three different severities. They were meant to be one.

Colour is also an accessibility surface, and a literal cannot carry a contrast guarantee.

## Decision

**`src/components/ui/tokens.ts` is the only place a colour or spacing value is written.**

- Tokens are semantic. `color.danger`, never `color.red`; `color.textMuted`, never
  `color.grey500`. A name that describes the value instead of the role gets rejected in review,
  because it is the rename you cannot do later.
- The values are emitted as CSS custom properties by `cssVariables()`, mounted once by
  `<AppShell/>`. That is what lets dark mode and the print stylesheet override them without a
  re-render, while the TS objects keep every call site type-checked.
- **A hex literal outside this file is a review rejection.** Yes, in a chart:
  `components/charts/chart-theme.ts` reads the tokens and hands recharts an object.
- Every contrast pair used for text is checked at 4.5:1 against its surface. Where a token pair
  cannot reach it, the token does not exist.

The corollary that comes up most: **colour is never the only signal.** `StatusPill` carries a
label, `AcquirerCell` carries text alongside its dot, and `DuplicateBadge` says "duplicate".
A reviewer asking "what does this look like in greyscale?" is asking the ADR 0005 question.

## Consequences

- Adding a colour is a conversation about what role it plays. That is slower, and it is the
  point. The palette has grown by four entries in nine months.
- `tokens.ts` has ~24 importers — every `ui/` primitive, most of `data/` and `feedback/`. It is
  one of the hottest files in the repo, and a token rename is a wide diff. Accepted: the diff
  is mechanical and reviewable, which is more than the previous state offered.
- Third-party components that ship their own CSS (recharts, the Radix primitives) are the
  exception the rule has to route around. Radix is unstyled, so it is fine. Recharts is styled
  through `chart-theme.ts` and nowhere else.
- One-off "just this once" shades genuinely do not exist any more. The eleven greys are five.

## Alternatives considered

**Tailwind.** Would enforce a palette by construction and delete most of our style objects.
Rejected on timing more than principle: adopting it mid-life means a period where two styling
systems are both correct, and this repo already carries one of those (see ADR 0004).

**CSS custom properties only, no TS object.** Loses the type check at the call site, which is
what actually catches `color.dangre` in CI rather than in review. We emit both from one source
instead.
