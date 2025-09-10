/**
 * The "nothing here" state for a table.
 *
 * This component has two call shapes, which is one more than it should have:
 *
 *  1. `<EmptyRows columnCount={n}>{node}</EmptyRows>` — what `<DataTable>` renders internally.
 *     It has to be a `<tr><td colSpan>` because it lives inside a `<tbody>`, and a bare `<div>`
 *     there is invalid HTML that Safari silently hoists out of the table.
 *  2. `<EmptyRows title="…" body="…" />` — what feature tables pass **as** `emptyState`, i.e.
 *     the node that shape 1 will wrap.
 *
 * TODO(rrefactor): split into `<EmptyRowsCell>` (shape 1) and `<EmptyState>` (shape 2) —
 * PAY-1968. Every attempt so far has touched thirty files and been bounced for scope.
 *
 * a11y: the message is inside the table's own row so it is reachable by table navigation, and
 * the cell gets `role="cell"` implicitly. It is not a live region — the table's `aria-busy`
