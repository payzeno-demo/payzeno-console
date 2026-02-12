/**
 * `ColumnDef<ApiKeyRow>[]`.
 *
 * The key column renders `prefix…last_four` and nothing else. There is no "reveal" control
 * and no copy-the-secret action: the plaintext exists exactly once, in
 * `<SecretRevealOnce />`, immediately after creation.
 */
import { Link } from 'react-router-dom';

import type { ApiKeyScope } from '@payzeno/contracts';

import type { ColumnDef } from '@components/data/DataTable';
import { DateCell } from '@components/data/DateCell';
import { StatusPill } from '@components/data/StatusPill';
import { listSentence, pluralise } from '@lib/format';
import { ROUTES } from '@/routes';
