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
  scopes?: ApiKeyScope[];
}

export interface UseCreateApiKeyResult {
  createApiKey: (args: CreateApiKeyArgs) => void;
  isPending: boolean;
  /** The metadata of the key just created. Safe to render anywhere. */
  createdKey: ApiKey | null;
  /** The plaintext secret. Shown once, then dropped. Never cached. */
  secret: string | null;
  clearSecret: () => void;
  errorMessage: string | null;
  fieldErrors: Record<string, string>;
}

export function useCreateApiKey(): UseCreateApiKeyResult {
  const endpoints = useEndpoints();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [createdKey, setCreatedKey] = useState<ApiKey | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    ...createApiKeyMutation(endpoints),
    onMutate: () => {
      setErrorMessage(null);
      setFieldErrors({});
    },
    onSuccess: async (response) => {
      // Split the response: metadata one way, secret the other. Only the metadata may be
      // held anywhere a devtools snapshot can reach.
      const { secret: plaintext, ...metadata } = response;
      setCreatedKey(metadata);
      setSecret(plaintext);

      toast.success('Key created. Copy it now — it is not shown again.');
