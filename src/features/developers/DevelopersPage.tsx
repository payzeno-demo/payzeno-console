/**
 * `DevelopersPage` — API keys, webhook endpoints and webhook delivery, in one route.
 * `ApiKeyDetailPage` and `WebhookEventDetailPage` are its children.
 *
 * The create-key form lives inline rather than in a dialog: the secret reveal that follows it
 * must stay on screen while the developer copies the key, and a dialog that closes takes the
 * only copy of the secret with it.
 */
import { useState } from 'react';

import { API_KEY_SCOPES } from '@payzeno/contracts';
import type { ApiKeyMode, ApiKeyScope, PublicEventType } from '@payzeno/contracts';

import { DataTable } from '@components/data/DataTable';
import { DataTablePagination } from '@components/data/DataTablePagination';
import { EmptyRows } from '@components/data/EmptyRows';
import { FilterBar } from '@components/data/FilterBar';
import { ErrorState } from '@components/feedback/ErrorState';
import { InlineError } from '@components/feedback/InlineError';
import { PageContainer } from '@components/layout/PageContainer';
import { PageHeader } from '@components/layout/PageHeader';
import { Alert } from '@components/ui/Alert';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
