/**
 * `ApiKeyDetailPage` — child route of `DevelopersPage`.
 *
 * Exists because `ResourceEndpoint.get(id)` is mandatory on all ten concretes
 * (interfaces.md §4.2), and because a developer chasing a `401 invalid_api_key` in their logs
 * has a key id and nothing else. The page answers: is this key live, is it revoked, and what
 * is it allowed to do.
 *
 * It never shows the secret. There is no code path in this repo that can.
 */
import { useParams } from 'react-router-dom';

import { ErrorState } from '@components/feedback/ErrorState';
import { LoadingPage } from '@components/feedback/LoadingPage';
import { NotFound } from '@components/feedback/NotFound';
import { PageContainer } from '@components/layout/PageContainer';
import { PageHeader } from '@components/layout/PageHeader';
import { Alert } from '@components/ui/Alert';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
