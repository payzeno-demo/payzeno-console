/**
 * The one table.
 *
 * Every list feature renders this. It owns sorting (client-side, single key), the loading and
 * empty states, and the a11y contract that `DataTable.test.tsx` asserts:
 *
 *  - a real `<caption>` — required prop, no default;
 *  - `aria-sort` on the sorted header and nowhere else;
