## What

<!-- One or two sentences. The ticket has the detail. -->

PAYZ-

## Why

## Screenshots

| before | after |
| --- | --- |
|  |  |

## a11y checklist

- [ ] every input has an associated `<label>`
- [ ] every error is wired with `aria-describedby`
- [ ] every `<DataTable>` has a meaningful `caption`
- [ ] icon-only buttons have an accessible name
- [ ] keyboard path works end to end (tab, enter, escape)
- [ ] no hex literal outside `components/ui/tokens.ts`

## Risk

- [ ] touches `src/api/legacy/` (say why)
- [ ] touches a PCI-listed file (needs @dhotfix)
- [ ] changes a route path or a query key
