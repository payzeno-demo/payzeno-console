/**
 * `useCreateApiKey()` — `POST /v1/api-keys`.
 *
 * The plaintext secret comes back once and only once. It lives in this hook's state, is
 * handed straight to `<SecretRevealOnce />`, and is dropped by `clearSecret()` when that
 * component unmounts. It is never written into the query cache, never logged, and never sent
 * to telemetry — `trackEvent` below carries the mode and the scope count and nothing else.
 *
 * dhotfix reviews this file. Adding the secret to any object that leaves this module is a
 * review rejection.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import type { ApiKey, ApiKeyMode, ApiKeyScope, CreateApiKeyRequest } from '@payzeno/contracts';

import { ConsoleApiError, ForbiddenError, ValidationApiError } from '@api/errors';
import { queryKeys } from '@api/queryKeys';
import { useEndpoints } from '@app/ApiContext';
import { useToast } from '@app/ToastProvider';
import { trackEvent } from '@lib/telemetry';

import { createApiKeyMutation } from './developers.queries';

export interface CreateApiKeyArgs {
  name: string;
  mode: ApiKeyMode;
