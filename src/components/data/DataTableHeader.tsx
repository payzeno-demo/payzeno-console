/**
 * Table header row.
 *
 * A sortable header is a `<button>` inside the `<th>`, not a click handler on the `<th>`: the
 * cell needs to stay a table header for the accessibility tree, and the control needs to be
 * focusable. `aria-sort` goes on the `<th>`, per the ARIA spec, and on exactly one at a time.
