/**
 * Cursor pagination state for a list view.
 *
 * The API is cursor-based (`Paginated<T>.next_cursor`), so there is no page number and no
 * total. "Previous" works because we remember the cursors we have already used — see
 * `types/table.ts::previousPage`.
 */
import { useCallback, useMemo, useState } from 'react';
