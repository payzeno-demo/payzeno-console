/**
 * `useCreatePrice()` — `POST /v1/prices` (RFC platform-v2 §6).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import type { CreatePriceRequest, Price } from '@payzeno/contracts';

import { ConsoleApiError, ValidationApiError } from '@api/errors';
import { queryKeys } from '@api/queryKeys';
import { useEndpoints } from '@app/ApiContext';
import { useToast } from '@app/ToastProvider';

import { createPriceMutation } from './billing.queries';

export interface UseCreatePriceResult {
  createPrice: (request: CreatePriceRequest) => void;
  isPending: boolean;
  errorMessage: string | null;
  fieldErrors: Record<string, string>;
  createdPrice: Price | null;
  reset: () => void;
}

export function useCreatePrice(): UseCreatePriceResult {
  const endpoints = useEndpoints();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [createdPrice, setCreatedPrice] = useState<Price | null>(null);

  const mutation = useMutation({
    ...createPriceMutation(endpoints),
    onSuccess: async (price: Price) => {
      setCreatedPrice(price);
      toast.success(`Price ${price.product_name} created.`);
      await queryClient.invalidateQueries({ queryKey: queryKeys.prices.all });
    },
  });

  const createPrice = useCallback(
    (request: CreatePriceRequest) => {
      setCreatedPrice(null);
      mutation.mutate(request);
    },
    [mutation],
  );

  const reset = useCallback(() => {
    setCreatedPrice(null);
    mutation.reset();
  }, [mutation]);

  const error = mutation.error;
  let errorMessage: string | null = null;
  let fieldErrors: Record<string, string> = {};
  if (error instanceof ValidationApiError) {
    fieldErrors = error.fieldErrorMap();
    errorMessage = 'Check the highlighted fields.';
  } else if (error instanceof ConsoleApiError) {
    errorMessage = error.message;
  } else if (error) {
    errorMessage = 'The price could not be created. Try again in a moment.';
  }

  return {
    createPrice,
    isPending: mutation.isPending,
    errorMessage,
    fieldErrors,
    createdPrice,
    reset,
  };
}
