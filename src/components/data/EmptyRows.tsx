/**
 * The "nothing here" state for a table.
 *
 * This component has two call shapes, which is one more than it should have:
 *
 *  1. `<EmptyRows columnCount={n}>{node}</EmptyRows>` — what `<DataTable>` renders internally.
 *     It has to be a `<tr><td colSpan>` because it lives inside a `<tbody>`, and a bare `<div>`
 *     there is invalid HTML that Safari silently hoists out of the table.
