/**
 * A Payzeno resource id, in a table cell.
 *
 * Ids are long (`pi_01HX9K3M7QW2R4T5Y6U7V8W9X0`) and every finance person we watched using the
 * console did the same two things with them: squinted at the last few characters to tell two
 * rows apart, then copied the whole thing into a support ticket. So: truncate in the middle,
 * keep the full value in `title` and in the clipboard.
