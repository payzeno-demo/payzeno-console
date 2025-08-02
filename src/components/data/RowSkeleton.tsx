/**
 * Loading rows.
 *
 * Rendered inside `<tbody>` while a list query is pending. The bars vary in width across cells
 * and across rows: a grid of identical grey rectangles reads as a rendering bug, not as
 * loading. The widths come from a fixed pattern rather than `Math.random()` so that snapshot
 * tests are stable and so two renders of the same table do not jitter.
 *
