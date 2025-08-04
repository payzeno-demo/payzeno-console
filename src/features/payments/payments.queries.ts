import { queryOptions } from '@tanstack/react-query';

import type {
  CancelPaymentIntentRequest,
  CapturePaymentIntentRequest,
  Paginated,
  PaymentIntent,
  PaymentIntentListQuery,
  PaymentIntentResponse,
} from '@payzeno/contracts';

import type { EndpointRegistry } from '@api/endpoints';
import { queryKeys } from '@api/queryKeys';
import { DEFAULT_PAGE_SIZE } from '@config/constants';

/** The ONLY caller of `PaymentIntentsEndpoint` in the repo. */
export function paymentIntentsListQuery(e: EndpointRegistry, q?: PaymentIntentListQuery) {
  const query: PaymentIntentListQuery = { limit: DEFAULT_PAGE_SIZE, ...(q ?? {}) };
  return queryOptions<Paginated<PaymentIntent>>({
    queryKey: queryKeys.paymentIntents.list(query),
    queryFn: () => e.paymentIntents.list(query),
    staleTime: 20_000,
  });
}

export function paymentIntentQuery(e: EndpointRegistry, id: string) {
  return queryOptions<PaymentIntent>({
    queryKey: queryKeys.paymentIntents.detail(id),
    queryFn: () => e.paymentIntents.get(id),
    staleTime: 10_000,
  });
}

export interface CaptureInput {
  paymentIntentId: string;
  request: CapturePaymentIntentRequest;
}

export function capturePaymentIntentMutation(e: EndpointRegistry) {
  return {
    mutationKey: ['payment_intents', 'capture'] as const,
    mutationFn: ({ paymentIntentId, request }: CaptureInput): Promise<PaymentIntentResponse> =>
      e.paymentIntents.capture(paymentIntentId, request),
  };
}

export interface CancelInput {
  paymentIntentId: string;
  request: CancelPaymentIntentRequest;
}

export function cancelPaymentIntentMutation(e: EndpointRegistry) {
  return {
    mutationKey: ['payment_intents', 'cancel'] as const,
    mutationFn: ({ paymentIntentId, request }: CancelInput): Promise<PaymentIntentResponse> =>
      e.paymentIntents.cancel(paymentIntentId, request),
  };
}
